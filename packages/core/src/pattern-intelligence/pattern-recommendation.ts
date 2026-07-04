import type {
  ComplexityProfile,
  DesignPatternId,
  OverEngineeringRisk,
  PatternFamily,
  PatternRecommendationEntry,
  PatternRecommendationRequest,
  PatternRecommendationResult
} from "@arkitect/contracts";
import { getDesignPatternCatalogEntry } from "../catalog.js";
import { PATTERN_INTELLIGENCE, getPatternIntelligenceEntry } from "./pattern-intelligence-catalog.js";
import { resolveRelationChains } from "./pattern-relation-graph.js";

const COMPLEXITY_ORDER: Record<ComplexityProfile, number> = {
  minimal: 0,
  balanced: 1,
  structured: 2,
  enterprise: 3
};

interface Signal {
  keywords: string[];
  patterns: DesignPatternId[];
  weight: number;
  summary: string;
}

const REQUIREMENT_SIGNALS: Signal[] = [
  {
    keywords: ["provider", "multi-provider", "payment", "auth", "byok"],
    patterns: ["strategy", "adapter", "factory-method"],
    weight: 1.6,
    summary: "Provider swapping calls for Strategy plus adapter boundaries and factory selection."
  },
  {
    keywords: ["undo", "redo", "history", "audit", "ledger", "snapshot", "rollback"],
    patterns: ["command", "memento", "observer"],
    weight: 1.7,
    summary: "Undo/history requirements point to Command with Memento snapshots and Observer signalling."
  },
  {
    keywords: ["realtime", "pubsub", "pub/sub", "stream", "websocket", "event"],
    patterns: ["observer", "mediator"],
    weight: 1.5,
    summary: "Reactive workloads favor Observer plus a coordinating Mediator."
  },
  {
    keywords: ["plugin", "extension", "extensible", "marketplace"],
    patterns: ["strategy", "composite", "decorator", "abstract-factory"],
    weight: 1.5,
    summary: "Extension systems benefit from strategy + composition + decorators."
  },
  {
    keywords: ["workflow", "job", "queue", "background", "pipeline"],
    patterns: ["command", "chain-of-responsibility", "template-method"],
    weight: 1.4,
    summary: "Queued or multi-step processing aligns with Command and handler chains."
  },
  {
    keywords: ["ai", "agent", "llm", "mcp", "orchestration"],
    patterns: ["strategy", "facade", "mediator", "adapter"],
    weight: 1.6,
    summary: "AI orchestration favors provider strategies behind facades with a coordinating mediator."
  },
  {
    keywords: ["dsl", "rule", "grammar", "expression", "query"],
    patterns: ["interpreter", "visitor"],
    weight: 1.3,
    summary: "Language and rule concerns lean toward Interpreter with Visitor evaluation."
  },
  {
    keywords: ["cross-cutting", "logging", "caching", "rate", "auth", "retry"],
    patterns: ["decorator", "proxy", "chain-of-responsibility"],
    weight: 1.3,
    summary: "Cross-cutting concerns map to wrappers, proxies, and handler pipelines."
  },
  {
    keywords: ["complex object", "builder", "configuration", "optional field", "large payload"],
    patterns: ["builder", "factory-method"],
    weight: 1.2,
    summary: "Complex construction points toward Builder plus Factory Method."
  },
  {
    keywords: ["tree", "hierarchy", "composite", "recursive", "part-whole"],
    patterns: ["composite", "iterator", "visitor"],
    weight: 1.2,
    summary: "Recursive part-whole models fit Composite, Iterator, and Visitor."
  }
];

function familyOf(patternId: DesignPatternId): PatternFamily {
  const entry = getDesignPatternCatalogEntry(patternId);
  return entry?.family ?? "behavioral";
}

function normalizeTags(tags: string[] | undefined): string[] {
  return (tags ?? []).map((tag) => tag.trim().toLowerCase()).filter(Boolean);
}

function combineText(request: PatternRecommendationRequest): string {
  return `${request.repoSummary ?? ""} ${request.requestedOutcome ?? ""}`.toLowerCase();
}

function scoreFromSignals(
  request: PatternRecommendationRequest
): Map<DesignPatternId, { score: number; reasons: string[] }> {
  const scores = new Map<DesignPatternId, { score: number; reasons: string[] }>();
  const tags = normalizeTags(request.requirementTags);
  const text = combineText(request);
  const tagText = tags.join(" ");

  const add = (patternId: DesignPatternId, weight: number, reason: string) => {
    if (weight <= 0) return;
    const current = scores.get(patternId) ?? { score: 0, reasons: [] };
    current.score += weight;
    if (!current.reasons.includes(reason)) {
      current.reasons.push(reason);
    }
    scores.set(patternId, current);
  };

  for (const signal of REQUIREMENT_SIGNALS) {
    const matches = signal.keywords.filter(
      (keyword) => tagText.includes(keyword) || text.includes(keyword)
    ).length;
    if (matches === 0) continue;
    for (const patternId of signal.patterns) {
      add(patternId, signal.weight + matches * 0.1, signal.summary);
    }
  }

  for (const seed of request.seedPatternIds ?? []) {
    add(seed, 2.5, "User-supplied seed pattern kept in recommendations.");
  }

  return scores;
}

function toEntry(
  patternId: DesignPatternId,
  score: number,
  reasons: string[]
): PatternRecommendationEntry {
  return {
    patternId,
    family: familyOf(patternId),
    score: Number(score.toFixed(2)),
    rationale: reasons.slice(0, 4)
  };
}

function meetsThreshold(patternId: DesignPatternId, profile: ComplexityProfile): boolean {
  const intelligence = getPatternIntelligenceEntry(patternId);
  if (!intelligence) return true;
  return COMPLEXITY_ORDER[profile] >= COMPLEXITY_ORDER[intelligence.complexityThreshold];
}

function computeAffinityScore(entries: PatternRecommendationEntry[]): number {
  if (entries.length === 0) return 0;
  const maxScore = Math.max(...entries.map((entry) => entry.score));
  if (maxScore === 0) return 0;
  const topFive = entries.slice(0, 5);
  const normalized = topFive.map((entry) => entry.score / maxScore);
  const avg = normalized.reduce((sum, value) => sum + value, 0) / normalized.length;
  return Number(avg.toFixed(2));
}

function computeOverEngineeringRisk(
  profile: ComplexityProfile,
  recommended: PatternRecommendationEntry[]
): OverEngineeringRisk {
  const count = recommended.length;
  if (profile === "minimal" && count >= 5) return "high";
  if (profile === "minimal" && count >= 3) return "moderate";
  if (profile === "balanced" && count >= 7) return "moderate";
  if (profile === "structured" && count >= 10) return "moderate";
  return "low";
}

function buildAdrSummary(
  recommended: PatternRecommendationEntry[],
  profile: ComplexityProfile
): string {
  if (recommended.length === 0) {
    return `No dominant patterns emerged for the ${profile} complexity profile. Keep code minimal and revisit once requirements sharpen.`;
  }
  const top = recommended.slice(0, 3);
  const parts = top.map((entry) => {
    const intelligence = getPatternIntelligenceEntry(entry.patternId);
    const name = getDesignPatternCatalogEntry(entry.patternId)?.displayName ?? entry.patternId;
    const intent = intelligence?.intent ?? "";
    return `${name} (${entry.family}) — ${intent}`;
  });
  const tradeoff =
    profile === "minimal"
      ? "Keep the pattern surface small; heavy patterns are deferred to protect simplicity."
      : profile === "enterprise"
        ? "Enterprise profile allows richer combinations; watch for over-orchestration."
        : "Prefer the two or three strongest patterns first; add others only when a concrete need appears.";
  return `Top choices: ${parts.join("; ")}. ${tradeoff}`;
}

export function recommendPatterns(
  request: PatternRecommendationRequest = {}
): PatternRecommendationResult {
  const profile: ComplexityProfile = request.complexityProfile ?? "balanced";
  const scores = scoreFromSignals(request);

  const scored: PatternRecommendationEntry[] = Array.from(scores.entries())
    .map(([patternId, value]) => toEntry(patternId, value.score, value.reasons))
    .sort((left, right) => right.score - left.score || left.patternId.localeCompare(right.patternId));

  const recommended: PatternRecommendationEntry[] = [];
  const deferred: PatternRecommendationEntry[] = [];

  for (const entry of scored) {
    if (meetsThreshold(entry.patternId, profile)) {
      recommended.push(entry);
    } else {
      deferred.push({
        ...entry,
        rationale: [
          ...entry.rationale,
          `Deferred: pattern needs a ${getPatternIntelligenceEntry(entry.patternId)?.complexityThreshold ?? "higher"} complexity profile.`
        ]
      });
    }
  }

  const limits: Record<ComplexityProfile, number> = {
    minimal: 3,
    balanced: 5,
    structured: 8,
    enterprise: 12
  };
  const trimmedRecommended = recommended.slice(0, limits[profile]);
  const overflow = recommended.slice(limits[profile]);
  const finalDeferred = [...deferred, ...overflow.map((entry) => ({
    ...entry,
    rationale: [...entry.rationale, "Overflow beyond complexity-profile pattern budget."]
  }))];

  const seedForChains = trimmedRecommended.map((entry) => entry.patternId);
  const relationChains = resolveRelationChains(seedForChains).slice(0, 8);

  const patternAffinityScore = computeAffinityScore(trimmedRecommended);
  const overEngineeringRisk = computeOverEngineeringRisk(profile, trimmedRecommended);

  const antiPatternWarnings: string[] = [];
  for (const entry of trimmedRecommended) {
    const intelligence = getPatternIntelligenceEntry(entry.patternId);
    if (!intelligence) continue;
    for (const warning of intelligence.antiPatternWarnings) {
      if (!antiPatternWarnings.includes(warning)) {
        antiPatternWarnings.push(warning);
      }
    }
  }
  if (overEngineeringRisk === "high") {
    antiPatternWarnings.push(
      "Complexity profile is too small for this pattern set; keep only essential patterns active."
    );
  }
  if (trimmedRecommended.length === 0) {
    antiPatternWarnings.push(
      "No strong pattern signal detected — clarify requirement tags or seed patterns before adopting more structure."
    );
  }

  const adrSummary = buildAdrSummary(trimmedRecommended, profile);

  const summary =
    trimmedRecommended.length > 0
      ? `Recommended ${trimmedRecommended.length} pattern${trimmedRecommended.length === 1 ? "" : "s"} for the ${profile} complexity profile with ${relationChains.length} relation chain${relationChains.length === 1 ? "" : "s"}.`
      : `No strong pattern signals for the ${profile} complexity profile — keep the design minimal until requirements sharpen.`;

  return {
    summary,
    recommendedPatterns: trimmedRecommended,
    deferredPatterns: finalDeferred,
    antiPatternWarnings,
    patternAffinityScore,
    overEngineeringRisk,
    relationChains,
    adrSummary
  };
}

export function getPatternIntelligenceCount(): number {
  return PATTERN_INTELLIGENCE.length;
}
