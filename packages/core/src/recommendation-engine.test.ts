import { describe, expect, it } from "vitest";
import type { CatalogRecommendationInput } from "@arkitect/contracts";
import { recommendCatalog } from "./recommendation-engine.js";

const healthyVerticalSliceInput: CatalogRecommendationInput = {
  platformType: "desktop",
  workloadType: "architecture-foundation",
  currentArchitecture: "vertical-slice",
  repoHealth: "healthy",
  likelyDiagnosisIntent: "review",
  executionPermission: "apply-safe-changes",
  complexityProfile: "balanced",
  requirementTags: ["vertical-slice-delivery"]
};

describe("recommendCatalog", () => {
  it("continues healthy vertical-slice repos", () => {
    const recommendation = recommendCatalog(healthyVerticalSliceInput);

    expect(recommendation.continuationAdvice.mode).toBe("continue");
    expect(recommendation.selectedArchitectureId).toBe("vertical-slice");
    expect(recommendation.architectureCandidates[0]?.id).toBe("vertical-slice");
  });

  it("reports unhealthy repos without structural permission", () => {
    const recommendation = recommendCatalog({
      ...healthyVerticalSliceInput,
      repoHealth: "spaghetti",
      likelyDiagnosisIntent: "review",
      executionPermission: "read-only"
    });

    expect(recommendation.continuationAdvice.mode).toBe("report-only");
    expect(recommendation.relevantStrategies).toContain("report-unhealthy-structure");
  });

  it("plans structural remediation when intent and permission allow it", () => {
    const recommendation = recommendCatalog({
      ...healthyVerticalSliceInput,
      repoHealth: "drifting",
      likelyDiagnosisIntent: "migration",
      executionPermission: "apply-structural-changes"
    });

    expect(recommendation.continuationAdvice.mode).toBe("plan-only");
    expect(recommendation.relevantStrategies.length).toBeGreaterThan(0);
  });
});
