import { describe, expect, it } from "vitest";
import {
  PATTERN_INTELLIGENCE,
  getPatternIntelligenceEntry,
  listPatternIntelligence
} from "./pattern-intelligence-catalog.js";

describe("pattern-intelligence-catalog", () => {
  it("covers all GoF patterns with complete intelligence shape", () => {
    expect(PATTERN_INTELLIGENCE.length).toBeGreaterThanOrEqual(22);
    for (const entry of PATTERN_INTELLIGENCE) {
      expect(entry.intent.length).toBeGreaterThan(0);
      expect(entry.applicability.length).toBeGreaterThan(0);
      expect(entry.implementationSteps.length).toBeGreaterThan(0);
      expect(entry.pros.length).toBeGreaterThan(0);
      expect(entry.cons.length).toBeGreaterThan(0);
      expect(entry.relations.length).toBeGreaterThan(0);
      expect(entry.referenceUrl).toContain("refactoring.guru/design-patterns/");
    }
  });

  it("returns matching entry from getPatternIntelligenceEntry", () => {
    const strategy = getPatternIntelligenceEntry("strategy");
    expect(strategy?.intent).toContain("family of algorithms");
    expect(strategy?.relations.some((relation) => relation.targetPatternId === "state")).toBe(true);
  });

  it("lists patterns in a stable order matching the internal catalog", () => {
    const listed = listPatternIntelligence();
    expect(listed[0].patternId).toBe("factory-method");
    expect(listed[listed.length - 1].patternId).toBe("interpreter");
  });
});
