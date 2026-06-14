import { createDefaultAiSettings, createRecommendedModel } from "@arkitect/ai";
import type {
  ArchitectureDecision,
  ArchitecturePolicy,
  CatalogRecommendationBundle,
  CatalogRecommendationInput,
  Detection,
  DiagnosisField,
  DiagnosisFieldValueMap,
  DiagnosisIntake,
  DiagnosisResult,
  DiagnosisSignal,
  DiagnosisSignals,
  ExecutionPermission,
  UserSignalInputs
} from "@arkitect/contracts";
import { buildPatternGuidance, recommendCatalog } from "./recommendation-engine.js";

type AutoDetectionMap = {
  [K in DiagnosisField]: Detection<DiagnosisFieldValueMap[K]>;
};

export const defaultArchitecturePolicy: ArchitecturePolicy = {
  principles: [
    "architecture-first",
    "design-patterns-second",
    "continue-healthy-architecture",
    "report-structure-before-refactor"
  ],
  continueHealthyArchitecture: true,
  autoRefactorAllowed: false,
  requiresExplicitMigrationIntent: true,
  reportUnhealthyStructureBeforeChanges: true
};

function createUserDrivenDetection<T>(
  source: "user-hint" | "user-confirmed" | "user-override",
  value: T,
  rationale: string,
  confidence: number
): Detection<T> {
  return {
    value,
    confidence,
    level: confidence >= 0.86 ? "high" : "medium",
    source,
    rationale
  };
}

function mergeSignal<K extends DiagnosisField>(
  field: K,
  auto: Detection<DiagnosisFieldValueMap[K]>,
  userInput: UserSignalInputs
): DiagnosisSignal<DiagnosisFieldValueMap[K]> {
  const userValue = userInput[field];

  if (!userValue) {
    return {
      auto,
      final: auto
    };
  }

  if (userValue.override) {
    return {
      auto,
      hint: userValue.hint,
      confirmed: userValue.confirmed,
      override: userValue.override,
      final: createUserDrivenDetection(
        "user-override",
        userValue.override,
        `User override replaced the auto-detected ${field} value.`,
        1
      )
    };
  }

  if (userValue.confirmed) {
    return {
      auto,
      hint: userValue.hint,
      confirmed: true,
      final: createUserDrivenDetection(
        "user-confirmed",
        auto.value,
        `User confirmed the auto-detected ${field} value.`,
        Math.max(auto.confidence, 0.98)
      )
    };
  }

  if (userValue.hint && (auto.value === "unknown" || auto.confidence < 0.75)) {
    return {
      auto,
      hint: userValue.hint,
      final: createUserDrivenDetection(
        "user-hint",
        userValue.hint,
        `User hint promoted because the auto-detected ${field} signal was weak.`,
        0.83
      )
    };
  }

  return {
    auto,
    hint: userValue.hint,
    final: auto
  };
}

export function createDiagnosisSignals(
  autoDetections: AutoDetectionMap,
  userInput: UserSignalInputs
): DiagnosisSignals {
  return {
    platformType: mergeSignal("platformType", autoDetections.platformType, userInput),
    workloadType: mergeSignal("workloadType", autoDetections.workloadType, userInput),
    currentArchitecture: mergeSignal("currentArchitecture", autoDetections.currentArchitecture, userInput),
    repoHealth: mergeSignal("repoHealth", autoDetections.repoHealth, userInput),
    likelyDiagnosisIntent: mergeSignal("likelyDiagnosisIntent", autoDetections.likelyDiagnosisIntent, userInput)
  };
}

function hasStructuralIntent(result: DiagnosisSignals): boolean {
  const intent = result.likelyDiagnosisIntent.final.value;
  return intent === "migration" || intent === "architecture-upgrade" || intent === "repo-recovery";
}

function canApplyStructure(permission: ExecutionPermission): boolean {
  return permission === "apply-structural-changes";
}

function toCatalogRecommendationInput(intake: DiagnosisIntake, signals: DiagnosisSignals): CatalogRecommendationInput {
  return {
    platformType: signals.platformType.final.value,
    workloadType: signals.workloadType.final.value,
    currentArchitecture: signals.currentArchitecture.final.value,
    repoHealth: signals.repoHealth.final.value,
    likelyDiagnosisIntent: signals.likelyDiagnosisIntent.final.value,
    executionPermission: intake.executionPermission,
    selectedRemixId: intake.catalogPreferences.selectedRemixId,
    complexityProfile: intake.catalogPreferences.complexityProfile,
    requirementTags: intake.catalogPreferences.requirementTags
  };
}

function createDecision(
  intake: DiagnosisIntake,
  signals: DiagnosisSignals,
  recommendation: CatalogRecommendationBundle
): ArchitectureDecision {
  const structuralIntent = hasStructuralIntent(signals);
  const structuralPermission = canApplyStructure(intake.executionPermission);
  const warnings: string[] = [];
  let nextSteps: string[];

  if (recommendation.continuationAdvice.mode === "continue") {
    nextSteps = [
      "Continue inside the detected architecture boundaries.",
      "Keep remix and pattern guidance visible as secondary, not primary, decisions."
    ];
  } else if (recommendation.continuationAdvice.mode === "plan-only") {
    warnings.push("Architectural remediation changes should be reviewed before execution.");
    nextSteps = [
      "Prepare a structural remediation plan before touching module boundaries.",
      "Separate diagnosis reporting from migration or refactor execution."
    ];
  } else if (recommendation.continuationAdvice.mode === "report-only") {
    warnings.push("Explicit refactor or migration intent is still required for structural changes.");
    nextSteps = [
      "Show the structural problems clearly in the dashboard and MCP payload.",
      "Wait for an explicit structural request before changing the layout."
    ];
  } else {
    warnings.push("Detection confidence is not yet high enough to continue automatically.");
    nextSteps = [
      "Ask the user to confirm or override the architecture direction from the encoded catalog.",
      "Hold advanced pattern usage until the architecture choice is visible and stable."
    ];
  }

  if ((signals.repoHealth.final.value === "spaghetti" || signals.repoHealth.final.value === "drifting") && !structuralIntent) {
    warnings.push("Report-only guardrail is active until structural intent becomes explicit.");
  }

  if (structuralIntent && !structuralPermission) {
    warnings.push("Structural intent is present, but execution permission does not yet allow structural changes.");
  }

  return {
    recommendedAction: recommendation.continuationAdvice.action,
    recommendedExecutionMode:
      recommendation.continuationAdvice.mode === "plan-only"
        ? "approved-refactor"
        : recommendation.continuationAdvice.mode === "report-only"
          ? "advisory"
          : "guided",
    requiredPermission: recommendation.continuationAdvice.requiredPermission,
    autoContinue: recommendation.continuationAdvice.autoContinue,
    selectedArchitectureId: recommendation.selectedArchitectureId,
    selectedRemixId: recommendation.selectedRemixId,
    appliedStrategies: recommendation.relevantStrategies,
    reason: recommendation.continuationAdvice.summary,
    warnings,
    nextSteps
  };
}

function createExperienceFlow(result: DiagnosisResult): DiagnosisResult["experienceFlow"] {
  const warnings = result.decision.warnings.length;
  const lowConfidence = Object.values(result.signals).some((signal) => signal.final.level === "low");

  return [
    {
      id: "repo-connection",
      title: "Repo Connection",
      description: "Connect the local repository and capture the baseline intake context.",
      status: "visible"
    },
    {
      id: "project-profile",
      title: "Project Profile",
      description: "Review auto-detected platform, workload, architecture, repo health, intent, and catalog-aligned candidates.",
      status: lowConfidence ? "attention" : "visible"
    },
    {
      id: "architecture-policy",
      title: "Architecture Policy",
      description: "See whether Arkitect will continue, guide, or report on the detected structure and remix context.",
      status: warnings > 0 ? "attention" : "visible"
    },
    {
      id: "ai-settings",
      title: "AI Settings",
      description: "Choose the recommended default or bring your own provider keys.",
      status: "visible"
    },
    {
      id: "review-and-run",
      title: "Review And Run",
      description: "Inspect the requested execution permission before any changes are performed.",
      status: result.decision.requiredPermission === "read-only" ? "attention" : "visible"
    },
    {
      id: "results-overview",
      title: "Results Overview",
      description: "Expose the diagnosis, catalog recommendations, and MCP payload for Cursor-aware output.",
      status: "visible"
    }
  ];
}

export function createDefaultIntake(repoPath = "C:\\Dev\\Arkitect-mcp.com"): DiagnosisIntake {
  return {
    routeSource: "local-path",
    repoPath,
    repoName: "Arkitect",
    repoSummary:
      "Desktop-first Windows 11 architecture workspace with a marketing site, Cloudflare licensing worker, Stripe-backed membership, and provider-agnostic AI defaults.",
    requestedOutcome:
      "Implement the approved Arkitect foundation with desktop dashboard detections, architecture-first policy flow, and MCP-readable diagnosis results.",
    executionMode: "guided",
    executionPermission: "apply-safe-changes",
    ai: createDefaultAiSettings(),
    userInput: {
      platformType: {
        hint: "desktop",
        confirmed: true
      },
      currentArchitecture: {
        hint: "vertical-slice"
      }
    },
    catalogPreferences: {
      complexityProfile: "balanced",
      requirementTags: [
        "desktop-shell",
        "mcp-tool-registry",
        "agent-services",
        "provider-switching",
        "local-repo-first"
      ]
    }
  };
}

export function createDiagnosisResult(
  intake: DiagnosisIntake,
  autoDetections: AutoDetectionMap
): DiagnosisResult {
  const signals = createDiagnosisSignals(autoDetections, intake.userInput);
  const catalogInput = toCatalogRecommendationInput(intake, signals);
  const catalogRecommendation = recommendCatalog(catalogInput);
  const decision = createDecision(intake, signals, catalogRecommendation);
  const result: DiagnosisResult = {
    intake,
    signals,
    architecturePolicy: defaultArchitecturePolicy,
    decision,
    catalogRecommendation,
    patternGuidance: buildPatternGuidance(catalogInput, catalogRecommendation),
    aiRecommendation: createRecommendedModel(),
    experienceFlow: [],
    generatedAt: new Date().toISOString()
  };

  result.experienceFlow = createExperienceFlow(result);

  return result;
}
