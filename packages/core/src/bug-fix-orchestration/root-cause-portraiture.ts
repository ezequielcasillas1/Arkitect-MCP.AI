import type {
  BugEvidenceItem,
  BugSymptomCategory,
  DiagnosisResult,
  RootCauseCandidate,
  RootCauseCategory,
  RootCausePortrait,
  RootCausePortraitInput,
  RootCausePortraitResult
} from "@arkitect/contracts";

const CAUSE_LABELS: Record<RootCauseCategory, string> = {
  "incorrect-assumption": "Incorrect assumption",
  "missing-guard": "Missing guard",
  "stale-contract": "Stale contract",
  "race-or-timing": "Race or timing",
  "dependency-mismatch": "Dependency mismatch",
  "config-drift": "Configuration drift",
  "state-corruption": "State corruption",
  "architectural-boundary-leak": "Architectural boundary leak",
  "test-gap": "Test gap",
  unknown: "Unknown cause"
};

function normalizeText(...parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join("\n").toLowerCase();
}

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

function detectSymptomCategory(text: string, failingTests: string[]): BugSymptomCategory {
  if (failingTests.length > 0 || includesAny(text, ["flaky", "intermittent"])) {
    if (includesAny(text, ["flaky", "intermittent"])) {
      return "flaky-test";
    }
    return "regression";
  }
  if (includesAny(text, ["timeout", "slow", "latency", "perf"])) {
    return "performance";
  }
  if (includesAny(text, ["env", "config", "secret", "missing key"])) {
    return "configuration";
  }
  if (includesAny(text, ["econn", "cors", "webhook", "api", "integration"])) {
    return "integration-failure";
  }
  if (includesAny(text, ["typeerror", "referenceerror", "null", "undefined", "exception", "stack"])) {
    return "runtime-error";
  }
  if (includesAny(text, ["wrong", "expected", "actual", "logic", "bug"])) {
    return "logic-defect";
  }
  if (includesAny(text, ["regress"])) {
    return "regression";
  }
  return "unknown";
}

function createEvidence(
  id: string,
  kind: BugEvidenceItem["kind"],
  summary: string,
  confidence: number,
  source?: string
): BugEvidenceItem {
  return { id, kind, summary, confidence, source };
}

function collectEvidence(input: RootCausePortraitInput, diagnosis: DiagnosisResult): BugEvidenceItem[] {
  const evidence: BugEvidenceItem[] = [];
  const failingTests = input.failingTests ?? [];

  if (input.errorMessage?.trim()) {
    evidence.push(
      createEvidence("err-message", "log", input.errorMessage.trim().slice(0, 280), 0.9, "errorMessage")
    );
  }

  if (input.stackTrace?.trim()) {
    evidence.push(
      createEvidence("stack-trace", "stack", input.stackTrace.trim().slice(0, 280), 0.88, "stackTrace")
    );
  }

  for (const [index, testName] of failingTests.entries()) {
    evidence.push(
      createEvidence(`failing-test-${index + 1}`, "test-failure", testName, 0.86, "failingTests")
    );
  }

  if (input.reproductionSteps?.trim()) {
    evidence.push(
      createEvidence("repro-steps", "repro", input.reproductionSteps.trim().slice(0, 280), 0.8, "reproductionSteps")
    );
  }

  const symptomText = input.symptomText?.trim();
  if (symptomText) {
    evidence.push(createEvidence("symptom-text", "intake", symptomText.slice(0, 280), 0.72, "symptomText"));
  }

  const workload = diagnosis.signals.likelyDiagnosisIntent.final.value;
  const health = diagnosis.signals.repoHealth.final.value;
  evidence.push(
    createEvidence(
      "diagnosis-signal",
      "signal",
      `Workload/intent ${workload}; repo health ${health}; architecture ${diagnosis.signals.currentArchitecture.final.value}.`,
      0.64,
      "diagnosis"
    )
  );

  if (includesAny((input.repoSummary ?? "").toLowerCase(), ["bug", "fix", "regression", "error"])) {
    evidence.push(
      createEvidence(
        "repo-summary",
        "intake",
        (input.repoSummary ?? "").slice(0, 220),
        0.55,
        "repoSummary"
      )
    );
  }

  return evidence;
}

function scoreCause(
  category: RootCauseCategory,
  confidence: number,
  summary: string,
  evidenceIds: string[],
  falsifiers: string[]
): RootCauseCandidate {
  return {
    id: `cause-${category}`,
    category,
    label: CAUSE_LABELS[category],
    summary,
    confidence: Math.min(0.98, Math.max(0.2, confidence)),
    supportingEvidenceIds: evidenceIds,
    falsificationChecks: falsifiers
  };
}

function rankCandidates(
  text: string,
  evidence: BugEvidenceItem[],
  diagnosis: DiagnosisResult,
  symptomCategory: BugSymptomCategory
): RootCauseCandidate[] {
  const evidenceIds = evidence.map((item) => item.id);
  const candidates: RootCauseCandidate[] = [];
  const architecture = diagnosis.signals.currentArchitecture.final.value;
  const health = diagnosis.signals.repoHealth.final.value;

  if (includesAny(text, ["null", "undefined", "cannot read", "is not a function", "missing required"])) {
    candidates.push(
      scoreCause(
        "missing-guard",
        0.9,
        "Failure language matches unguarded null/undefined or missing required values.",
        evidenceIds.filter((id) => id.startsWith("err") || id.startsWith("stack") || id === "symptom-text"),
        [
          "Provide valid inputs at the failing call site and confirm the error disappears.",
          "If the error persists with valid inputs, reject missing-guard."
        ]
      )
    );
  }

  if (includesAny(text, ["type", "schema", "zod", "contract", "breaking change", "incompatible"])) {
    candidates.push(
      scoreCause(
        "stale-contract",
        0.86,
        "Symptom text points at schema/type/contract mismatch between producer and consumer.",
        evidenceIds,
        ["Diff the declared contract against the runtime payload; mismatch must exist."]
      )
    );
  }

  if (includesAny(text, ["race", "timing", "timeout", "flaky", "intermittent", "eventually"])) {
    candidates.push(
      scoreCause(
        "race-or-timing",
        0.84,
        "Intermittent or timing language suggests a race or async ordering defect.",
        evidenceIds,
        ["Reproduce deterministically with delays removed; if always fails, timing is not primary."]
      )
    );
  }

  if (includesAny(text, ["env", "config", "secret", "api key", "missing variable", ".env"])) {
    candidates.push(
      scoreCause(
        "config-drift",
        0.87,
        "Configuration or secrets language indicates environment drift from code assumptions.",
        evidenceIds,
        ["Run with documented defaults; if the bug remains, reject config-drift."]
      )
    );
  }

  if (includesAny(text, ["version", "peer dep", "module not found", "cannot find package", "dependency"])) {
    candidates.push(
      scoreCause(
        "dependency-mismatch",
        0.83,
        "Dependency resolution language indicates a package or version mismatch.",
        evidenceIds,
        ["Lockfile install on a clean machine must reproduce the same failure."]
      )
    );
  }

  if (health === "spaghetti" || health === "drifting" || architecture === "spaghetti") {
    candidates.push(
      scoreCause(
        "architectural-boundary-leak",
        0.78,
        "Unhealthy or drifting structure often lets defects cross module boundaries.",
        ["diagnosis-signal"],
        ["If the failing path stays inside one healthy module, demote boundary-leak."]
      )
    );
  }

  if (includesAny(text, ["assumed", "should have", "thought", "expected"]) || symptomCategory === "logic-defect") {
    candidates.push(
      scoreCause(
        "incorrect-assumption",
        0.74,
        "Logic mismatch between expected and actual behavior without a clear crash signature.",
        evidenceIds,
        ["Write the expected assertion first; if code already matches, reject this cause."]
      )
    );
  }

  if ((inputHasFailingTests(evidence) || symptomCategory === "regression") && candidates.length > 0) {
    candidates.push(
      scoreCause(
        "test-gap",
        0.7,
        "A regression or failing suite implies missing coverage around the primary defect.",
        evidenceIds.filter((id) => id.startsWith("failing-test") || id === "repro-steps"),
        ["If an existing test already targeted this path and was green before the change, demote test-gap."]
      )
    );
  }

  if (includesAny(text, ["corrupt", "stale state", "cache", "dirty"])) {
    candidates.push(
      scoreCause(
        "state-corruption",
        0.76,
        "State or cache language suggests corrupted or stale persisted data.",
        evidenceIds,
        ["Clear cache/state and retry; if the bug remains immediately, reject state-corruption."]
      )
    );
  }

  if (candidates.length === 0) {
    candidates.push(
      scoreCause(
        "unknown",
        0.4,
        "Insufficient signal to name a primary cause; gather stack, failing tests, and repro steps.",
        evidenceIds,
        ["Collect errorMessage, stackTrace, and failingTests, then re-run portray_root_cause."]
      )
    );
  }

  return candidates.sort((left, right) => right.confidence - left.confidence);
}

function inputHasFailingTests(evidence: BugEvidenceItem[]): boolean {
  return evidence.some((item) => item.kind === "test-failure");
}

function blastRadiusFor(
  symptomCategory: BugSymptomCategory,
  primary: RootCauseCandidate,
  diagnosis: DiagnosisResult
): RootCausePortrait["blastRadius"] {
  if (primary.category === "architectural-boundary-leak" || diagnosis.signals.repoHealth.final.value === "spaghetti") {
    return "system";
  }
  if (primary.category === "dependency-mismatch" || symptomCategory === "integration-failure") {
    return "service";
  }
  if (primary.category === "stale-contract" || primary.category === "config-drift") {
    return "module";
  }
  return "local";
}

function buildNarrative(portrait: Omit<RootCausePortrait, "portraitNarrative">): string {
  const contributors =
    portrait.contributingCauses.length > 0
      ? portrait.contributingCauses.map((cause) => cause.label).join(", ")
      : "none ranked";

  return [
    `Symptom (${portrait.symptomCategory}): ${portrait.symptomSummary}`,
    `Primary root cause: ${portrait.primaryCause.label} (${Math.round(portrait.primaryCause.confidence * 100)}%) — ${portrait.primaryCause.summary}`,
    `Contributing causes: ${contributors}`,
    `Blast radius: ${portrait.blastRadius}; portrait confidence ${Math.round(portrait.confidence * 100)}%.`,
    `Falsify by: ${portrait.primaryCause.falsificationChecks[0] ?? "gather more evidence"}`
  ].join(" ");
}

/**
 * Root-cause portraiture power unit.
 * Builds a structured cause portrait from symptoms, evidence, and diagnosis signals.
 * Report-only — does not mutate the repository.
 */
export function buildRootCausePortrait(
  diagnosis: DiagnosisResult,
  input: RootCausePortraitInput = {}
): RootCausePortrait {
  const failingTests = input.failingTests ?? [];
  const text = normalizeText(
    input.symptomText,
    input.errorMessage,
    input.stackTrace,
    input.reproductionSteps,
    input.repoSummary,
    input.requestedOutcome,
    failingTests.join(" ")
  );
  const symptomCategory = detectSymptomCategory(text, failingTests);
  const evidence = collectEvidence(input, diagnosis);
  const ranked = rankCandidates(text, evidence, diagnosis, symptomCategory);
  const primaryCause = ranked[0]!;
  const contributingCauses = ranked.slice(1, 4);
  const symptomSummary =
    input.errorMessage?.trim() ||
    input.symptomText?.trim() ||
    input.requestedOutcome?.trim() ||
    "Bug or error reported without a detailed symptom string.";

  const base = {
    id: `portrait-${primaryCause.category}`,
    title: `${CAUSE_LABELS[primaryCause.category]} portrait`,
    symptomCategory,
    symptomSummary: symptomSummary.slice(0, 320),
    primaryCause,
    contributingCauses,
    evidence,
    blastRadius: blastRadiusFor(symptomCategory, primaryCause, diagnosis),
    confidence: Number(
      (
        primaryCause.confidence * 0.7 +
        Math.min(1, evidence.reduce((sum, item) => sum + item.confidence, 0) / Math.max(evidence.length, 1)) * 0.3
      ).toFixed(3)
    ),
    nextProbes: [
      ...primaryCause.falsificationChecks.slice(0, 2),
      "Call orchestrate_bug_fix after the portrait is accepted to get a phased fix plan.",
      "Run verify_codebase or run_test_suite after any approved fix batch."
    ]
  };

  return {
    ...base,
    portraitNarrative: buildNarrative(base)
  };
}

export function buildRootCausePortraitResult(
  diagnosis: DiagnosisResult,
  input: RootCausePortraitInput = {},
  repoPath?: string
): RootCausePortraitResult {
  const portrait = buildRootCausePortrait(diagnosis, input);

  return {
    summary: `Root-cause portraiture identified ${portrait.primaryCause.label} (${Math.round(portrait.confidence * 100)}% confidence) for ${portrait.symptomCategory}.`,
    repoPath: repoPath ?? diagnosis.intake.repoPath,
    portrait,
    diagnosisContext: {
      signals: diagnosis.signals,
      decision: diagnosis.decision,
      patternGuidance: diagnosis.patternGuidance
    }
  };
}

export function createRootCausePortraitCursorGuidance(result: RootCausePortraitResult): string[] {
  const { portrait } = result;

  return [
    `Root-cause portrait for ${result.repoPath}`,
    `Primary cause: ${portrait.primaryCause.label} (${Math.round(portrait.primaryCause.confidence * 100)}%)`,
    `Symptom category: ${portrait.symptomCategory}`,
    `Blast radius: ${portrait.blastRadius}`,
    `Evidence items: ${portrait.evidence.length}`,
    portrait.portraitNarrative,
    "Do not apply fixes until orchestrate_bug_fix runs and explicit fix intent is confirmed.",
    "Falsify the primary cause before coding when confidence is below 70%.",
    "Honor recommend_architecture / selectedArchitectureId before structural repair work."
  ];
}
