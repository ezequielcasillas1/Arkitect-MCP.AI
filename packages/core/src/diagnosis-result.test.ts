import { describe, expect, it } from "vitest";
import type { DiagnosisFieldValueMap } from "@arkitect/contracts";
import type { Detection } from "@arkitect/contracts";
import { createDefaultIntake, createDiagnosisResult } from "./diagnosis-result.js";

function createDetection<T>(value: T): Detection<T> {
  return {
    value,
    confidence: 0.9,
    level: "high",
    source: "auto-detected",
    rationale: "Test detection."
  };
}

function createTestAutoDetections(): {
  [K in keyof DiagnosisFieldValueMap]: Detection<DiagnosisFieldValueMap[K]>;
} {
  return {
    platformType: createDetection("desktop"),
    workloadType: createDetection("architecture-foundation"),
    currentArchitecture: createDetection("vertical-slice"),
    repoHealth: createDetection("healthy"),
    likelyDiagnosisIntent: createDetection("review")
  };
}

describe("createDiagnosisResult", () => {
  it("builds decision, catalog recommendation, and experience flow", () => {
    const intake = createDefaultIntake();
    const result = createDiagnosisResult(intake, createTestAutoDetections());

    expect(result.intake.repoName).toBe("Arkitect");
    expect(result.decision.recommendedAction).toBeTruthy();
    expect(result.catalogRecommendation.architectureCandidates.length).toBeGreaterThan(0);
    expect(result.experienceFlow.some((step) => step.id === "results-overview")).toBe(true);
    expect(result.requirementTagSuggestions.length).toBeGreaterThan(0);
  });

  it("honors user architecture override in final signals", () => {
    const intake = createDefaultIntake();
    intake.userInput.currentArchitecture = {
      override: "event-driven"
    };

    const result = createDiagnosisResult(intake, createTestAutoDetections());

    expect(result.signals.currentArchitecture.final.value).toBe("event-driven");
    expect(result.signals.currentArchitecture.final.source).toBe("user-override");
  });
});
