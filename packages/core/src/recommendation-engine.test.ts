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
  it("continues healthy repos only when the current architecture is locked", () => {
    const recommendation = recommendCatalog({
      ...healthyVerticalSliceInput,
      lockCurrentArchitecture: true
    });

    expect(recommendation.continuationAdvice.mode).toBe("continue");
    expect(recommendation.selectedArchitectureId).toBe("vertical-slice");
    expect(recommendation.relevantStrategies).toContain("continue-healthy-architecture");
  });

  it("does not auto-continue a healthy repo without an explicit lock", () => {
    const recommendation = recommendCatalog(healthyVerticalSliceInput);

    expect(recommendation.continuationAdvice.autoContinue).toBe(false);
    expect(recommendation.continuationAdvice.mode).toBe("guide");
    expect(recommendation.relevantStrategies).toContain("recommend-then-confirm");
  });

  it("honors an explicit selectedArchitectureId over scoring", () => {
    const recommendation = recommendCatalog({
      ...healthyVerticalSliceInput,
      selectedArchitectureId: "hexagonal"
    });

    expect(recommendation.selectedArchitectureId).toBe("hexagonal");
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

  it("does not pick AI-Native or hexagonal from Ghost host-prose in the summary", () => {
    const recommendation = recommendCatalog({
      platformType: "web",
      workloadType: "architecture-foundation",
      currentArchitecture: "unknown",
      repoHealth: "unknown",
      likelyDiagnosisIntent: "feature",
      executionPermission: "generate-plan",
      complexityProfile: "balanced",
      requirementTags: ["ghost-theme", "publication", "handlebars"],
      repoSummary: "Ghost theme workspace with custom-domain and AI marketing copy leftover",
      requestedOutcome: "Ship a publication theme"
    });

    expect(recommendation.selectedRemixId).not.toBe("ai-native-stack");
    expect(recommendation.legalTriple.edge).not.toBe("hexagonal");
    expect(recommendation.architectureCandidates.map((candidate) => candidate.id)).not.toContain("domain-driven-design");
    expect(recommendation.legalTriple.rationale.some((line) => line.includes("relatedArchitectures"))).toBe(true);
  });

  it("keeps saga and event-sourcing available as supporting after foundation rejects", () => {
    const sagaRecommendation = recommendCatalog({
      platformType: "api",
      workloadType: "feature-delivery",
      currentArchitecture: "unknown",
      repoHealth: "unknown",
      likelyDiagnosisIntent: "feature",
      executionPermission: "apply-safe-changes",
      complexityProfile: "enterprise",
      requirementTags: ["saga-workflow", "distributed transaction", "compensating"]
    });

    expect(sagaRecommendation.architectureCandidates.map((candidate) => candidate.id)).toContain("saga");
    expect(["saga", "cqrs"]).toContain(sagaRecommendation.legalTriple.supporting);
    expect(sagaRecommendation.rejectedArchitectures.filter((entry) => entry.architectureId === "saga").every((entry) => entry.role === "foundation")).toBe(true);
    expect(sagaRecommendation.remixCandidates.map((candidate) => candidate.id)).toContain("udi-dahan-messaging-mix");

    const ledgerRecommendation = recommendCatalog({
      platformType: "api",
      workloadType: "architecture-foundation",
      currentArchitecture: "unknown",
      repoHealth: "unknown",
      likelyDiagnosisIntent: "architecture-upgrade",
      executionPermission: "generate-plan",
      complexityProfile: "enterprise",
      requirementTags: ["ledger", "audit", "immutable history"]
    });

    expect(ledgerRecommendation.architectureCandidates.map((candidate) => candidate.id)).toContain("event-sourcing");
    expect(["event-sourcing", "cqrs"]).toContain(ledgerRecommendation.legalTriple.supporting);
    expect(
      ledgerRecommendation.rejectedArchitectures
        .filter((entry) => entry.architectureId === "event-sourcing")
        .every((entry) => entry.role === "foundation")
    ).toBe(true);
    expect(
      ledgerRecommendation.remixCandidates.some((candidate) =>
        ["greg-young-event-machine", "vaughn-vernon-ddd-remix", "udi-dahan-messaging-mix"].includes(candidate.id)
      )
    ).toBe(true);
  });
});
