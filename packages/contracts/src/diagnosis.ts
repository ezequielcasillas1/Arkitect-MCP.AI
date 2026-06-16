import type { AiDiagnosisEnrichment, AiRecommendation, AiSettings } from "./ai.js";
import type {
  ArchitectureCatalogId,
  CatalogRecommendationBundle,
  CatalogSelectionInput,
  DiagnosisStrategyId,
  PatternGuidance,
  RemixProfileId
} from "./catalog.js";
import type {
  ArchitectureAction,
  DiagnosisRouteSource,
  ArchitecturePolicyPrinciple,
  DiagnosisSignals,
  ExecutionMode,
  ExecutionPermission,
  UserSignalInputs
} from "./taxonomy.js";
import type { GitHubRoutePayload } from "./github.js";

export interface RepoInspection {
  source: DiagnosisRouteSource;
  path: string;
  repoName: string;
  exists: boolean;
  isDirectory: boolean;
  hasGit: boolean;
  manifestFiles: string[];
  topLevelDirectories: string[];
  topLevelFiles: string[];
  samplePaths: string[];
  frameworkHints: string[];
  detectedMarkers: string[];
  validationErrors: string[];
  summary: string;
  inspectedAt: string;
}

export interface DiagnosisIntake {
  routeSource: DiagnosisRouteSource;
  repoPath: string;
  repoName: string;
  repoSummary: string;
  repoInspection?: RepoInspection;
  githubRoute?: GitHubRoutePayload;
  requestedOutcome: string;
  executionMode: ExecutionMode;
  executionPermission: ExecutionPermission;
  ai: AiSettings;
  userInput: UserSignalInputs;
  catalogPreferences: CatalogSelectionInput;
}

export interface ArchitecturePolicy {
  principles: ArchitecturePolicyPrinciple[];
  continueHealthyArchitecture: boolean;
  autoRefactorAllowed: boolean;
  requiresExplicitMigrationIntent: boolean;
  reportUnhealthyStructureBeforeChanges: boolean;
}

export interface ArchitectureDecision {
  recommendedAction: ArchitectureAction;
  recommendedExecutionMode: ExecutionMode;
  requiredPermission: ExecutionPermission;
  autoContinue: boolean;
  selectedArchitectureId?: ArchitectureCatalogId;
  selectedRemixId?: RemixProfileId;
  appliedStrategies: DiagnosisStrategyId[];
  reason: string;
  warnings: string[];
  nextSteps: string[];
}

export type DashboardStepId =
  | "repo-connection"
  | "project-profile"
  | "architecture-policy"
  | "ai-settings"
  | "mcp-connection"
  | "review-and-run"
  | "results-overview";

export interface ExperienceFlowStep {
  id: DashboardStepId;
  title: string;
  description: string;
  status: "visible" | "attention" | "locked";
}

export interface DiagnosisResult {
  intake: DiagnosisIntake;
  signals: DiagnosisSignals;
  architecturePolicy: ArchitecturePolicy;
  decision: ArchitectureDecision;
  catalogRecommendation: CatalogRecommendationBundle;
  patternGuidance: PatternGuidance;
  aiRecommendation: AiRecommendation;
  aiEnrichment?: AiDiagnosisEnrichment;
  experienceFlow: ExperienceFlowStep[];
  generatedAt: string;
}
