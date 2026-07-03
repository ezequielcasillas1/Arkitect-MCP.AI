import type { RepoInspection, RequirementTagSuggestion, RequirementTagSuggestionInput } from "@arkitect/contracts";

interface TagCandidate {
  tag: string;
  score: number;
  reason: string;
  source: RequirementTagSuggestion["source"];
}

function includesAny(text: string, needles: string[]): boolean {
  return needles.some((needle) => text.includes(needle));
}

function hasAny(values: string[], needles: string[]): boolean {
  return needles.some((needle) => values.some((value) => value.toLowerCase().includes(needle)));
}

function toInspectionText(inspection?: RepoInspection): string {
  if (!inspection) {
    return "";
  }

  return [
    inspection.repoName,
    inspection.path,
    inspection.summary,
    ...inspection.manifestFiles,
    ...inspection.topLevelDirectories,
    ...inspection.topLevelFiles,
    ...inspection.samplePaths,
    ...inspection.frameworkHints,
    ...inspection.detectedMarkers
  ]
    .join(" ")
    .toLowerCase();
}

function addCandidate(bucket: Map<string, TagCandidate>, candidate: TagCandidate) {
  const existing = bucket.get(candidate.tag);

  if (!existing || candidate.score > existing.score) {
    bucket.set(candidate.tag, candidate);
    return;
  }

  if (candidate.score === existing.score && !existing.reason.includes(candidate.reason)) {
    bucket.set(candidate.tag, {
      ...existing,
      reason: `${existing.reason} ${candidate.reason}`
    });
  }
}

function addKeywordRules(
  bucket: Map<string, TagCandidate>,
  scopeText: string,
  rules: Array<{
    tag: string;
    keywords: string[];
    weight: number;
    reason: string;
  }>
) {
  rules.forEach((rule) => {
    const matches = rule.keywords.filter((keyword) => scopeText.includes(keyword));

    if (matches.length === 0) {
      return;
    }

    addCandidate(bucket, {
      tag: rule.tag,
      score: Math.min(rule.weight + matches.length * 0.04, 0.98),
      reason: `${rule.reason} Matched: ${matches.slice(0, 3).join(", ")}.`,
      source: "scope-keyword"
    });
  });
}

const scopeKeywordRules: Array<{
  tag: string;
  keywords: string[];
  weight: number;
  reason: string;
}> = [
  {
    tag: "mcp-tool-registry",
    keywords: ["mcp", "model context protocol", "mcp-server", "mcp.json"],
    weight: 0.9,
    reason: "MCP markers suggest tool registration and agent-facing boundaries."
  },
  {
    tag: "agent-services",
    keywords: ["agent", "llm", "openai", "anthropic", "gemini", "composer", "ai-sdk"],
    weight: 0.86,
    reason: "Agent or model orchestration markers were detected in project scope."
  },
  {
    tag: "provider-switching",
    keywords: ["provider", "fallback", "multi-provider", "byo", "openrouter", "groq"],
    weight: 0.84,
    reason: "Multiple provider or fallback markers suggest swappable AI backends."
  },
  {
    tag: "event-driven",
    keywords: ["event", "pubsub", "pub/sub", "queue", "workflow", "nats", "kafka", "rabbitmq"],
    weight: 0.82,
    reason: "Async, queue, or event markers point toward event-driven coordination."
  },
  {
    tag: "plugin-system",
    keywords: ["plugin", "extension", "microkernel", "marketplace"],
    weight: 0.84,
    reason: "Plugin or extension markers imply kernel-style extensibility."
  },
  {
    tag: "domain-first",
    keywords: ["domain", "aggregate", "bounded context", "ddd", "entity"],
    weight: 0.83,
    reason: "Domain language markers suggest boundary-first architecture work."
  },
  {
    tag: "payments",
    keywords: ["stripe", "payment", "billing", "subscription", "checkout"],
    weight: 0.85,
    reason: "Billing or payment markers suggest provider-strategy boundaries."
  },
  {
    tag: "real-time",
    keywords: ["websocket", "real-time", "realtime", "stream", "sse", "socket.io"],
    weight: 0.8,
    reason: "Realtime transport markers suggest reactive coordination needs."
  },
  {
    tag: "audit-trail",
    keywords: ["audit", "ledger", "history", "compliance", "event log"],
    weight: 0.81,
    reason: "Audit or history markers suggest traceability requirements."
  },
  {
    tag: "api-surface",
    keywords: ["api", "rest", "graphql", "trpc", "route handler", "controller"],
    weight: 0.76,
    reason: "API endpoint markers suggest a thin service surface."
  },
  {
    tag: "cloudflare-edge",
    keywords: ["cloudflare", "wrangler", "workerd", "workers", "durable object"],
    weight: 0.88,
    reason: "Cloudflare worker markers suggest edge-first deployment scope."
  },
  {
    tag: "modular-packages",
    keywords: ["pnpm-workspace", "turbo", "lerna", "packages/", "apps/", "workspace"],
    weight: 0.87,
    reason: "Workspace package layout suggests modular monolith boundaries."
  },
  {
    tag: "vertical-slice-delivery",
    keywords: ["features/", "vertical slice", "slice", "feature-slice"],
    weight: 0.85,
    reason: "Feature-slice folder markers suggest vertical delivery seams."
  },
  {
    tag: "cross-cutting",
    keywords: ["logging", "caching", "auth", "middleware", "rate limit", "telemetry"],
    weight: 0.74,
    reason: "Cross-cutting concerns suggest decorator, proxy, or pipeline boundaries."
  }
];

export function suggestRequirementTags(input: RequirementTagSuggestionInput): RequirementTagSuggestion[] {
  const scopeText = [
    input.repoSummary,
    input.requestedOutcome,
    toInspectionText(input.repoInspection)
  ]
    .join(" ")
    .toLowerCase();
  const bucket = new Map<string, TagCandidate>();

  addKeywordRules(bucket, scopeText, scopeKeywordRules);

  if (input.platformType === "desktop") {
    addCandidate(bucket, {
      tag: "desktop-shell",
      score: 0.92,
      reason: "Detected platform is desktop, so shell and local UX boundaries matter.",
      source: "diagnosis-signal"
    });
  }

  if (input.platformType === "worker") {
    addCandidate(bucket, {
      tag: "edge-worker",
      score: 0.86,
      reason: "Detected platform is a worker runtime with edge or background execution scope.",
      source: "diagnosis-signal"
    });
  }

  if (input.platformType === "web") {
    addCandidate(bucket, {
      tag: "web-surface",
      score: 0.8,
      reason: "Detected platform is web-first with UI delivery concerns.",
      source: "diagnosis-signal"
    });
  }

  if (input.platformType === "api") {
    addCandidate(bucket, {
      tag: "api-surface",
      score: 0.82,
      reason: "Detected platform is API-first with endpoint boundary concerns.",
      source: "diagnosis-signal"
    });
  }

  if (input.repoInspection?.path || input.repoInspection?.hasGit) {
    addCandidate(bucket, {
      tag: "local-repo-first",
      score: 0.78,
      reason: "A connected local repository is in scope for diagnosis-first workflows.",
      source: "repo-inspection"
    });
  }

  if (input.workloadType === "migration" || input.workloadType === "architecture-foundation") {
    addCandidate(bucket, {
      tag: "legacy-migration",
      score: 0.8,
      reason: `Workload type ${input.workloadType} suggests staged modernization planning.`,
      source: "diagnosis-signal"
    });
  }

  if (input.likelyDiagnosisIntent === "repo-recovery" || input.repoHealth === "spaghetti") {
    addCandidate(bucket, {
      tag: "repo-recovery",
      score: 0.88,
      reason: "Recovery intent or unhealthy structure suggests boundary repair before expansion.",
      source: "diagnosis-signal"
    });
  }

  if (input.repoHealth === "drifting" || input.repoHealth === "spaghetti") {
    addCandidate(bucket, {
      tag: "boundary-repair",
      score: 0.84,
      reason: "Drifting or spaghetti repo health suggests explicit boundary repair work.",
      source: "diagnosis-signal"
    });
  }

  if (input.currentArchitecture === "modular-monolith" || hasAny(input.repoInspection?.topLevelDirectories ?? [], ["apps", "packages"])) {
    addCandidate(bucket, {
      tag: "modular-packages",
      score: 0.86,
      reason: "Modular monolith structure suggests package and app boundary discipline.",
      source: "diagnosis-signal"
    });
  }

  if (input.currentArchitecture === "vertical-slice" || includesAny(scopeText, ["features/", "vertical slice"])) {
    addCandidate(bucket, {
      tag: "vertical-slice-delivery",
      score: 0.84,
      reason: "Vertical slice structure suggests feature-owned delivery seams.",
      source: "diagnosis-signal"
    });
  }

  if (input.currentArchitecture === "domain-driven-design" || input.currentArchitecture === "clean-architecture") {
    addCandidate(bucket, {
      tag: "domain-first",
      score: 0.83,
      reason: "Detected architecture emphasizes domain and boundary clarity.",
      source: "diagnosis-signal"
    });
  }

  if (hasAny(input.repoInspection?.frameworkHints ?? [], ["electron", "tauri"])) {
    addCandidate(bucket, {
      tag: "desktop-shell",
      score: 0.94,
      reason: "Electron or Tauri markers confirm a desktop shell product scope.",
      source: "repo-inspection"
    });
  }

  if (hasAny(input.repoInspection?.frameworkHints ?? [], ["wrangler", "workerd"])) {
    addCandidate(bucket, {
      tag: "cloudflare-edge",
      score: 0.9,
      reason: "Wrangler or workerd markers confirm Cloudflare edge scope.",
      source: "repo-inspection"
    });
  }

  return [...bucket.values()]
    .sort((left, right) => right.score - left.score)
    .slice(0, 8)
    .map((candidate) => ({
      tag: candidate.tag,
      confidence: Number(candidate.score.toFixed(2)),
      reason: candidate.reason,
      source: candidate.source
    }));
}

export function buildRequirementTagSuggestionInput(
  intake: Pick<RequirementTagSuggestionInput, "repoSummary" | "requestedOutcome" | "repoInspection">,
  signals: {
    platformType: { final: { value: RequirementTagSuggestionInput["platformType"] } };
    workloadType: { final: { value: RequirementTagSuggestionInput["workloadType"] } };
    currentArchitecture: { final: { value: RequirementTagSuggestionInput["currentArchitecture"] } };
    repoHealth: { final: { value: RequirementTagSuggestionInput["repoHealth"] } };
    likelyDiagnosisIntent: { final: { value: RequirementTagSuggestionInput["likelyDiagnosisIntent"] } };
  }
): RequirementTagSuggestionInput {
  return {
    repoSummary: intake.repoSummary,
    requestedOutcome: intake.requestedOutcome,
    repoInspection: intake.repoInspection,
    platformType: signals.platformType.final.value,
    workloadType: signals.workloadType.final.value,
    currentArchitecture: signals.currentArchitecture.final.value,
    repoHealth: signals.repoHealth.final.value,
    likelyDiagnosisIntent: signals.likelyDiagnosisIntent.final.value
  };
}
