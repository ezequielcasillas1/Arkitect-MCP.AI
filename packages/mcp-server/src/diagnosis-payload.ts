import type { DiagnosisMcpPayload, DiagnosisResult } from "@arkitect/contracts";

function createCursorGuidance(result: DiagnosisResult): string[] {
  const topSuggestions = result.requirementTagSuggestions.slice(0, 4).map((item) => item.tag);

  return [
    `Detected platform: ${result.signals.platformType.final.value}`,
    `Detected architecture: ${result.signals.currentArchitecture.final.value}`,
    `Repo health: ${result.signals.repoHealth.final.value}`,
    `Recommended action: ${result.decision.recommendedAction}`,
    `Selected architecture path: ${result.decision.selectedArchitectureId ?? "not yet stable"}`,
    `Selected remix profile: ${result.decision.selectedRemixId ?? "auto-ranked only"}`,
    `Suggested requirement tags: ${topSuggestions.length > 0 ? topSuggestions.join(", ") : "none yet"}`,
    `Active strategies: ${result.decision.appliedStrategies.join(", ")}`,
    "Honor overrides before applying any structural changes.",
    "Do not auto-refactor spaghetti structure without explicit migration or refactor intent."
  ];
}

export function toDiagnosisMcpPayload(result: DiagnosisResult): DiagnosisMcpPayload {
  return {
    summary: `${result.intake.repoName} is ready for diagnosis-first architecture guidance with dashboard-visible detections and permission-aware execution.`,
    diagnosis: result,
    cursorGuidance: createCursorGuidance(result)
  };
}
