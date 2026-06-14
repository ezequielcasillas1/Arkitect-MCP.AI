import type {
  AiConnectionErrorCode,
  AiDiagnosisFactsBundle,
  AiDiagnosisEnrichment,
  AiProviderId
} from "@arkitect/contracts";

export function buildDiagnosisPrompt(facts: AiDiagnosisFactsBundle): string {
  return [
    "You are Arkitect's architecture diagnosis assistant.",
    "Reason over the structured facts below. Do NOT invent repo files or paths that are not listed.",
    "The rule engine already produced a baseline decision — enrich, explain, and recommend; do not replace safety guardrails.",
    "",
    "Return ONLY valid JSON with this shape:",
    '{"summary":"one paragraph","reasoning":["bullet","bullet"],"nextActions":["action","action"]}',
    "",
    "Facts bundle:",
    JSON.stringify(facts, null, 2)
  ].join("\n");
}

export interface ParsedAiDiagnosisPayload {
  summary: string;
  reasoning: string[];
  nextActions: string[];
}

export function parseAiDiagnosisResponse(raw: string): ParsedAiDiagnosisPayload | undefined {
  const trimmed = raw.trim();
  const jsonBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim() ?? trimmed;

  try {
    const parsed = JSON.parse(jsonBlock) as Partial<ParsedAiDiagnosisPayload>;

    if (!parsed.summary || typeof parsed.summary !== "string") {
      return undefined;
    }

    return {
      summary: parsed.summary.trim(),
      reasoning: Array.isArray(parsed.reasoning)
        ? parsed.reasoning.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        : [],
      nextActions: Array.isArray(parsed.nextActions)
        ? parsed.nextActions.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        : []
    };
  } catch {
    return undefined;
  }
}

export function createSkippedEnrichment(
  provider: AiProviderId,
  modelName: string,
  message: string
): AiDiagnosisEnrichment {
  return {
    status: "skipped",
    provider,
    modelName,
    summary: message,
    reasoning: ["AI enrichment skipped — rule-based diagnosis remains the baseline."],
    nextActions: [],
    generatedAt: new Date().toISOString()
  };
}

export function createErrorEnrichment(
  provider: AiProviderId,
  modelName: string,
  code: AiConnectionErrorCode,
  message: string
): AiDiagnosisEnrichment {
  return {
    status: "error",
    provider,
    modelName,
    summary: "AI diagnosis could not complete.",
    reasoning: [],
    nextActions: [],
    error: { code, message },
    generatedAt: new Date().toISOString()
  };
}

export function mergeAiEnrichment(
  baselineWarnings: string[],
  baselineNextSteps: string[],
  enrichment: AiDiagnosisEnrichment
): AiDiagnosisEnrichment {
  if (enrichment.status !== "success") {
    return enrichment;
  }

  return {
    ...enrichment,
    mergedWarnings: baselineWarnings,
    nextActions: enrichment.nextActions.length > 0 ? enrichment.nextActions : baselineNextSteps
  };
}
