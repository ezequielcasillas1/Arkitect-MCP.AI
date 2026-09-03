import type {
  ArchitectureCatalogId,
  ArchitectureRecommendationRequest,
  ArchitectureRecommendationResult,
  CatalogRecommendationInput,
  ComplexityProfile
} from "@arkitect/contracts";
import { isArchitectureCatalogId } from "../catalog.js";
import { recommendCatalog } from "../recommendation-engine.js";
import { evaluateArchitectureDecisionGuide } from "./architecture-decision-guide.js";

export function toArchitectureRecommendationInput(
  request: ArchitectureRecommendationRequest = {}
): CatalogRecommendationInput {
  return {
    platformType: request.platformType ?? "unknown",
    workloadType: request.workloadType ?? "architecture-foundation",
    currentArchitecture: request.currentArchitecture ?? "unknown",
    repoHealth: request.repoHealth ?? "unknown",
    likelyDiagnosisIntent: request.likelyDiagnosisIntent ?? "architecture-upgrade",
    executionPermission: request.executionPermission ?? "generate-plan",
    selectedRemixId: request.selectedRemixId,
    selectedArchitectureId: request.selectedArchitectureId,
    lockCurrentArchitecture: request.lockCurrentArchitecture ?? false,
    complexityProfile: request.complexityProfile ?? "balanced",
    requirementTags: request.requirementTags ?? [],
    repoSummary: request.repoSummary,
    requestedOutcome: request.requestedOutcome,
    decisionLens: request.decisionLens ?? "software-architect"
  };
}

function buildAdrSummary(
  recommended: ArchitectureCatalogId | "unknown",
  remixId: string | undefined,
  steps: ArchitectureRecommendationResult["guideStepsApplied"],
  rejectedCount: number,
  profile: ComplexityProfile
): string {
  const applied = steps.filter((step) => step.applied).map((step) => step.id);
  const foundation = recommended === "unknown" ? "no stable foundation yet" : recommended;
  const remix = remixId ? ` Remix ${remixId} is the supporting hybrid.` : "";
  const stepText = applied.length > 0 ? ` Guide steps: ${applied.join(", ")}.` : "";
  const rejectText = rejectedCount > 0 ? ` ${rejectedCount} unfit styles were eliminated.` : "";
  return `Recommend ${foundation} for the ${profile} complexity profile.${remix}${stepText}${rejectText} Confirm before locking continuation.`;
}

export function recommendArchitecture(
  request: ArchitectureRecommendationRequest = {}
): ArchitectureRecommendationResult {
  const input = toArchitectureRecommendationInput(request);
  const catalog = recommendCatalog(input);
  const evaluation = evaluateArchitectureDecisionGuide(input);
  const recommendedArchitectureId = catalog.selectedArchitectureId ?? "unknown";
  const lockApplied = Boolean(
    input.selectedArchitectureId ||
      (input.lockCurrentArchitecture && isArchitectureCatalogId(input.currentArchitecture))
  );

  const cursorGuidance = [
    `Recommended architecture: ${recommendedArchitectureId}`,
    `Selected remix profile: ${catalog.selectedRemixId ?? "auto-ranked only"}`,
    `Decision lens: ${evaluation.lens}`,
    `Lock applied: ${lockApplied ? "yes" : "no"}`,
    "Do not default to vertical slice.",
    "Implement against the recommended foundation, remix, and patterns unless the user explicitly overrides.",
    "Keep modularity and clear boundaries regardless of the chosen architecture."
  ];

  const adrSummary = buildAdrSummary(
    recommendedArchitectureId,
    catalog.selectedRemixId,
    evaluation.steps,
    evaluation.rejected.length,
    input.complexityProfile
  );

  const summary =
    recommendedArchitectureId === "unknown"
      ? `No stable architecture emerged for the ${input.complexityProfile} profile — keep the foundation undecided until signals sharpen.`
      : `Recommended ${recommendedArchitectureId} using the ${evaluation.lens} decision guide.`;

  return {
    summary,
    recommendedArchitectureId,
    selectedRemixId: catalog.selectedRemixId,
    architectureCandidates: catalog.architectureCandidates,
    remixCandidates: catalog.remixCandidates,
    rejected: evaluation.rejected,
    guideStepsApplied: evaluation.steps,
    decisionLens: evaluation.lens,
    adrSummary,
    cursorGuidance,
    lockApplied
  };
}
