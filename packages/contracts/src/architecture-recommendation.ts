import type {
  ArchitectureCatalogId,
  ArchitectureDecisionGuideStepId,
  ArchitectureDecisionLens,
  ArchitectureGuideStepResult,
  ArchitectureRejection,
  ComplexityProfile,
  RemixProfileId,
  ScoredRecommendation
} from "./catalog.js";
import type { ClientSession } from "./client-session.js";
import type {
  ArchitectureStyle,
  DiagnosisIntent,
  ExecutionPermission,
  PlatformType,
  RepoHealth,
  WorkloadType
} from "./taxonomy.js";

export type {
  ArchitectureDecisionGuideStepId,
  ArchitectureGuideStepResult,
  ArchitectureRejection,
  ArchitectureDecisionLens
} from "./catalog.js";

export interface ArchitectureDecisionGuideStep {
  id: ArchitectureDecisionGuideStepId;
  question: string;
  architectNote: string;
  developerNote: string;
  keywords: string[];
  boost: ArchitectureCatalogId[];
  reject: ArchitectureCatalogId[];
  weight: number;
}

export interface ArchitectureDecisionGuide {
  id: "master-architecture-decision";
  displayName: string;
  summary: string;
  lenses: ArchitectureDecisionLens[];
  steps: ArchitectureDecisionGuideStep[];
}

export interface ArchitectureRecommendationRequest {
  repoPath?: string;
  repoSummary?: string;
  requestedOutcome?: string;
  requirementTags?: string[];
  complexityProfile?: ComplexityProfile;
  decisionLens?: ArchitectureDecisionLens;
  platformType?: PlatformType;
  workloadType?: WorkloadType;
  currentArchitecture?: ArchitectureStyle;
  repoHealth?: RepoHealth;
  likelyDiagnosisIntent?: DiagnosisIntent;
  executionPermission?: ExecutionPermission;
  selectedRemixId?: RemixProfileId;
  selectedArchitectureId?: ArchitectureCatalogId;
  lockCurrentArchitecture?: boolean;
}

export interface ArchitectureRecommendationResult {
  summary: string;
  recommendedArchitectureId: ArchitectureCatalogId | "unknown";
  selectedRemixId?: RemixProfileId;
  architectureCandidates: ScoredRecommendation<ArchitectureCatalogId>[];
  remixCandidates: ScoredRecommendation<RemixProfileId>[];
  rejected: ArchitectureRejection[];
  guideStepsApplied: ArchitectureGuideStepResult[];
  decisionLens: ArchitectureDecisionLens;
  adrSummary: string;
  cursorGuidance: string[];
  lockApplied: boolean;
  clientSession?: ClientSession;
}
