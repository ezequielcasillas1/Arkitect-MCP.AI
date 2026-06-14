export type AiProviderId =
  | "composer-2.5"
  | "anthropic"
  | "openai"
  | "gemini"
  | "groq"
  | "custom";

export type ProviderInputMode = "arkitect-managed" | "bring-your-own-key";

export interface AiProviderDescriptor {
  id: AiProviderId;
  label: string;
  recommended: boolean;
  inputMode: ProviderInputMode;
  notes: string[];
}

export interface AiSettings {
  preferredProvider: AiProviderId;
  modelName: string;
  allowUserSuppliedKeys: boolean;
  providerAgnostic: boolean;
  fallbackProviders: AiProviderId[];
}

export interface AiRecommendation {
  provider: AiProviderId;
  modelName: string;
  rationale: string;
  fallbackProviders: AiProviderId[];
}

export const DEFAULT_AI_MODEL_ID = "composer-2.5";

export type AiConnectionErrorCode =
  | "missing_key"
  | "invalid_key"
  | "model_unavailable"
  | "network_error"
  | "parse_error"
  | "provider_error"
  | "mock_success"
  | "unsupported_provider";

export interface AiProviderCredentials {
  preferredProvider: AiProviderId;
  modelName: string;
  cursorApiKey?: string;
  providerKeys?: Partial<Record<AiProviderId, string>>;
}

export interface AiConnectionTestResult {
  ok: boolean;
  connected: boolean;
  provider: AiProviderId;
  modelName: string;
  resolvedModelId?: string;
  message: string;
  code?: AiConnectionErrorCode;
  latencyMs?: number;
}

export interface AiDiagnosisFactsBundle {
  repo: {
    routeSource: string;
    path: string;
    name: string;
    summary: string;
    inspection?: {
      manifestFiles: string[];
      topLevelDirectories: string[];
      frameworkHints: string[];
      detectedMarkers: string[];
    };
    github?: {
      owner: string;
      repo: string;
      branch: string;
      defaultBranch: string;
    };
  };
  detections: {
    platformType: string;
    workloadType: string;
    currentArchitecture: string;
    repoHealth: string;
    likelyDiagnosisIntent: string;
  };
  architecturePolicy: {
    principles: string[];
    continueHealthyArchitecture: boolean;
    requiresExplicitMigrationIntent: boolean;
  };
  ruleDecision: {
    recommendedAction: string;
    recommendedExecutionMode: string;
    requiredPermission: string;
    reason: string;
    warnings: string[];
    nextSteps: string[];
    selectedArchitectureId?: string;
    selectedRemixId?: string;
    appliedStrategies: string[];
  };
  catalog: {
    architectureCandidates: Array<{ id: string; score: number; topReason: string }>;
    remixCandidates: Array<{ id: string; score: number; topReason: string }>;
    recommendedPatterns: {
      creational: string[];
      structural: string[];
      behavioral: string[];
    };
    overEngineeringRisk: string;
  };
  requestedOutcome: string;
  executionPermission: string;
}

export interface AiDiagnosisEnrichment {
  status: "success" | "skipped" | "error";
  provider: AiProviderId;
  modelName: string;
  summary: string;
  reasoning: string[];
  nextActions: string[];
  mergedWarnings?: string[];
  latencyMs?: number;
  error?: {
    code: AiConnectionErrorCode;
    message: string;
  };
  generatedAt: string;
}

export interface AiDiagnosisRunRequest {
  facts: AiDiagnosisFactsBundle;
  credentials: AiProviderCredentials;
  repoPath: string;
}

export interface AiDiagnosisRunResult {
  ok: boolean;
  enrichment?: AiDiagnosisEnrichment;
  error?: {
    code: AiConnectionErrorCode;
    message: string;
  };
}

export interface AiModelCostHint {
  modelId: string;
  costTier: "low" | "balanced" | "premium";
  qualityTier: "fast" | "balanced" | "deep";
  summary: string;
}
