import type {
  ArchitectureCatalogId,
  ComplexityProfile,
  DesignPatternId,
  OverEngineeringRisk,
  PatternFamily,
  RemixProfileId
} from "./catalog.js";

export type DesignPrincipleId =
  | "encapsulate-what-varies"
  | "program-to-an-interface"
  | "favor-composition-over-inheritance"
  | "single-responsibility"
  | "open-closed"
  | "liskov-substitution"
  | "interface-segregation"
  | "dependency-inversion";

export type DesignPrincipleFamily = "solid" | "general";

export type PatternRelationKind =
  | "often-paired-with"
  | "alternative-to"
  | "extends"
  | "specialization-of"
  | "conflicts-with";

export interface PatternRelation {
  targetPatternId: DesignPatternId;
  kind: PatternRelationKind;
  rationale: string;
}

export interface PatternIntelligenceEntry {
  patternId: DesignPatternId;
  intent: string;
  problem: string;
  solution: string;
  applicability: string[];
  implementationSteps: string[];
  pros: string[];
  cons: string[];
  relations: PatternRelation[];
  solidAlignment: DesignPrincipleId[];
  antiPatternWarnings: string[];
  referenceUrl: string;
  complexityThreshold: ComplexityProfile;
}

export interface DesignPrincipleEntry {
  id: DesignPrincipleId;
  name: string;
  family: DesignPrincipleFamily;
  summary: string;
  keyIdea: string;
  examples: string[];
  violations: string[];
  relatedPatternIds: DesignPatternId[];
  referenceUrl: string;
}

export interface PatternRelationChainEntry {
  from: DesignPatternId;
  to: DesignPatternId;
  kind: PatternRelationKind;
  rationale: string;
}

export interface PatternRecommendationRequest {
  repoPath?: string;
  repoSummary?: string;
  requestedOutcome?: string;
  requirementTags?: string[];
  architectureId?: ArchitectureCatalogId;
  remixId?: RemixProfileId;
  complexityProfile?: ComplexityProfile;
  seedPatternIds?: DesignPatternId[];
}

export interface PatternRecommendationEntry {
  patternId: DesignPatternId;
  family: PatternFamily;
  score: number;
  rationale: string[];
}

export interface PatternRecommendationResult {
  summary: string;
  recommendedPatterns: PatternRecommendationEntry[];
  deferredPatterns: PatternRecommendationEntry[];
  antiPatternWarnings: string[];
  patternAffinityScore: number;
  overEngineeringRisk: OverEngineeringRisk;
  relationChains: PatternRelationChainEntry[];
  adrSummary: string;
}

export interface PatternIntelligenceLookupRequest {
  patternId?: DesignPatternId;
  family?: PatternFamily;
  principleId?: DesignPrincipleId;
}

export interface PatternIntelligenceLookupEntry {
  intelligence: PatternIntelligenceEntry;
  catalog?: {
    displayName: string;
    family: PatternFamily;
    summary: string;
    tag: string;
  };
}

export interface PatternIntelligenceLookupResult {
  summary: string;
  patterns: PatternIntelligenceLookupEntry[];
  principles: DesignPrincipleEntry[];
}

export interface PatternIntelligenceCatalogPayload {
  summary: string;
  totalPatterns: number;
  totalPrinciples: number;
  totalRelations: number;
  patterns: PatternIntelligenceEntry[];
  principles: DesignPrincipleEntry[];
}

export interface DesignPrinciplesCatalogPayload {
  summary: string;
  total: number;
  items: DesignPrincipleEntry[];
}
