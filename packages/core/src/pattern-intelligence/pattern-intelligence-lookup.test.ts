import { describe, expect, it } from "vitest";
import { lookupPatternIntelligence } from "./pattern-intelligence-lookup.js";

describe("lookupPatternIntelligence", () => {
  it("returns all patterns and principles when no filter is provided", () => {
    const result = lookupPatternIntelligence();
    expect(result.patterns.length).toBeGreaterThanOrEqual(22);
    expect(result.principles.length).toBe(8);
  });

  it("filters by patternId and joins the catalog entry", () => {
    const result = lookupPatternIntelligence({ patternId: "observer" });
    expect(result.patterns).toHaveLength(1);
    expect(result.patterns[0].catalog?.displayName).toBeTruthy();
    expect(result.patterns[0].intelligence.intent.length).toBeGreaterThan(0);
  });

  it("filters patterns and principles by principleId", () => {
    const result = lookupPatternIntelligence({ principleId: "single-responsibility" });
    expect(result.principles).toHaveLength(1);
    expect(result.principles[0].id).toBe("single-responsibility");
    expect(result.patterns.length).toBeGreaterThan(0);
  });
});
