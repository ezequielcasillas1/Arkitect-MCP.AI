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

  it("ranks strangler-fig for legacy migration missions", () => {
    const recommendation = recommendCatalog({
      ...healthyVerticalSliceInput,
      repoHealth: "drifting",
      likelyDiagnosisIntent: "migration",
      workloadType: "migration",
      requirementTags: ["legacy-strangler", "migrate legacy", "phased modernization"]
    });

    const rankedIds = recommendation.architectureCandidates.map((candidate) => candidate.id);

    expect(rankedIds).toContain("strangler-fig");
    expect(rankedIds.indexOf("strangler-fig")).toBeLessThan(rankedIds.indexOf("minimal-api") === -1 ? rankedIds.length : rankedIds.indexOf("minimal-api"));
  });

  it("ranks saga for distributed transaction missions", () => {
    const recommendation = recommendCatalog({
      platformType: "api",
      workloadType: "feature-delivery",
      currentArchitecture: "unknown",
      repoHealth: "unknown",
      likelyDiagnosisIntent: "feature",
      executionPermission: "apply-safe-changes",
      complexityProfile: "enterprise",
      requirementTags: ["saga-workflow", "distributed transaction", "compensating"]
    });

    expect(recommendation.architectureCandidates.map((candidate) => candidate.id)).toContain("saga");
  });

  it("ranks circuit-breaker for resilience missions", () => {
    const recommendation = recommendCatalog({
      platformType: "worker",
      workloadType: "feature-delivery",
      currentArchitecture: "unknown",
      repoHealth: "unknown",
      likelyDiagnosisIntent: "feature",
      executionPermission: "apply-safe-changes",
      complexityProfile: "structured",
      requirementTags: ["distributed-resilience", "circuit breaker", "cascading failure"]
    });

    expect(recommendation.architectureCandidates.map((candidate) => candidate.id)).toContain("circuit-breaker");
  });

  it("ranks api-gateway and bff for API composition missions", () => {
    const recommendation = recommendCatalog({
      ...healthyVerticalSliceInput,
      platformType: "web",
      requirementTags: ["api-composition", "bff", "api gateway", "mobile api"]
    });

    const rankedIds = recommendation.architectureCandidates.map((candidate) => candidate.id);

    expect(rankedIds).toContain("api-gateway");
    expect(rankedIds).toContain("bff");
  });

  it("ranks anti-corruption-layer for domain isolation missions", () => {
    const recommendation = recommendCatalog({
      ...healthyVerticalSliceInput,
      requirementTags: ["domain-isolation", "anti-corruption", "legacy integration"]
    });

    const rankedIds = recommendation.architectureCandidates.map((candidate) => candidate.id);

    expect(rankedIds).toContain("anti-corruption-layer");
  });
});
