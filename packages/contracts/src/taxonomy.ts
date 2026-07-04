export type PlatformType =
  | "desktop"
  | "web"
  | "api"
  | "cli"
  | "library"
  | "worker"
  | "hybrid"
  | "unknown";

export type WorkloadType =
  | "architecture-foundation"
  | "feature-delivery"
  | "bug-fix"
  | "migration"
  | "repo-recovery"
  | "diagnosis"
  | "unknown";

export type ArchitectureStyle =
  | "vertical-slice"
  | "clean-architecture"
  | "hexagonal"
  | "modular-monolith"
  | "minimal-api"
  | "domain-driven-design"
  | "event-driven"
  | "microservices"
  | "cqrs"
  | "screaming-architecture"
  | "repository-pattern"
  | "layered"
  | "event-sourcing"
  | "microkernel"
  | "onion-architecture"
  | "monolithic"
  | "soa"
  | "unit-of-work"
  | "anti-corruption-layer"
  | "circuit-breaker"
  | "saga"
  | "api-gateway"
  | "bff"
  | "strangler-fig"
  | "spaghetti"
  | "unknown";

export type RepoHealth = "healthy" | "drifting" | "spaghetti" | "unknown";

export type DiagnosisIntent =
  | "review"
  | "feature"
  | "bug-fix"
  | "migration"
  | "architecture-upgrade"
  | "repo-recovery"
  | "unknown";

export type ConfidenceLevel = "low" | "medium" | "high";

export type DetectionSource =
  | "auto-detected"
  | "user-hint"
  | "user-confirmed"
  | "user-override"
  | "policy";

export type ExecutionMode =
  | "dry-run"
  | "advisory"
  | "guided"
  | "approved-change"
  | "approved-refactor";

export type ExecutionPermission =
  | "read-only"
  | "generate-plan"
  | "propose-changes"
  | "apply-safe-changes"
  | "apply-structural-changes";

export type DiagnosisRouteSource = "local-path" | "github-api";

export type ArchitecturePolicyPrinciple =
  | "architecture-first"
  | "design-patterns-second"
  | "continue-healthy-architecture"
  | "report-structure-before-refactor";

export type ArchitectureAction =
  | "continue-existing-architecture"
  | "guide-new-foundation"
  | "report-issues-only"
  | "plan-structural-remediation";

export interface Detection<T> {
  value: T;
  confidence: number;
  level: ConfidenceLevel;
  source: DetectionSource;
  rationale: string;
}

export interface DiagnosisFieldValueMap {
  platformType: PlatformType;
  workloadType: WorkloadType;
  currentArchitecture: ArchitectureStyle;
  repoHealth: RepoHealth;
  likelyDiagnosisIntent: DiagnosisIntent;
}

export type DiagnosisField = keyof DiagnosisFieldValueMap;

export type UserSignalInputs = {
  [K in DiagnosisField]?: {
    hint?: DiagnosisFieldValueMap[K];
    confirmed?: boolean;
    override?: DiagnosisFieldValueMap[K];
  };
};

export interface DiagnosisSignal<T> {
  auto: Detection<T>;
  hint?: T;
  confirmed?: boolean;
  override?: T;
  final: Detection<T>;
}

export type DiagnosisSignals = {
  [K in DiagnosisField]: DiagnosisSignal<DiagnosisFieldValueMap[K]>;
};
