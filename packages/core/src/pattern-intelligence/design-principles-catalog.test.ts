import { describe, expect, it } from "vitest";
import { DESIGN_PRINCIPLES, getDesignPrincipleEntry } from "./design-principles-catalog.js";

describe("design-principles-catalog", () => {
  it("covers 3 general principles and 5 SOLID principles", () => {
    expect(DESIGN_PRINCIPLES).toHaveLength(8);
    const solid = DESIGN_PRINCIPLES.filter((entry) => entry.family === "solid");
    const general = DESIGN_PRINCIPLES.filter((entry) => entry.family === "general");
    expect(solid).toHaveLength(5);
    expect(general).toHaveLength(3);
  });

  it("returns metadata via getDesignPrincipleEntry", () => {
    const srp = getDesignPrincipleEntry("single-responsibility");
    expect(srp?.family).toBe("solid");
    expect(srp?.relatedPatternIds.length).toBeGreaterThan(0);
  });

  it("keeps every entry non-empty", () => {
    for (const entry of DESIGN_PRINCIPLES) {
      expect(entry.summary.length).toBeGreaterThan(0);
      expect(entry.examples.length).toBeGreaterThan(0);
      expect(entry.violations.length).toBeGreaterThan(0);
    }
  });
});
