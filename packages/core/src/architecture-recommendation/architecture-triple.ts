import type {
  ArchitectureCatalogId,
  CatalogRecommendationInput,
  LegalArchitectureTriple,
  RecommendationReason,
  RemixProfileId,
  ScoredRecommendation
} from "@arkitect/contracts";
import { getArchitectureCatalogEntry, getRemixProfileCatalogEntry, isArchitectureCatalogId, listRemixProfileCatalog } from "../catalog.js";
import { architecturesAreRelated, getArchitectureRole, listArchitectureIdsForRole, relatedIdsForRole } from "./architecture-roles.js";

export interface ArchitectureScoreEntry {
  id: ArchitectureCatalogId;
  score: number;
  reasons: RecommendationReason[];
}

const RELATED_ROLE_BOOST = 0.7;
const ROLE_MIN_SCORE = 0.8;
const REMIX_COVERAGE_FLOOR = 2;

function entryName(id: ArchitectureCatalogId): string {
  return getArchitectureCatalogEntry(id)?.displayName ?? id;
}

function hasRealSupportingSignal(entry: ArchitectureScoreEntry | undefined): boolean {
  if (!entry) {
    return false;
  }

  return entry.reasons.some((reason) => {
    if (reason.source === "requirement-signal") {
      return true;
    }

    if (reason.source !== "decision-guide") {
      return false;
    }

    return !/complexity budget|default to modular|one operational unit/i.test(reason.summary);
  });
}

function pickBest(
  entries: ArchitectureScoreEntry[],
  ids: ArchitectureCatalogId[],
  extras: Array<{ id: ArchitectureCatalogId; score: number; summary: string }> = []
): ArchitectureScoreEntry | undefined {
  const allowed = new Set(ids);
  const merged = new Map<ArchitectureCatalogId, ArchitectureScoreEntry>();

  for (const entry of entries) {
    if (!allowed.has(entry.id)) {
      continue;
    }

    merged.set(entry.id, { id: entry.id, score: entry.score, reasons: [...entry.reasons] });
  }

  for (const extra of extras) {
    if (!allowed.has(extra.id)) {
      continue;
    }

    const current = merged.get(extra.id) ?? { id: extra.id, score: 0, reasons: [] };
    current.score += extra.score;
    current.reasons.push({
      source: "architecture-affinity",
      summary: extra.summary,
      weight: extra.score
    });
    merged.set(extra.id, current);
  }

  return [...merged.values()].sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))[0];
}

function relatedBoosts(
  sourceId: ArchitectureCatalogId | undefined,
  role: "internal" | "edge",
  sourceLabel: string
): Array<{ id: ArchitectureCatalogId; score: number; summary: string }> {
  if (!sourceId) {
    return [];
  }

  return relatedIdsForRole(sourceId, role).map((id) => ({
    id,
    score: RELATED_ROLE_BOOST,
    summary: `${entryName(sourceId)} relatedArchitectures proposes ${entryName(id)} as ${role} (${sourceLabel}).`
  }));
}

function remixNamesSlot(remixIds: ArchitectureCatalogId[], slot: ArchitectureCatalogId): number {
  if (remixIds.includes(slot)) {
    return 1;
  }

  if (remixIds.some((id) => architecturesAreRelated(id, slot))) {
    return 0.5;
  }

  return 0;
}

export function scoreRemixCoverage(
  remixArchitectureIds: ArchitectureCatalogId[],
  triple: Pick<LegalArchitectureTriple, "foundation" | "internal" | "edge" | "supporting">
): number {
  const slots = [triple.foundation, triple.internal, triple.edge, triple.supporting].filter(
    (id): id is ArchitectureCatalogId => Boolean(id)
  );

  return slots.reduce((sum, slot) => sum + remixNamesSlot(remixArchitectureIds, slot), 0);
}

export function rankRemixesForTriple(
  input: CatalogRecommendationInput,
  triple: Pick<LegalArchitectureTriple, "foundation" | "internal" | "edge" | "supporting">
): ScoredRecommendation<RemixProfileId>[] {
  const ranked = listRemixProfileCatalog()
    .map((remix) => {
      let coverage = scoreRemixCoverage(remix.architectureIds, triple);
      const reasons: RecommendationReason[] = [];

      if (coverage > 0) {
        reasons.push({
          source: "architecture-affinity",
          summary: `${remix.displayName} names ${coverage.toFixed(1)} role(s) of the legal triple.`,
          weight: coverage
        });
      }

      if (triple.supporting && remix.architectureIds.includes(triple.supporting)) {
        coverage += 1;
        reasons.push({
          source: "requirement-signal",
          summary: `${remix.displayName} names the surviving supporting style ${triple.supporting}.`,
          weight: 1
        });
      }

      if (input.selectedRemixId === remix.id) {
        reasons.push({
          source: "continuation",
          summary: "User-selected remix should stay visible in recommendations.",
          weight: 3.5
        });
      }

      return {
        id: remix.id,
        score: coverage + (input.selectedRemixId === remix.id ? 3.5 : 0),
        reasons
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id));

  const maxScore = ranked[0]?.score ?? 1;

  return ranked.slice(0, 5).map((entry) => ({
    id: entry.id,
    score: Number((entry.score / maxScore).toFixed(2)),
    reasons: entry.reasons.sort((left, right) => right.weight - left.weight)
  }));
}

export function assembleLegalTriple(
  input: CatalogRecommendationInput,
  entries: ArchitectureScoreEntry[],
  foundationRejected: Set<ArchitectureCatalogId>
): LegalArchitectureTriple {
  const rationale: string[] = [];
  const foundationIds = listArchitectureIdsForRole("foundation").filter((id) => !foundationRejected.has(id));
  const explicitId =
    input.selectedArchitectureId ??
    (input.lockCurrentArchitecture && isArchitectureCatalogId(input.currentArchitecture)
      ? input.currentArchitecture
      : undefined);
  const explicitRole = explicitId ? getArchitectureRole(explicitId) : undefined;

  const foundationEntry =
    explicitId && explicitRole === "foundation"
      ? { id: explicitId, score: 2.8, reasons: [] as RecommendationReason[] }
      : pickBest(entries, foundationIds);

  const foundation = foundationEntry && foundationEntry.score > 0 ? foundationEntry.id : undefined;
  if (foundation) {
    rationale.push(`Foundation ${entryName(foundation)} is the deploy unit.`);
    const proposedInternal = relatedIdsForRole(foundation, "internal");
    const proposedEdge = relatedIdsForRole(foundation, "edge");
    if (proposedInternal.length > 0 || proposedEdge.length > 0) {
      rationale.push(
        `${entryName(foundation)} relatedArchitectures proposes ${[
          ...proposedInternal.map((id) => `internal ${entryName(id)}`),
          ...proposedEdge.map((id) => `edge ${entryName(id)}`)
        ].join(", ")}.`
      );
    }
  }

  const internalEntry =
    explicitId && explicitRole === "internal"
      ? { id: explicitId, score: 2.8, reasons: [] as RecommendationReason[] }
      : pickBest(entries, listArchitectureIdsForRole("internal"), relatedBoosts(foundation, "internal", "foundation"));
  const internal =
    internalEntry && internalEntry.score >= ROLE_MIN_SCORE ? internalEntry.id : undefined;
  if (internal) {
    rationale.push(`Internal ${entryName(internal)} owns the tree inside the foundation.`);
  }

  const edgeEntry =
    explicitId && explicitRole === "edge"
      ? { id: explicitId, score: 2.8, reasons: [] as RecommendationReason[] }
      : pickBest(entries, listArchitectureIdsForRole("edge"), [
          ...relatedBoosts(foundation, "edge", "foundation"),
          ...relatedBoosts(internal, "edge", "internal")
        ]);
  const edge = edgeEntry && edgeEntry.score >= ROLE_MIN_SCORE ? edgeEntry.id : undefined;
  if (edge) {
    rationale.push(`Edge ${entryName(edge)} is the replaceable I/O style.`);
  }

  const supportingEntry =
    explicitId && explicitRole === "supporting"
      ? { id: explicitId, score: 2.8, reasons: [] as RecommendationReason[] }
      : pickBest(entries, listArchitectureIdsForRole("supporting"));
  const supporting =
    explicitId && explicitRole === "supporting"
      ? explicitId
      : supportingEntry && supportingEntry.score >= ROLE_MIN_SCORE && hasRealSupportingSignal(supportingEntry)
        ? supportingEntry.id
        : undefined;
  if (supporting) {
    rationale.push(`Supporting ${entryName(supporting)} survived a real requirement signal.`);
  }

  const remixCandidates = rankRemixesForTriple(input, { foundation, internal, edge, supporting });
  const remixId = input.selectedRemixId ?? (remixCandidates[0] && scoreRemixCoverage(
    getRemixProfileCatalogEntry(remixCandidates[0].id)?.architectureIds ?? [],
    { foundation, internal, edge, supporting }
  ) >= REMIX_COVERAGE_FLOOR
    ? remixCandidates[0].id
    : undefined);

  if (remixId) {
    rationale.push(`Remix ${getRemixProfileCatalogEntry(remixId)?.displayName ?? remixId} names this triple.`);
  } else {
    rationale.push("No remix covers enough of this triple to name it.");
  }

  return {
    foundation,
    internal,
    edge,
    supporting,
    remixId,
    rationale
  };
}
