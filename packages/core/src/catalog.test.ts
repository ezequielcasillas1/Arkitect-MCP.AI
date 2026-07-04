import { describe, expect, it } from "vitest";
import { getArchitectureCatalogEntry, getCatalogCounts, listArchitectureCatalog } from "./catalog.js";

const newArchitectureIds = [
  "onion-architecture",
  "monolithic",
  "soa",
  "unit-of-work",
  "anti-corruption-layer",
  "circuit-breaker",
  "saga",
  "api-gateway",
  "bff",
  "strangler-fig"
] as const;

describe("architecture catalog", () => {
  it("includes all 11 newly added architecture entries", () => {
    const ids = listArchitectureCatalog().map((entry) => entry.id);

    newArchitectureIds.forEach((id) => {
      expect(ids).toContain(id);
    });
  });

  it("exposes detection keywords and affinity metadata for new entries", () => {
    newArchitectureIds.forEach((id) => {
      const entry = getArchitectureCatalogEntry(id);

      expect(entry).toBeDefined();
      expect(entry?.displayName.length).toBeGreaterThan(0);
      expect(entry?.detectionKeywords.length).toBeGreaterThan(0);
      expect(entry?.highAffinityPatterns.length).toBeGreaterThan(0);
      expect(entry?.relatedArchitectures.length).toBeGreaterThan(0);
    });
  });

  it("reports expanded architecture count", () => {
    expect(getCatalogCounts().architectures).toBe(24);
  });
});
