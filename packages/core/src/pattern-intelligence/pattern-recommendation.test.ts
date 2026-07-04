import { describe, expect, it } from "vitest";
import { recommendPatterns } from "./pattern-recommendation.js";

describe("recommendPatterns", () => {
  it("returns an ADR summary and empty recommendations when no signals are present", () => {
    const result = recommendPatterns({});
    expect(result.recommendedPatterns).toHaveLength(0);
    expect(result.deferredPatterns).toHaveLength(0);
    expect(result.adrSummary.length).toBeGreaterThan(0);
    expect(result.antiPatternWarnings.length).toBeGreaterThan(0);
  });

  it("boosts AI-orchestration signals to strategy + facade + mediator", () => {
    const result = recommendPatterns({
      requestedOutcome: "orchestrate AI MCP tools across providers",
      requirementTags: ["ai", "agent", "mcp"],
      complexityProfile: "balanced"
    });
    const ids = result.recommendedPatterns.map((entry) => entry.patternId);
    expect(ids).toContain("strategy");
    expect(ids).toContain("facade");
    expect(ids).toContain("mediator");
    expect(result.relationChains.length).toBeGreaterThan(0);
    expect(result.patternAffinityScore).toBeGreaterThan(0);
  });

  it("defers enterprise-only patterns below their complexity threshold", () => {
    const result = recommendPatterns({
      requestedOutcome: "build a small rule engine",
      requirementTags: ["dsl", "rule"],
      complexityProfile: "minimal"
    });
    const deferredIds = result.deferredPatterns.map((entry) => entry.patternId);
    expect(deferredIds).toContain("interpreter");
    expect(deferredIds).toContain("visitor");
  });

  it("respects user-supplied seedPatternIds", () => {
    const result = recommendPatterns({
      seedPatternIds: ["command", "memento"],
      complexityProfile: "structured"
    });
    const ids = result.recommendedPatterns.map((entry) => entry.patternId);
    expect(ids).toContain("command");
    expect(ids).toContain("memento");
  });
});
