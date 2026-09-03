import { describe, expect, it } from "vitest";
import { evaluateArchitectureDecisionGuide, listArchitectureDecisionGuide } from "./architecture-decision-guide.js";
import { recommendArchitecture, toArchitectureRecommendationInput } from "./architecture-recommendation.js";

describe("listArchitectureDecisionGuide", () => {
  it("exposes both decision lenses and ten guide steps", () => {
    const guide = listArchitectureDecisionGuide();

    expect(guide.lenses).toEqual(["software-architect", "senior-developer"]);
    expect(guide.steps).toHaveLength(10);
    expect(guide.steps.map((step) => step.id)).toContain("complexity-budget");
  });
});

describe("evaluateArchitectureDecisionGuide", () => {
  it("rejects event-sourcing for simple CRUD without an audit need", () => {
    const evaluation = evaluateArchitectureDecisionGuide(
      toArchitectureRecommendationInput({
        repoSummary: "small team CRUD mvp",
        requestedOutcome: "ship simple forms",
        complexityProfile: "minimal",
        platformType: "web",
        workloadType: "feature-delivery"
      })
    );

    expect(evaluation.rejected.some((entry) => entry.architectureId === "event-sourcing")).toBe(true);
    expect(evaluation.steps.some((step) => step.id === "audit-history" && step.applied)).toBe(true);
  });
});

describe("recommendArchitecture", () => {
  it("recommends modular-monolith for an Arkitect-like desktop MCP product", () => {
    const result = recommendArchitecture({
      repoSummary:
        "Desktop-first Windows architecture workspace with a marketing site, Cloudflare licensing worker, Stripe-backed membership, provider-agnostic AI, and MCP tool registry.",
      requestedOutcome: "Choose the foundation architecture for this product.",
      requirementTags: ["mcp-tool-registry", "payments", "provider-switching", "workspace"],
      platformType: "desktop",
      workloadType: "architecture-foundation",
      complexityProfile: "balanced",
      decisionLens: "software-architect"
    });

    expect(result.recommendedArchitectureId).toBe("modular-monolith");
    expect(result.lockApplied).toBe(false);
    expect(result.cursorGuidance.some((line) => line.includes("Do not default to vertical slice"))).toBe(true);
    expect(result.adrSummary.length).toBeGreaterThan(0);
    expect(result.rejected.some((entry) => entry.architectureId === "event-sourcing")).toBe(true);
  });

  it("does not lock vertical slice unless lockCurrentArchitecture is set", () => {
    const result = recommendArchitecture({
      currentArchitecture: "vertical-slice",
      repoHealth: "healthy",
      platformType: "desktop",
      workloadType: "architecture-foundation",
      complexityProfile: "balanced",
      lockCurrentArchitecture: false
    });

    expect(result.lockApplied).toBe(false);
    expect(result.recommendedArchitectureId).not.toBe("unknown");
  });

  it("honors an explicit selectedArchitectureId", () => {
    const result = recommendArchitecture({
      selectedArchitectureId: "hexagonal",
      platformType: "api",
      complexityProfile: "balanced"
    });

    expect(result.recommendedArchitectureId).toBe("hexagonal");
    expect(result.lockApplied).toBe(true);
  });
});
