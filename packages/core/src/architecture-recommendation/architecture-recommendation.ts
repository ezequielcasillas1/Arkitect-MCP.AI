import type {
  ArchitectureCatalogId,
  ArchitectureRecommendationRequest,
  ArchitectureRecommendationResult,
  CatalogRecommendationInput,
  ComplexityProfile,
  LegalArchitectureTriple
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
    likelyDiagnosisIntent: request.likelyDiagnosisIntent ?? "unknown",
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

function formatTriple(triple: LegalArchitectureTriple): string {
  return `foundation ${triple.foundation ?? "none"} / internal ${triple.internal ?? "none"} / edge ${triple.edge ?? "none"} / supporting ${triple.supporting ?? "none"}`;
}

function buildAdrSummary(
  recommended: ArchitectureCatalogId | "unknown",
  remixId: string | undefined,
  triple: LegalArchitectureTriple,
  steps: ArchitectureRecommendationResult["guideStepsApplied"],
  rejectedCount: number,
  profile: ComplexityProfile
): string {
  const applied = steps.filter((step) => step.applied).map((step) => step.id);
  const foundation = recommended === "unknown" ? "no stable foundation yet" : recommended;
  const remix = remixId ? ` Remix ${remixId} names this triple.` : " No remix covers enough of this triple to name it.";
  const stepText = applied.length > 0 ? ` Guide steps: ${applied.join(", ")}.` : "";
  const rejectText = rejectedCount > 0 ? ` ${rejectedCount} styles were rejected as a foundation.` : "";
  return `Recommend ${foundation} (${formatTriple(triple)}) for the ${profile} complexity profile.${remix}${stepText}${rejectText} Confirm before locking continuation.`;
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
    `Foundation: ${catalog.legalTriple.foundation ?? recommendedArchitectureId}`,
    `Internal style: ${catalog.legalTriple.internal ?? "none"}`,
    `Edge style: ${catalog.legalTriple.edge ?? "none"}`,
    `Supporting: ${catalog.legalTriple.supporting ?? "none"}`,
    `Selected remix profile: ${catalog.selectedRemixId ?? "none — remix only names a covered triple"}`,
    `Decision lens: ${evaluation.lens}`,
    `Lock applied: ${lockApplied ? "yes" : "no"}`,
    "Do not default to vertical slice.",
    "Implement against the recommended foundation, remix, and patterns unless the user explicitly overrides.",
    "Keep modularity and clear boundaries regardless of the chosen architecture."
  ];

  const adrSummary = buildAdrSummary(
    recommendedArchitectureId,
    catalog.selectedRemixId,
    catalog.legalTriple,
    evaluation.steps,
    evaluation.rejected.length,
    input.complexityProfile
  );

  const summary =
    recommendedArchitectureId === "unknown"
      ? `No stable architecture emerged for the ${input.complexityProfile} profile — keep the foundation undecided until signals sharpen.`
      : `Recommended ${recommendedArchitectureId} using the ${evaluation.lens} decision guide (${formatTriple(catalog.legalTriple)}).`;

  return {
    summary,
    recommendedArchitectureId,
    selectedRemixId: catalog.selectedRemixId,
    legalTriple: catalog.legalTriple,
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
