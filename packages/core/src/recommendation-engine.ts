import type {
  ArchitectureCatalogId,
  CatalogRecommendationBundle,
  CatalogRecommendationInput,
  ComplexityProfile,
  ContinuationAdvice,
  DesignPatternId,
  DiagnosisStrategy,
  DiagnosisStrategyId,
  OverEngineeringRisk,
  PatternGuidance,
  PatternRecommendationCandidate,
  PatternRecommendationMap,
  RecommendationReason,
  RecommendationReasonSource,
  RemixProfileId,
  ScoredRecommendation
} from "@arkitect/contracts";
import {
  getDeferredPatternsForProfile,
  getDesignPatternFamily,
  getArchitectureCatalogEntry,
  isArchitectureCatalogId,
  listArchitectureCatalog,
  listDesignPatternCatalog,
  listRemixProfileCatalog
} from "./catalog.js";
import { evaluateArchitectureDecisionGuide } from "./architecture-recommendation/architecture-decision-guide.js";
import {
  countKeywordMatches,
  fileAwareSignalText,
  hasMonorepoFileSignal,
  hasSliceFileSignal,
  hasTrustedHostVocabulary,
  isHostVocabularyKeyword,
  trustedSignalText
} from "./architecture-recommendation/architecture-signals.js";
import {
  assembleLegalTriple,
  rankRemixesForTriple,
  type ArchitectureScoreEntry
} from "./architecture-recommendation/architecture-triple.js";

type ScoreBucket<TId extends string> = Map<
  TId,
  {
    score: number;
    reasons: RecommendationReason[];
  }
>;

const architectureFirstCopy =
  "Arkitect scores macro architecture first so healthy structures can continue, unhealthy structures can be reported safely, and design patterns stay aligned to the chosen system shape.";

export const diagnosisStrategies: Record<DiagnosisStrategyId, DiagnosisStrategy> = {
  "continue-healthy-architecture": {
    id: "continue-healthy-architecture",
    label: "Continue healthy architecture",
    summary: "Preserve intentional structure when repo health is good and the architecture signal is strong."
  },
  "report-unhealthy-structure": {
    id: "report-unhealthy-structure",
    label: "Report unhealthy structure",
    summary: "Surface drift or spaghetti structure without auto-refactoring."
  },
  "require-explicit-migration-intent": {
    id: "require-explicit-migration-intent",
    label: "Require explicit migration intent",
    summary: "Only unlock structural remediation when intent and permission both allow it."
  },
  "guide-foundation-selection": {
    id: "guide-foundation-selection",
    label: "Guide foundation selection",
    summary: "Recommend stable architecture options when the detected direction is incomplete."
  },
  "rank-remixes-by-context": {
    id: "rank-remixes-by-context",
    label: "Rank remixes by context",
    summary: "Suggest hybrid profiles from architecture, workload, and requirement context."
  },
  "defer-heavy-patterns": {
    id: "defer-heavy-patterns",
    label: "Defer heavy patterns",
    summary: "Suppress low-value or advanced patterns when the complexity profile does not justify them."
  },
  "recommend-then-confirm": {
    id: "recommend-then-confirm",
    label: "Recommend then confirm",
    summary: "Rank a foundation from the master decision guide and wait for confirmation before locking continuation."
  }
};

const workloadArchitectureWeights: Record<
  CatalogRecommendationInput["workloadType"],
  Partial<Record<ArchitectureCatalogId, number>>
> = {
  "architecture-foundation": {
    "modular-monolith": 1.7,
    monolithic: 1.4
  },
  "feature-delivery": {
    "vertical-slice": 1.9,
    "minimal-api": 1.5,
    "modular-monolith": 1.3,
    cqrs: 1,
    "event-driven": 0.9
  },
  "bug-fix": {
    "minimal-api": 0.8,
    "vertical-slice": 0.8,
    "clean-architecture": 0.7,
    "screaming-architecture": 0.7
  },
  migration: {
    "modular-monolith": 1.6,
    "clean-architecture": 1.5,
    "microservices": 1.3,
    "strangler-fig": 1.5,
    "anti-corruption-layer": 1.2,
    "api-gateway": 1.1,
    "event-driven": 1.1,
    cqrs: 1,
    "screaming-architecture": 0.9
  },
  "repo-recovery": {
    "screaming-architecture": 1.6,
    "clean-architecture": 1.4,
    "modular-monolith": 1.3,
    "vertical-slice": 1
  },
  diagnosis: {
    "clean-architecture": 1,
    "vertical-slice": 1,
    "modular-monolith": 0.9,
    "screaming-architecture": 0.9
  },
  unknown: {}
};

const platformArchitectureWeights: Record<
  CatalogRecommendationInput["platformType"],
  Partial<Record<ArchitectureCatalogId, number>>
> = {
  desktop: {
    "modular-monolith": 1.1
  },
  web: {
    "modular-monolith": 1,
    monolithic: 0.9,
    layered: 1.1
  },
  api: {
    "minimal-api": 1.3,
    hexagonal: 1.2,
    "clean-architecture": 1.1,
    "api-gateway": 1.2,
    cqrs: 0.9
  },
  cli: {
    "clean-architecture": 1,
    hexagonal: 0.9,
    "screaming-architecture": 0.8
  },
  library: {
    "clean-architecture": 1.2,
    hexagonal: 1.1,
    "screaming-architecture": 0.9
  },
  worker: {
    "minimal-api": 1.1,
    "event-driven": 1.1,
    hexagonal: 1,
    "circuit-breaker": 1,
    microservices: 0.8
  },
  hybrid: {
    "modular-monolith": 1.2,
    "vertical-slice": 1.1,
    hexagonal: 1,
    "clean-architecture": 1
  },
  unknown: {}
};

const intentArchitectureWeights: Record<
  CatalogRecommendationInput["likelyDiagnosisIntent"],
  Partial<Record<ArchitectureCatalogId, number>>
> = {
  review: {
    "screaming-architecture": 0.9,
    "clean-architecture": 0.8
  },
  feature: {
    "minimal-api": 1.1,
    "modular-monolith": 1
  },
  "bug-fix": {
    "vertical-slice": 0.7,
    "minimal-api": 0.7,
    "clean-architecture": 0.7
  },
  migration: {
    "modular-monolith": 1.4,
    "microservices": 1.2,
    "strangler-fig": 1.5,
    "clean-architecture": 1.1,
    "anti-corruption-layer": 1.1,
    "event-driven": 1
  },
  "architecture-upgrade": {
    "clean-architecture": 1.3,
    "onion-architecture": 1.2,
    hexagonal: 1.2,
    "modular-monolith": 1.1,
    "domain-driven-design": 1,
    "strangler-fig": 1.1
  },
  "repo-recovery": {
    "screaming-architecture": 1.4,
    "clean-architecture": 1.2,
    "modular-monolith": 1.1
  },
  unknown: {}
};

const workloadPatternWeights: Record<
  CatalogRecommendationInput["workloadType"],
  Partial<Record<DesignPatternId, number>>
> = {
  "architecture-foundation": {
    "factory-method": 1.1,
    adapter: 1.1,
    facade: 1,
    strategy: 1,
    mediator: 0.9
  },
  "feature-delivery": {
    strategy: 1.2,
    mediator: 1.1,
    command: 1.1,
    decorator: 1
  },
  "bug-fix": {
    facade: 0.8,
    adapter: 0.8,
    "template-method": 0.6
  },
  migration: {
    adapter: 1.2,
    facade: 1.1,
    proxy: 1,
    "chain-of-responsibility": 0.9
  },
  "repo-recovery": {
    facade: 1.1,
    strategy: 0.9,
    mediator: 0.9,
    decorator: 0.8
  },
  diagnosis: {
    strategy: 0.8,
    facade: 0.8,
    visitor: 0.7
  },
  unknown: {}
};

const complexityArchitectureWeights: Record<ComplexityProfile, Partial<Record<ArchitectureCatalogId, number>>> = {
  minimal: {
    "minimal-api": 1.1,
    monolithic: 1.2,
    "vertical-slice": 0.9,
    "modular-monolith": 0.7
  },
  balanced: {
    "modular-monolith": 1
  },
  structured: {
    "modular-monolith": 1,
    hexagonal: 1,
    "domain-driven-design": 1.1,
    cqrs: 0.8
  },
  enterprise: {
    "domain-driven-design": 1.2,
    "microservices": 1.2,
    soa: 1.1,
    "event-driven": 1.1,
    cqrs: 1.1,
    "event-sourcing": 1,
    saga: 1.1,
    "api-gateway": 1
  }
};

const requirementPatternSignals: Array<{
  keywords: string[];
  patterns: DesignPatternId[];
  weight: number;
  summary: string;
}> = [
  {
    keywords: ["multi-provider", "payments", "payment", "provider", "auth provider"],
    patterns: ["strategy", "adapter"],
    weight: 1.6,
    summary: "Multi-provider requirements favor provider switching and adapter boundaries."
  },
  {
    keywords: ["real-time", "realtime", "pubsub", "pub/sub", "websocket", "stream"],
    patterns: ["observer", "mediator"],
    weight: 1.6,
    summary: "Reactive or real-time flows benefit from observer and coordination patterns."
  },
  {
    keywords: ["undo", "redo", "rollback", "snapshot"],
    patterns: ["command", "memento"],
    weight: 1.7,
    summary: "Undo or rollback behavior points to command history plus snapshots."
  },
  {
    keywords: ["plugin", "extension", "plugin-based", "marketplace"],
    patterns: ["strategy", "composite", "decorator"],
    weight: 1.7,
    summary: "Extension systems benefit from strategy, composition, and decorators."
  },
  {
    keywords: ["queue", "job", "background", "workflow"],
    patterns: ["command", "chain-of-responsibility"],
    weight: 1.4,
    summary: "Queued or multi-step processing aligns with command and handler chains."
  },
  {
    keywords: ["ai", "agent", "model", "llm", "mcp"],
    patterns: ["strategy", "facade", "adapter", "mediator"],
    weight: 1.5,
    summary: "AI orchestration and tool surfaces favor provider strategy plus clean facades and adapters."
  },
  {
    keywords: ["audit", "event log", "history", "ledger", "compliance"],
    patterns: ["command", "memento", "observer"],
    weight: 1.7,
    summary: "Audit-heavy systems benefit from explicit intent, snapshots, and event signaling."
  },
  {
    keywords: ["complex object", "builder", "construction", "optional field"],
    patterns: ["builder", "factory-method"],
    weight: 1.3,
    summary: "Complex object creation pushes toward builders and factories."
  },
  {
    keywords: ["cross-cutting", "logging", "caching", "auth", "rate limit", "rate limiting"],
    patterns: ["decorator", "proxy", "chain-of-responsibility"],
    weight: 1.3,
    summary: "Cross-cutting requirements map well to wrappers, proxies, and handler pipelines."
  },
  {
    keywords: ["rule engine", "dsl", "expression", "query language"],
    patterns: ["interpreter", "visitor"],
    weight: 1.3,
    summary: "Rule and language concerns lean toward interpreter-style structures."
  }
];

const requirementArchitectureSignals: Array<{
  keywords: string[];
  architectures: ArchitectureCatalogId[];
  weight: number;
  summary: string;
}> = [
  {
    keywords: ["ai", "agent", "mcp", "provider"],
    architectures: ["hexagonal", "microkernel"],
    weight: 1.1,
    summary: "AI and tool orchestration need replaceable adapters at the edge."
  },
  {
    keywords: ["real-time", "queue", "pubsub", "event-driven", "workflow"],
    architectures: ["event-driven", "cqrs"],
    weight: 1.1,
    summary: "Async and eventful workloads fit event-driven coordination patterns."
  },
  {
    keywords: ["legacy", "migration", "strangler", "cloud", "phased modernization", "legacy replacement"],
    architectures: ["strangler-fig", "microservices", "anti-corruption-layer", "modular-monolith"],
    weight: 1.2,
    summary: "Migration-heavy contexts favor staged modernization with strangler and ACL boundaries."
  },
  {
    keywords: ["onion", "onion architecture", "persistence ignorant"],
    architectures: ["onion-architecture", "clean-architecture", "repository-pattern"],
    weight: 1.1,
    summary: "Onion layering points toward inward dependencies and repository seams."
  },
  {
    keywords: ["monolith", "monolithic", "single deployable", "mvp", "simple start"],
    architectures: ["monolithic", "modular-monolith", "layered"],
    weight: 1.1,
    summary: "Single-deployable scope fits monolithic or modular-monolith foundations."
  },
  {
    keywords: ["soa", "service-oriented", "enterprise service bus", "esb", "interop"],
    architectures: ["soa", "microservices", "api-gateway"],
    weight: 1.1,
    summary: "Enterprise service integration aligns with SOA and gateway edges."
  },
  {
    keywords: ["unit of work", "unit-of-work", "uow", "transaction boundary", "atomic write"],
    architectures: ["unit-of-work", "repository-pattern", "onion-architecture"],
    weight: 1.2,
    summary: "Transaction-boundary needs point toward unit-of-work with repositories."
  },
  {
    keywords: ["anti-corruption", "acl", "domain isolation", "foreign model", "legacy integration"],
    architectures: ["anti-corruption-layer", "hexagonal", "domain-driven-design"],
    weight: 1.3,
    summary: "Domain isolation at integration points favors anti-corruption layers."
  },
  {
    keywords: ["circuit breaker", "circuit-breaker", "resilience", "cascading failure", "fault tolerance", "fallback"],
    architectures: ["circuit-breaker", "microservices", "soa"],
    weight: 1.3,
    summary: "Resilience requirements favor circuit breakers at service boundaries."
  },
  {
    keywords: ["saga", "distributed transaction", "compensating", "long-running transaction", "orchestration workflow"],
    architectures: ["saga", "event-driven", "microservices", "cqrs"],
    weight: 1.3,
    summary: "Distributed transactions favor saga coordination over two-phase commit."
  },
  {
    keywords: ["api gateway", "api-gateway", "gateway", "edge routing", "single entry point"],
    architectures: ["api-gateway", "microservices", "bff"],
    weight: 1.2,
    summary: "Edge routing and aggregation needs map to API gateway patterns."
  },
  {
    keywords: ["bff", "backend for frontend", "mobile api", "channel-specific", "client-specific"],
    architectures: ["bff", "api-gateway", "vertical-slice"],
    weight: 1.2,
    summary: "Channel-specific APIs benefit from dedicated BFF surfaces."
  },
  {
    keywords: ["bounded context", "aggregate", "ubiquitous language", "domain-driven", "ddd"],
    architectures: ["domain-driven-design", "hexagonal", "clean-architecture", "anti-corruption-layer"],
    weight: 1.1,
    summary: "Rich domain language points toward DDD and boundary-focused architecture."
  },
  {
    keywords: ["plugin", "extension", "extensible"],
    architectures: ["microkernel", "modular-monolith"],
    weight: 1.2,
    summary: "Extension needs strongly imply kernel and module boundaries."
  },
  {
    keywords: ["api", "webhook", "thin endpoint"],
    architectures: ["minimal-api", "hexagonal"],
    weight: 0.9,
    summary: "Thin service surfaces benefit from minimal endpoints and adapter boundaries."
  }
];

function createScoreBucket<TId extends string>(ids: TId[]): ScoreBucket<TId> {
  return new Map(ids.map((id) => [id, { score: 0, reasons: [] }]));
}

function addScore<TId extends string>(
  bucket: ScoreBucket<TId>,
  id: TId,
  source: RecommendationReasonSource,
  weight: number,
  summary: string
) {
  const current = bucket.get(id);

  if (!current || weight === 0) {
    return;
  }

  current.score += weight;
  current.reasons.push({
    source,
    summary,
    weight: Number(weight.toFixed(2))
  });
}

function entriesFromBucket<TId extends string>(bucket: ScoreBucket<TId>): Array<{ id: TId; score: number; reasons: RecommendationReason[] }> {
  return Array.from(bucket.entries())
    .filter(([, value]) => value.score > 0)
    .map(([id, value]) => ({
      id,
      score: value.score,
      reasons: value.reasons
    }));
}

function normalizeRecommendations<TId extends string>(
  bucket: ScoreBucket<TId> | Array<{ id: TId; score: number; reasons: RecommendationReason[] }>,
  limit = 5
): ScoredRecommendation<TId>[] {
  const values = Array.isArray(bucket) ? bucket.filter((value) => value.score > 0) : entriesFromBucket(bucket);

  if (values.length === 0) {
    return [];
  }

  const maxScore = Math.max(...values.map((value) => value.score));

  return values
    .map((value) => ({
      id: value.id,
      score: Number((value.score / maxScore).toFixed(2)),
      reasons: value.reasons.sort((left, right) => right.weight - left.weight)
    }))
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
    .slice(0, limit);
}

function toPatternCandidates(
  bucket: ScoreBucket<DesignPatternId>,
  family: PatternRecommendationCandidate["family"],
  limit = 8
): PatternRecommendationCandidate[] {
  return normalizeRecommendations(bucket, limit).map((candidate) => ({
    ...candidate,
    family
  }));
}

function hasStructuralIntent(input: CatalogRecommendationInput): boolean {
  return (
    input.likelyDiagnosisIntent === "migration" ||
    input.likelyDiagnosisIntent === "architecture-upgrade" ||
    input.likelyDiagnosisIntent === "repo-recovery"
  );
}

function canApplyStructure(permission: CatalogRecommendationInput["executionPermission"]): boolean {
  return permission === "apply-structural-changes";
}

function isCurrentArchitectureLocked(input: CatalogRecommendationInput): boolean {
  return Boolean(input.lockCurrentArchitecture && isArchitectureCatalogId(input.currentArchitecture));
}

function recommendationSearchText(input: CatalogRecommendationInput): string {
  return fileAwareSignalText(input);
}

function signalTextForKeywords(input: CatalogRecommendationInput, keywords: string[]): string {
  return keywords.some((keyword) => isHostVocabularyKeyword(keyword))
    ? trustedSignalText(input)
    : fileAwareSignalText(input);
}

function getMatchedSignalCount(text: string, keywords: string[]): number {
  return countKeywordMatches(text, keywords);
}

function scoreArchitectureEntries(input: CatalogRecommendationInput): ArchitectureScoreEntry[] {
  const bucket = createScoreBucket(listArchitectureCatalog().map((entry) => entry.id));

  if (isArchitectureCatalogId(input.currentArchitecture)) {
    const lockedHealthy = isCurrentArchitectureLocked(input) && input.repoHealth === "healthy";
    addScore(
      bucket,
      input.currentArchitecture,
      lockedHealthy ? "continuation" : "repo-health",
      lockedHealthy ? 2.8 : 0.6,
      lockedHealthy
        ? "User-confirmed architecture should be continued."
        : "Current architecture remains relevant context for diagnosis."
    );
  }

  Object.entries(workloadArchitectureWeights[input.workloadType]).forEach(([id, weight]) => {
    addScore(bucket, id as ArchitectureCatalogId, "workload-affinity", weight, `Aligned to ${input.workloadType} work.`);
  });

  Object.entries(platformArchitectureWeights[input.platformType]).forEach(([id, weight]) => {
    addScore(bucket, id as ArchitectureCatalogId, "platform-affinity", weight, `Fits the ${input.platformType} surface.`);
  });

  Object.entries(intentArchitectureWeights[input.likelyDiagnosisIntent]).forEach(([id, weight]) => {
    addScore(
      bucket,
      id as ArchitectureCatalogId,
      "diagnosis-intent",
      weight,
      `Useful for ${input.likelyDiagnosisIntent} intent.`
    );
  });

  Object.entries(complexityArchitectureWeights[input.complexityProfile]).forEach(([id, weight]) => {
    addScore(
      bucket,
      id as ArchitectureCatalogId,
      "complexity-profile",
      weight,
      `Matches the ${input.complexityProfile} complexity profile.`
    );
  });

  if (input.selectedRemixId) {
    const remix = listRemixProfileCatalog().find((entry) => entry.id === input.selectedRemixId);

    remix?.architectureIds.forEach((architectureId) => {
      addScore(
        bucket,
        architectureId,
        "remix-affinity",
        1.8,
        `${remix.displayName} composes this architecture choice.`
      );
    });
  }

  requirementArchitectureSignals.forEach((signal) => {
    const matches = getMatchedSignalCount(signalTextForKeywords(input, signal.keywords), signal.keywords);

    if (matches === 0) {
      return;
    }

    signal.architectures.forEach((architectureId) => {
      addScore(
        bucket,
        architectureId,
        "requirement-signal",
        signal.weight + matches * 0.1,
        signal.summary
      );
    });
  });

  if (hasMonorepoFileSignal(input)) {
    addScore(
      bucket,
      "modular-monolith",
      "requirement-signal",
      1.4,
      "Monorepo manifests or apps/packages directories mark a modular monolith foundation."
    );
  }

  if (hasSliceFileSignal(input) || hasTrustedHostVocabulary(input, ["vertical slice", "feature folder"])) {
    addScore(
      bucket,
      "vertical-slice",
      "requirement-signal",
      1.3,
      "Feature-folder or slice markers shape internal ownership, not the deploy unit."
    );
  }

  if (input.repoHealth === "spaghetti" || input.repoHealth === "drifting") {
    addScore(
      bucket,
      "screaming-architecture",
      "repo-health",
      1.1,
      "Unhealthy structure benefits from clearer intent signaling."
    );
    addScore(
      bucket,
      "clean-architecture",
      "repo-health",
      0.9,
      "Drift often benefits from stronger dependency direction."
    );
  }

  const guide = evaluateArchitectureDecisionGuide(input);
  guide.boosts.forEach((boost) => {
    addScore(bucket, boost.architectureId, "decision-guide", boost.weight, boost.reason);
  });

  return entriesFromBucket(bucket);
}

function scoreRemixCandidates(
  input: CatalogRecommendationInput,
  triple: { foundation?: ArchitectureCatalogId; internal?: ArchitectureCatalogId; edge?: ArchitectureCatalogId; supporting?: ArchitectureCatalogId }
): ScoredRecommendation<RemixProfileId>[] {
  return rankRemixesForTriple(input, triple);
}

function scorePatternCandidates(
  input: CatalogRecommendationInput,
  selectedArchitectureId: ArchitectureCatalogId | undefined,
  selectedRemixId: RemixProfileId | undefined
): {
  creational: PatternRecommendationCandidate[];
  structural: PatternRecommendationCandidate[];
  behavioral: PatternRecommendationCandidate[];
} {
  const creational = createScoreBucket(
    listDesignPatternCatalog()
      .filter((pattern) => pattern.family === "creational")
      .map((pattern) => pattern.id)
  );
  const structural = createScoreBucket(
    listDesignPatternCatalog()
      .filter((pattern) => pattern.family === "structural")
      .map((pattern) => pattern.id)
  );
  const behavioral = createScoreBucket(
    listDesignPatternCatalog()
      .filter((pattern) => pattern.family === "behavioral")
      .map((pattern) => pattern.id)
  );

  const buckets: Record<PatternRecommendationCandidate["family"], ScoreBucket<DesignPatternId>> = {
    creational,
    structural,
    behavioral
  };
  const architectureEntry = selectedArchitectureId ? getArchitectureCatalogEntry(selectedArchitectureId) : undefined;
  const remixEntry = selectedRemixId ? listRemixProfileCatalog().find((entry) => entry.id === selectedRemixId) : undefined;

  architectureEntry?.highAffinityPatterns.forEach((patternId) => {
    const family = getDesignPatternFamily(patternId);
    addScore(
      buckets[family],
      patternId,
      "architecture-affinity",
      1.9,
      `${architectureEntry.displayName} has high affinity with this pattern.`
    );
  });

  remixEntry?.patternIds.forEach((patternId) => {
    const family = getDesignPatternFamily(patternId);
    addScore(
      buckets[family],
      patternId,
      "remix-affinity",
      1.5,
      `${remixEntry.displayName} composes this pattern into the hybrid profile.`
    );
  });

  Object.entries(workloadPatternWeights[input.workloadType]).forEach(([id, weight]) => {
    const patternId = id as DesignPatternId;
    const family = getDesignPatternFamily(patternId);
    addScore(buckets[family], patternId, "workload-affinity", weight, `Useful for ${input.workloadType} work.`);
  });

  requirementPatternSignals.forEach((signal) => {
    const matches = getMatchedSignalCount(recommendationSearchText(input), signal.keywords);

    if (matches === 0) {
      return;
    }

    signal.patterns.forEach((patternId) => {
      const family = getDesignPatternFamily(patternId);
      addScore(
        buckets[family],
        patternId,
        "requirement-signal",
        signal.weight + matches * 0.1,
        signal.summary
      );
    });
  });

  if (input.repoHealth === "drifting" || input.repoHealth === "spaghetti") {
    addScore(
      structural,
      "facade",
      "policy-guardrail",
      0.8,
      "When structure is drifting, facade-style consolidation can clarify noisy subsystem boundaries."
    );
    addScore(
      behavioral,
      "strategy",
      "policy-guardrail",
      0.7,
      "Strategy helps isolate decisions during incremental repair work."
    );
  }

  return {
    creational: toPatternCandidates(creational, "creational"),
    structural: toPatternCandidates(structural, "structural"),
    behavioral: toPatternCandidates(behavioral, "behavioral")
  };
}

function determineStrategies(input: CatalogRecommendationInput, selectedArchitectureId?: ArchitectureCatalogId): DiagnosisStrategyId[] {
  const strategies = new Set<DiagnosisStrategyId>(["rank-remixes-by-context"]);
  const locked = isCurrentArchitectureLocked(input);

  if (selectedArchitectureId && input.repoHealth === "healthy" && locked) {
    strategies.add("continue-healthy-architecture");
  } else if (input.repoHealth !== "drifting" && input.repoHealth !== "spaghetti") {
    strategies.add("recommend-then-confirm");
    strategies.add("guide-foundation-selection");
  }

  if (input.repoHealth === "drifting" || input.repoHealth === "spaghetti") {
    strategies.add("report-unhealthy-structure");

    if (!hasStructuralIntent(input) || !canApplyStructure(input.executionPermission)) {
      strategies.add("require-explicit-migration-intent");
    }
  }

  if (!selectedArchitectureId) {
    strategies.add("guide-foundation-selection");
    strategies.add("recommend-then-confirm");
  }

  if (input.complexityProfile === "minimal" || input.complexityProfile === "balanced") {
    strategies.add("defer-heavy-patterns");
  }

  return Array.from(strategies);
}

function determineContinuationAdvice(
  input: CatalogRecommendationInput,
  selectedArchitectureId?: ArchitectureCatalogId,
  selectedRemixId?: RemixProfileId
): ContinuationAdvice {
  const locked = isCurrentArchitectureLocked(input);

  if (selectedArchitectureId && input.repoHealth === "healthy" && locked) {
    return {
      mode: "continue",
      action: "continue-existing-architecture",
      autoContinue: true,
      summary: `Continue the healthy ${getArchitectureCatalogEntry(selectedArchitectureId)?.displayName ?? selectedArchitectureId} path because it was confirmed or locked.`,
      requiredPermission: "apply-safe-changes"
    };
  }

  if (input.repoHealth === "spaghetti" || input.repoHealth === "drifting") {
    if (hasStructuralIntent(input) && canApplyStructure(input.executionPermission)) {
      return {
        mode: "plan-only",
        action: "plan-structural-remediation",
        autoContinue: false,
        summary: selectedRemixId
          ? `Report structural issues first, then plan remediation through ${selectedRemixId} only because intent and permission allow it.`
          : "Report structural issues first, then plan remediation only because intent and permission allow it.",
        requiredPermission: "apply-structural-changes"
      };
    }

    return {
      mode: "report-only",
      action: "report-issues-only",
      autoContinue: false,
      summary: "Report unhealthy structure without auto-refactoring until migration or refactor intent is explicit.",
      requiredPermission: "read-only"
    };
  }

  const recommendedName = selectedArchitectureId
    ? getArchitectureCatalogEntry(selectedArchitectureId)?.displayName ?? selectedArchitectureId
    : "a catalog foundation";

  return {
    mode: "guide",
    action: "guide-new-foundation",
    autoContinue: false,
    summary: `Recommend ${recommendedName} from the architecture decision guide, then confirm before locking continuation.`,
    requiredPermission: "generate-plan"
  };
}

function selectRecommendedPatternIds(
  candidates: PatternRecommendationCandidate[],
  deferredSet: Set<DesignPatternId>,
  limit: number
): DesignPatternId[] {
  return candidates
    .filter((candidate) => !deferredSet.has(candidate.id))
    .slice(0, limit)
    .map((candidate) => candidate.id);
}

function determineOverEngineeringRisk(
  input: CatalogRecommendationInput,
  recommendedPatterns: PatternRecommendationMap
): OverEngineeringRisk {
  const total =
    recommendedPatterns.creational.length +
    recommendedPatterns.structural.length +
    recommendedPatterns.behavioral.length;

  if (input.complexityProfile === "minimal" && total >= 6) {
    return "high";
  }

  if ((input.complexityProfile === "balanced" && total >= 7) || input.repoHealth === "spaghetti") {
    return "moderate";
  }

  return "low";
}

export function recommendCatalog(input: CatalogRecommendationInput): CatalogRecommendationBundle {
  const architectureEntries = scoreArchitectureEntries(input);
  const architectureCandidates = normalizeRecommendations(architectureEntries, 12);
  const guide = evaluateArchitectureDecisionGuide(input);
  const foundationRejected = new Set(
    guide.rejected.filter((entry) => entry.role === "foundation").map((entry) => entry.architectureId)
  );
  const legalTriple = assembleLegalTriple(input, architectureEntries, foundationRejected);
  const selectedArchitectureId =
    input.selectedArchitectureId ??
    (isCurrentArchitectureLocked(input) && isArchitectureCatalogId(input.currentArchitecture)
      ? input.currentArchitecture
      : legalTriple.foundation);
  const remixCandidates = scoreRemixCandidates(input, legalTriple);
  const selectedRemixId = input.selectedRemixId ?? legalTriple.remixId;
  const patternCandidates = scorePatternCandidates(input, selectedArchitectureId, selectedRemixId);
  const relevantStrategies = determineStrategies(input, selectedArchitectureId);
  const continuationAdvice = determineContinuationAdvice(input, selectedArchitectureId, selectedRemixId);

  return {
    selectedArchitectureId,
    selectedRemixId,
    legalTriple,
    architectureCandidates,
    remixCandidates,
    patternCandidates,
    relevantStrategies,
    continuationAdvice,
    guideStepsApplied: guide.steps,
    rejectedArchitectures: guide.rejected
  };
}

export function buildPatternGuidance(
  input: CatalogRecommendationInput,
  recommendation: CatalogRecommendationBundle
): PatternGuidance {
  const deferredPatterns = getDeferredPatternsForProfile(input.complexityProfile);
  const deferredSet = new Set<DesignPatternId>(deferredPatterns);
  const recommendationLimits: Record<ComplexityProfile, { creational: number; structural: number; behavioral: number }> = {
    minimal: { creational: 1, structural: 1, behavioral: 2 },
    balanced: { creational: 2, structural: 2, behavioral: 3 },
    structured: { creational: 3, structural: 4, behavioral: 4 },
    enterprise: { creational: 4, structural: 5, behavioral: 6 }
  };
  const limits = recommendationLimits[input.complexityProfile];
  const recommendedPatterns: PatternRecommendationMap = {
    creational: selectRecommendedPatternIds(recommendation.patternCandidates.creational, deferredSet, limits.creational),
    structural: selectRecommendedPatternIds(recommendation.patternCandidates.structural, deferredSet, limits.structural),
    behavioral: selectRecommendedPatternIds(recommendation.patternCandidates.behavioral, deferredSet, limits.behavioral)
  };
  const overEngineeringRisk = determineOverEngineeringRisk(input, recommendedPatterns);
  const patternScores = [
    ...recommendation.patternCandidates.creational,
    ...recommendation.patternCandidates.structural,
    ...recommendation.patternCandidates.behavioral
  ];
  const topScores = patternScores.slice(0, 5).map((candidate) => candidate.score);
  const patternAffinityScore =
    topScores.length > 0 ? Number((topScores.reduce((sum, value) => sum + value, 0) / topScores.length).toFixed(2)) : 0;
  const antiPatternWarnings: string[] = [];

  if (input.repoHealth === "drifting" || input.repoHealth === "spaghetti") {
    antiPatternWarnings.push("Structural drift detected; report and stabilize boundaries before adding advanced patterns.");
  }

  if (overEngineeringRisk === "high") {
    antiPatternWarnings.push("The current complexity profile is too small for a broad pattern set; keep only essential patterns active.");
  }

  if (!recommendation.selectedArchitectureId) {
    antiPatternWarnings.push("Architecture direction is still weak; defer advanced patterns until the macro structure is confirmed.");
  }

  if (input.complexityProfile !== "enterprise") {
    antiPatternWarnings.push("Avoid Singleton overuse in service layers; prefer explicit composition unless a true shared resource exists.");
  }

  return {
    architecturePriority: architectureFirstCopy,
    selectedArchitectureId: recommendation.selectedArchitectureId,
    selectedRemixId: recommendation.selectedRemixId,
    complexityProfile: input.complexityProfile,
    recommendedPatterns,
    deferredPatterns,
    antiPatternWarnings,
    patternAffinityScore,
    overEngineeringRisk,
    rationale: [
      "Architecture affinity seeds the initial pattern shortlist.",
      "Requirement signals boost patterns that match declared workload needs.",
      "Complexity profile suppresses heavy patterns when they would add more ceremony than value.",
      recommendation.continuationAdvice.summary
    ]
  };
}

export function listDiagnosisStrategies(): DiagnosisStrategy[] {
  return Object.values(diagnosisStrategies);
}
