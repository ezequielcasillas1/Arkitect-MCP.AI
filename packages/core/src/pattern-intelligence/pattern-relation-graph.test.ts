import { describe, expect, it } from "vitest";
import {
  getPatternsByPrinciple,
  getRelationsFor,
  resolveRelationChains
} from "./pattern-relation-graph.js";

describe("pattern-relation-graph", () => {
  it("returns relations for a known pattern", () => {
    const relations = getRelationsFor("strategy");
    expect(relations.length).toBeGreaterThan(0);
    expect(relations.some((relation) => relation.targetPatternId === "state")).toBe(true);
  });

  it("resolves one-hop chains without duplicates and prioritizes seed-to-seed edges", () => {
    const chains = resolveRelationChains(["strategy", "state", "decorator"]);
    const uniqueKeys = new Set(chains.map((chain) => `${chain.from}->${chain.to}:${chain.kind}`));
    expect(uniqueKeys.size).toBe(chains.length);
    const strategyToState = chains.find(
      (chain) => chain.from === "strategy" && chain.to === "state"
    );
    expect(strategyToState).toBeDefined();
    // Seed-to-seed edges should surface early (bonus sort places them first among same-source relations).
    const firstIndex = chains.findIndex((chain) => chain.from === "strategy" && chain.to === "state");
    const nonSeedIndex = chains.findIndex(
      (chain) => chain.from === "strategy" && chain.to === "factory-method"
    );
    expect(firstIndex).toBeLessThan(nonSeedIndex);
  });

  it("returns patterns that reinforce a design principle", () => {
    const patterns = getPatternsByPrinciple("open-closed");
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns).toContain("strategy");
  });
});
