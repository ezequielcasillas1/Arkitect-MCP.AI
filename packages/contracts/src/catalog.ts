import type {
  ArchitectureAction,
  ArchitectureStyle,
  DiagnosisIntent,
  ExecutionPermission,
  PlatformType,
  RepoHealth,
  WorkloadType
} from "./taxonomy.js";

export type ArchitectureCatalogId = Exclude<ArchitectureStyle, "spaghetti" | "unknown">;

export type ArchitectureCatalogCategory = "foundation" | "supporting" | "data-access";

export type PatternFamily = "creational" | "structural" | "behavioral";

export type DesignPatternId =
  | "singleton"
  | "factory-method"
  | "abstract-factory"
  | "builder"
  | "prototype"
  | "adapter"
  | "facade"
  | "decorator"
  | "proxy"
  | "composite"
  | "bridge"
  | "flyweight"
  | "observer"
  | "strategy"
  | "command"
  | "mediator"
  | "chain-of-responsibility"
  | "template-method"
  | "state"
  | "iterator"
  | "visitor"
  | "memento"
  | "interpreter";

export type RemixProfileId =
  | "martin-fowler-stack"
  | "uncle-bob-special"
  | "jimmy-bogard-slice"
  | "vaughn-vernon-ddd-remix"
  | "udi-dahan-messaging-mix"
  | "greg-young-event-machine"
  | "neal-ford-hybrid-engine"
  | "microsoft-azure-blend"
  | "ai-native-stack"
  | "clean-slice-fusion";

export type ComplexityProfile = "minimal" | "balanced" | "structured" | "enterprise";

export type ArchitectureDecisionLens = "software-architect" | "senior-developer";

export type ArchitectureDecisionGuideStepId =
  | "deploy-units"
  | "domain-complexity"
  | "consistency-model"
  | "provider-integration"
  | "audit-history"
  | "extensibility"
  | "migration-path"
  | "platform-fit"
  | "complexity-budget"
  | "team-and-ownership";

export interface ArchitectureGuideStepResult {
  id: ArchitectureDecisionGuideStepId;
  applied: boolean;
  matchedKeywords: string[];
  boosted: ArchitectureCatalogId[];
  rejected: ArchitectureCatalogId[];
  reason: string;
}

export interface ArchitectureRejection {
  architectureId: ArchitectureCatalogId;
  reason: string;
  stepId: ArchitectureDecisionGuideStepId;
}

export type OverEngineeringRisk = "low" | "moderate" | "high";

export type RecommendationReasonSource =
  | "architecture-affinity"
  | "remix-affinity"
  | "workload-affinity"
  | "platform-affinity"
  | "requirement-signal"
  | "complexity-profile"
  | "diagnosis-intent"
  | "repo-health"
  | "continuation"
  | "policy-guardrail"
  | "decision-guide";

export type DiagnosisStrategyId =
  | "continue-healthy-architecture"
  | "report-unhealthy-structure"
  | "require-explicit-migration-intent"
  | "guide-foundation-selection"
  | "rank-remixes-by-context"
  | "defer-heavy-patterns"
  | "recommend-then-confirm";

export type ContinuationMode = "continue" | "report-only" | "plan-only" | "guide";

export interface CatalogReference<TId extends string = string> {
  kind: "architecture" | "design-pattern" | "concept";
  id?: TId;
  label: string;
  rationale: string;
}

export interface ArchitectureCatalogEntry {
  id: ArchitectureCatalogId;
  displayName: string;
  category: ArchitectureCatalogCategory;
  summary: string;
  bestFor: string[];
  useCases: string[];
  strengths: string[];
  tradeoffs: string[];
  warnings: string[];
  compatiblePlatforms: PlatformType[];
  compatibleWorkloads: WorkloadType[];
  highAffinityPatterns: DesignPatternId[];
  relatedArchitectures: ArchitectureCatalogId[];
  detectionKeywords: string[];
}

export interface DesignPatternCatalogEntry {
  id: DesignPatternId;
  displayName: string;
  family: PatternFamily;
  summary: string;
  bestFor: string[];
  strengths: string[];
  tradeoffs: string[];
  warnings: string[];
  tag: string;
  compatibleArchitectures: ArchitectureCatalogId[];
  compatiblePlatforms: PlatformType[];
  compatibleWorkloads: WorkloadType[];
  deferForProfiles: ComplexityProfile[];
}

export interface RemixProfileCatalogEntry {
  id: RemixProfileId;
  displayName: string;
  summary: string;
  inspiredBy: string;
  bestFor: string[];
  strengths: string[];
  tradeoffs: string[];
  warnings: string[];
  compatiblePlatforms: PlatformType[];
  compatibleWorkloads: WorkloadType[];
  architectureIds: ArchitectureCatalogId[];
  patternIds: DesignPatternId[];
  composedOf: CatalogReference[];
  rationale: string[];
}

export interface PatternRecommendationMap<TPatternId = DesignPatternId> {
  creational: TPatternId[];
  structural: TPatternId[];
  behavioral: TPatternId[];
}

export interface CatalogSelectionInput {
  selectedRemixId?: RemixProfileId;
  selectedArchitectureId?: ArchitectureCatalogId;
  lockCurrentArchitecture?: boolean;
  complexityProfile: ComplexityProfile;
  requirementTags: string[];
}

export interface CatalogRecommendationInput {
  platformType: PlatformType;
  workloadType: WorkloadType;
  currentArchitecture: ArchitectureStyle;
  repoHealth: RepoHealth;
  likelyDiagnosisIntent: DiagnosisIntent;
  executionPermission: ExecutionPermission;
  selectedRemixId?: RemixProfileId;
  selectedArchitectureId?: ArchitectureCatalogId;
  lockCurrentArchitecture?: boolean;
  complexityProfile: ComplexityProfile;
  requirementTags: string[];
  repoSummary?: string;
  requestedOutcome?: string;
  decisionLens?: ArchitectureDecisionLens;
}

export interface RecommendationReason {
  source: RecommendationReasonSource;
  summary: string;
  weight: number;
}

export interface ScoredRecommendation<TId extends string> {
  id: TId;
  score: number;
  reasons: RecommendationReason[];
}

export interface PatternRecommendationCandidate extends ScoredRecommendation<DesignPatternId> {
  family: PatternFamily;
}

export interface DiagnosisStrategy {
  id: DiagnosisStrategyId;
  label: string;
  summary: string;
}

export interface ContinuationAdvice {
  mode: ContinuationMode;
  action: ArchitectureAction;
  autoContinue: boolean;
  summary: string;
  requiredPermission: ExecutionPermission;
}

export interface CatalogRecommendationBundle {
  selectedArchitectureId?: ArchitectureCatalogId;
  selectedRemixId?: RemixProfileId;
  architectureCandidates: ScoredRecommendation<ArchitectureCatalogId>[];
  remixCandidates: ScoredRecommendation<RemixProfileId>[];
  patternCandidates: {
    creational: PatternRecommendationCandidate[];
    structural: PatternRecommendationCandidate[];
    behavioral: PatternRecommendationCandidate[];
  };
  relevantStrategies: DiagnosisStrategyId[];
  continuationAdvice: ContinuationAdvice;
  guideStepsApplied: ArchitectureGuideStepResult[];
  rejectedArchitectures: ArchitectureRejection[];
}

export interface PatternGuidance {
  architecturePriority: string;
  selectedArchitectureId?: ArchitectureCatalogId;
  selectedRemixId?: RemixProfileId;
  complexityProfile: ComplexityProfile;
  recommendedPatterns: PatternRecommendationMap;
  deferredPatterns: DesignPatternId[];
  antiPatternWarnings: string[];
  patternAffinityScore: number;
  overEngineeringRisk: OverEngineeringRisk;
  rationale: string[];
}
