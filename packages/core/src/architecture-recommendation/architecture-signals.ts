import type { CatalogRecommendationInput } from "@arkitect/contracts";

const HOST_VOCAB = new Set(["ai", "agent", "llm", "mcp", "ledger", "queue"]);

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function matchesKeyword(text: string, keyword: string): boolean {
  const trimmed = keyword.trim();
  if (!trimmed || !text) {
    return false;
  }

  const pattern = escapeRegExp(trimmed).replace(/\\ /g, "\\s+");
  return new RegExp(`(?<![A-Za-z0-9])${pattern}(?![A-Za-z0-9])`, "i").test(text);
}

export function matchKeywords(text: string, keywords: string[]): string[] {
  return keywords.filter((keyword) => matchesKeyword(text, keyword));
}

export function trustedSignalText(input: Pick<CatalogRecommendationInput, "requirementTags" | "requestedOutcome">): string {
  return `${input.requirementTags.join(" ")} ${input.requestedOutcome ?? ""}`.trim().toLowerCase();
}

export function inspectionSignalText(input: Pick<CatalogRecommendationInput, "inspectionSignals">): string {
  return (input.inspectionSignals ?? []).join(" ").toLowerCase();
}

export function fileAwareSignalText(input: CatalogRecommendationInput): string {
  return `${trustedSignalText(input)} ${inspectionSignalText(input)}`.trim();
}

export function guideSignalText(input: CatalogRecommendationInput): string {
  return [
    trustedSignalText(input),
    inspectionSignalText(input),
    input.platformType,
    input.workloadType,
    input.likelyDiagnosisIntent
  ]
    .join(" ")
    .toLowerCase();
}

export function isHostVocabularyKeyword(keyword: string): boolean {
  return HOST_VOCAB.has(keyword.toLowerCase());
}

export function countKeywordMatches(text: string, keywords: string[]): number {
  return matchKeywords(text, keywords).length;
}

export function hasMonorepoFileSignal(input: CatalogRecommendationInput): boolean {
  const markers = (input.inspectionSignals ?? []).map((value) => value.toLowerCase());
  return markers.some((marker) =>
    /pnpm-workspace|lerna\.json|nx\.json|turbo\.json|(^|\/)(apps|packages)(\/|$)/i.test(marker)
  );
}

export function hasSliceFileSignal(input: CatalogRecommendationInput): boolean {
  const markers = (input.inspectionSignals ?? []).map((value) => value.toLowerCase());
  return markers.some((marker) => /feature[-_/ ]folder|(^|\/)(features|slices)(\/|$)/i.test(marker));
}

export function hasTrustedHostVocabulary(input: CatalogRecommendationInput, keywords: string[]): boolean {
  return matchKeywords(trustedSignalText(input), keywords).length > 0;
}
