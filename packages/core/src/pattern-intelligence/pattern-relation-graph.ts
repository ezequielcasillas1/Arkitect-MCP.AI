import type {
  DesignPatternId,
  DesignPrincipleId,
  PatternRelation,
  PatternRelationChainEntry
} from "@arkitect/contracts";
import { PATTERN_INTELLIGENCE, getPatternIntelligenceEntry } from "./pattern-intelligence-catalog.js";
import { DESIGN_PRINCIPLES } from "./design-principles-catalog.js";

export function getRelationsFor(patternId: DesignPatternId): PatternRelation[] {
  return getPatternIntelligenceEntry(patternId)?.relations ?? [];
}

export function resolveRelationChains(seedIds: DesignPatternId[]): PatternRelationChainEntry[] {
  const seen = new Set<string>();
  const chains: PatternRelationChainEntry[] = [];
  const seedSet = new Set(seedIds);

  for (const seedId of seedIds) {
    const relations = getRelationsFor(seedId);
    for (const relation of relations) {
      const key = `${seedId}->${relation.targetPatternId}:${relation.kind}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      chains.push({
        from: seedId,
        to: relation.targetPatternId,
        kind: relation.kind,
        rationale: relation.rationale
      });
    }
  }

  // Prioritize chains whose target is another seed to surface reinforcing combinations first.
  return chains.sort((left, right) => {
    const leftBonus = seedSet.has(left.to) ? 1 : 0;
    const rightBonus = seedSet.has(right.to) ? 1 : 0;
    return rightBonus - leftBonus;
  });
}

export function getPatternsByPrinciple(principleId: DesignPrincipleId): DesignPatternId[] {
  const principleHits = PATTERN_INTELLIGENCE.filter((entry) => entry.solidAlignment.includes(principleId)).map(
    (entry) => entry.patternId
  );
  const explicit = DESIGN_PRINCIPLES.find((entry) => entry.id === principleId)?.relatedPatternIds ?? [];
  const combined = new Set<DesignPatternId>([...principleHits, ...explicit]);
  return Array.from(combined);
}
