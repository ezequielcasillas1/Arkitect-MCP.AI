import type {
  DesignPrincipleEntry,
  PatternIntelligenceLookupEntry,
  PatternIntelligenceLookupRequest,
  PatternIntelligenceLookupResult
} from "@arkitect/contracts";
import { getDesignPatternCatalogEntry } from "../catalog.js";
import { DESIGN_PRINCIPLES } from "./design-principles-catalog.js";
import { PATTERN_INTELLIGENCE } from "./pattern-intelligence-catalog.js";
import { getPatternsByPrinciple } from "./pattern-relation-graph.js";

function joinEntry(patternId: PatternIntelligenceLookupEntry["intelligence"]["patternId"]): PatternIntelligenceLookupEntry | undefined {
  const intelligence = PATTERN_INTELLIGENCE.find((entry) => entry.patternId === patternId);
  if (!intelligence) return undefined;
  const catalog = getDesignPatternCatalogEntry(patternId);
  return {
    intelligence,
    catalog: catalog
      ? {
          displayName: catalog.displayName,
          family: catalog.family,
          summary: catalog.summary,
          tag: catalog.tag
        }
      : undefined
  };
}

export function lookupPatternIntelligence(
  request: PatternIntelligenceLookupRequest = {}
): PatternIntelligenceLookupResult {
  let patternIds = PATTERN_INTELLIGENCE.map((entry) => entry.patternId);

  if (request.patternId) {
    patternIds = patternIds.filter((id) => id === request.patternId);
  }

  if (request.family) {
    patternIds = patternIds.filter((id) => {
      const catalog = getDesignPatternCatalogEntry(id);
      return catalog?.family === request.family;
    });
  }

  let principles: DesignPrincipleEntry[] = DESIGN_PRINCIPLES;

  if (request.principleId) {
    principles = principles.filter((entry) => entry.id === request.principleId);
    const principleTargets = new Set(getPatternsByPrinciple(request.principleId));
    patternIds = patternIds.filter((id) => principleTargets.has(id));
  }

  const patterns: PatternIntelligenceLookupEntry[] = patternIds
    .map((id) => joinEntry(id))
    .filter((entry): entry is PatternIntelligenceLookupEntry => entry !== undefined);

  const filterParts: string[] = [];
  if (request.patternId) filterParts.push(`pattern=${request.patternId}`);
  if (request.family) filterParts.push(`family=${request.family}`);
  if (request.principleId) filterParts.push(`principle=${request.principleId}`);
  const filterSuffix = filterParts.length > 0 ? ` (filters: ${filterParts.join(", ")})` : "";

  const summary = `Matched ${patterns.length} design pattern${patterns.length === 1 ? "" : "s"} and ${principles.length} design principle${principles.length === 1 ? "" : "s"}${filterSuffix}.`;

  return {
    summary,
    patterns,
    principles
  };
}
