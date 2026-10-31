import type {
  BugFixOrchestrationInput,
  BugFixOrchestrationPhase,
  BugFixOrchestrationResult,
  BugFixStrategyRecommendation,
  DiagnosisResult,
  RootCausePortrait
} from "@arkitect/contracts";
import { defaultArchitecturePolicy } from "../diagnosis-result.js";
import { BUG_FIX_STRATEGIES, listBugFixStrategies } from "./bug-fix-strategies-catalog.js";
import { buildRootCausePortrait } from "./root-cause-portraiture.js";

function recommendStrategies(portrait: RootCausePortrait): BugFixStrategyRecommendation[] {
  const causeIds = [portrait.primaryCause, ...portrait.contributingCauses].map((cause) => cause.id);
  const categories = new Set([portrait.primaryCause, ...portrait.contributingCauses].map((cause) => cause.category));

  const scored = BUG_FIX_STRATEGIES.map((strategy) => {
    const triggeredByCauseIds = [portrait.primaryCause, ...portrait.contributingCauses]
      .filter((cause) => strategy.addressesCategories.includes(cause.category))
      .map((cause) => cause.id);

    if (triggeredByCauseIds.length === 0) {
      return null;
    }

    const matchScore = triggeredByCauseIds.reduce((total, causeId) => {
      const cause = [portrait.primaryCause, ...portrait.contributingCauses].find((entry) => entry.id === causeId);
      return total + (cause?.confidence ?? 0.5);
    }, 0);

    const priority: BugFixStrategyRecommendation["priority"] =
      matchScore >= 1.4 ? "high" : matchScore >= 0.8 ? "medium" : "low";

    return {
      strategy,
      priority,
      rationale: `${strategy.name} addresses ${[...categories]
        .filter((category) => strategy.addressesCategories.includes(category))
        .join(", ")}.`,
      triggeredByCauseIds,
      matchScore
    };
  })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((left, right) => right.matchScore - left.matchScore);

  void causeIds;
  return scored.slice(0, 6).map(({ matchScore, ...entry }) => {
    void matchScore;
    return entry;
  });
}

function buildOrchestrationPlan(
  portrait: RootCausePortrait,
  recommendations: BugFixStrategyRecommendation[],
  explicitFixIntent: boolean
): BugFixOrchestrationPhase[] {
  const strategyIds = recommendations.map((entry) => entry.strategy.id);
  const guardIds = strategyIds.filter((id) => id === "add-guard-and-validate" || id === "close-test-gap");
  const contractIds = strategyIds.filter((id) => id === "realign-contract" || id === "repair-config-drift");
  const structuralIds = strategyIds.filter(
    (id) => id === "contain-boundary-leak" || id === "stabilize-timing"
  );

  const phases: BugFixOrchestrationPhase[] = [
    {
      id: "capture-symptoms",
      label: "Capture symptoms",
      summary: "Collect error text, stacks, failing tests, and reproduction steps before changing code.",
      agentActions: [
        "Gather errorMessage, stackTrace, failingTests, and reproductionSteps.",
        "Call diagnose_repository when repo signals are stale.",
        "Do not edit production code in this phase."
      ],
      strategyIds: []
    },
    {
      id: "portray-root-cause",
      label: "Portray root cause",
      summary: "Run the root-cause portraiture power unit to name and falsify the primary cause.",
      agentActions: [
        "Call portray_root_cause (or reuse the portrait from orchestrate_bug_fix).",
        "Present the portrait narrative and falsification checks to the user.",
        "Reject or demote the primary cause if a falsifier succeeds."
      ],
      strategyIds: [],
      powerUnit: "root-cause-portraiture"
    },
    {
      id: "isolate-fix",
      label: "Isolate the fix",
      summary: "Narrow the change to the portrait blast radius and write a failing regression test first.",
      agentActions: [
        "Add or update a failing test that encodes the portrait primary cause.",
        "Keep the change set inside the reported blast radius.",
        ...recommendations.slice(0, 2).flatMap((entry) => entry.strategy.agentActions.slice(0, 1))
      ],
      strategyIds: [...new Set([...guardIds, ...contractIds])].slice(0, 3)
    },
    {
      id: "apply-fix",
      label: "Apply approved fix",
      summary: "Apply the minimal repair only after explicit fix intent.",
      agentActions: [
        "Apply the highest-priority strategy actions that survived falsification.",
        "Prefer the smallest diff that makes the new regression test pass.",
        "Stop if the portrait confidence is low and more probes are needed."
      ],
      strategyIds: strategyIds.slice(0, 4)
    },
    {
      id: "verify-regression",
      label: "Verify regression",
      summary: "Prove the fix with verification and keep the portrait accountable.",
      agentActions: [
        "Run verify_codebase or run_test_suite after the fix batch.",
        "Confirm the primary falsification checks no longer apply.",
        "Report residual contributing causes instead of silent follow-up edits."
      ],
      strategyIds: structuralIds.slice(0, 2)
    }
  ];

  if (!explicitFixIntent) {
    return phases.filter((phase) =>
      ["capture-symptoms", "portray-root-cause", "verify-regression"].includes(phase.id)
    );
  }

  return phases;
}

export function buildBugFixOrchestrationResult(
  diagnosis: DiagnosisResult,
  input: BugFixOrchestrationInput = {},
  repoPath?: string
): BugFixOrchestrationResult {
  const portrait = buildRootCausePortrait(diagnosis, input);
  const recommendedStrategies = recommendStrategies(portrait);
  const explicitFixIntent =
    Boolean(input.explicitFixIntent) ||
    diagnosis.signals.likelyDiagnosisIntent.final.value === "bug-fix" ||
    diagnosis.signals.workloadType.final.value === "bug-fix" ||
    includesFixLanguage(input);

  const orchestrationPlan = buildOrchestrationPlan(portrait, recommendedStrategies, explicitFixIntent);

  return {
    summary: `Bug-fix orchestration portrayed ${portrait.primaryCause.label} and ranked ${recommendedStrategies.length} strategies across ${orchestrationPlan.length} phases.`,
    repoPath: repoPath ?? diagnosis.intake.repoPath,
    autoFixAllowed: false,
    requiresExplicitIntent: true,
    portrait,
    recommendedStrategies,
    orchestrationPlan,
    diagnosisContext: {
      signals: diagnosis.signals,
      decision: diagnosis.decision,
      patternGuidance: diagnosis.patternGuidance
    }
  };
}

function includesFixLanguage(input: BugFixOrchestrationInput): boolean {
  const text = `${input.requestedOutcome ?? ""} ${input.repoSummary ?? ""}`.toLowerCase();
  return ["fix", "repair", "patch", "resolve bug", "root cause"].some((token) => text.includes(token));
}

export function createBugFixOrchestrationCatalogPayload() {
  const items = listBugFixStrategies();

  return {
    summary: `Arkitect exposes ${items.length} bug-fix strategies for root-cause portraiture–driven orchestration.`,
    total: items.length,
    powerUnit: "root-cause-portraiture" as const,
    items
  };
}

export function createBugFixOrchestrationCursorGuidance(result: BugFixOrchestrationResult): string[] {
  const topStrategies = result.recommendedStrategies.slice(0, 4).map((entry) => entry.strategy.name);
  const phaseIds = result.orchestrationPlan.map((phase) => phase.id);

  return [
    `Bug-fix orchestration for ${result.repoPath}`,
    `Primary cause: ${result.portrait.primaryCause.label} (${Math.round(result.portrait.confidence * 100)}%)`,
    `Portrait: ${result.portrait.portraitNarrative}`,
    `Top strategies: ${topStrategies.length > 0 ? topStrategies.join(", ") : "close-test-gap"}`,
    `Phases: ${phaseIds.join(" → ")}`,
    `Auto-fix allowed: ${result.autoFixAllowed}`,
    "Follow orchestrationPlan in order — capture and portray before any code edit.",
    "The portray-root-cause phase uses the root-cause portraiture power unit.",
    "Do not auto-fix; require explicitFixIntent or clear bug-fix outcome language before apply-fix.",
    defaultArchitecturePolicy.principles.includes("report-structure-before-refactor")
      ? "Report unhealthy structure before structural repair work."
      : "Honor architecture-first policy before structural edits."
  ];
}
