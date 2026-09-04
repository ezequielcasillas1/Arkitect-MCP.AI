import type { ClientSession, DesignPatternId, DiagnosisMcpPayload, DiagnosisResult } from "@arkitect/contracts";
import { buildClientSessionGuidance, recommendPatterns, resolveRelationChains } from "@arkitect/core";

function createCursorGuidance(result: DiagnosisResult, session?: ClientSession): string[] {
  const topSuggestions = result.requirementTagSuggestions.slice(0, 4).map((item) => item.tag);

  return [
    `Detected platform: ${result.signals.platformType.final.value}`,
    `Detected architecture: ${result.signals.currentArchitecture.final.value}`,
    `Repo health: ${result.signals.repoHealth.final.value}`,
    `Recommended action: ${result.decision.recommendedAction}`,
    `Selected architecture path: ${result.decision.selectedArchitectureId ?? "not yet stable"}`,
    `Foundation: ${result.decision.legalTriple?.foundation ?? result.catalogRecommendation.legalTriple?.foundation ?? "none"}`,
    `Internal style: ${result.decision.legalTriple?.internal ?? result.catalogRecommendation.legalTriple?.internal ?? "none"}`,
    `Edge style: ${result.decision.legalTriple?.edge ?? result.catalogRecommendation.legalTriple?.edge ?? "none"}`,
    `Supporting: ${result.decision.legalTriple?.supporting ?? result.catalogRecommendation.legalTriple?.supporting ?? "none"}`,
    `Selected remix profile: ${result.decision.selectedRemixId ?? "none — remix only names a covered triple"}`,
    "Do not default to vertical slice; honor recommend_architecture or the legal triple.",
    `Suggested requirement tags: ${topSuggestions.length > 0 ? topSuggestions.join(", ") : "none yet"}`,
    `Active strategies: ${result.decision.appliedStrategies.join(", ")}`,
    "Honor overrides before applying any structural changes.",
    "Do not auto-refactor spaghetti structure without explicit migration or refactor intent.",
    ...(session ? buildClientSessionGuidance(session) : [])
  ];
}

function collectTopRecommendedPatternIds(result: DiagnosisResult): DesignPatternId[] {
  const map = result.patternGuidance.recommendedPatterns;
  return [...map.creational, ...map.structural, ...map.behavioral];
}

export function toDiagnosisMcpPayload(result: DiagnosisResult, session?: ClientSession): DiagnosisMcpPayload {
  const seedPatternIds = collectTopRecommendedPatternIds(result);
  const relationChains = resolveRelationChains(seedPatternIds).slice(0, 5);
  const recommendation = recommendPatterns({
    repoSummary: result.intake.repoSummary,
    requestedOutcome: result.intake.requestedOutcome,
    requirementTags: result.intake.catalogPreferences.requirementTags,
    complexityProfile: result.intake.catalogPreferences.complexityProfile,
    architectureId: result.decision.selectedArchitectureId,
    remixId: result.decision.selectedRemixId,
    seedPatternIds
  });

  return {
    summary: `${result.intake.repoName} is ready for diagnosis-first architecture guidance with dashboard-visible detections and permission-aware execution.`,
    diagnosis: result,
    cursorGuidance: createCursorGuidance(result, session),
    ...(session ? { clientSession: session } : {}),
    patternRelationChains: relationChains,
    patternAdrSummary: recommendation.adrSummary
  };
}
