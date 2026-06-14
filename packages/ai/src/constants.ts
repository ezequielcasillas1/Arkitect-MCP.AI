import type { AiModelCostHint } from "@arkitect/contracts";

export const DEFAULT_MODEL_ID = "composer-2.5";

export const MOCK_API_KEY = "arkitect-mock";

export const modelCostHints: AiModelCostHint[] = [
  {
    modelId: "composer-2.5",
    costTier: "low",
    qualityTier: "balanced",
    summary:
      "Recommended default for repo diagnosis. Coding-focused Composer family with strong reasoning at lower cost than general frontier models."
  },
  {
    modelId: "composer-2.5-fast",
    costTier: "low",
    qualityTier: "fast",
    summary: "Lower-latency Composer variant. Good for quick connection checks; use standard composer-2.5 for deeper diagnosis."
  },
  {
    modelId: "claude-sonnet",
    costTier: "balanced",
    qualityTier: "deep",
    summary: "Bring-your-own Anthropic key. Higher reasoning depth, higher per-token cost."
  },
  {
    modelId: "gpt-4.1",
    costTier: "premium",
    qualityTier: "deep",
    summary: "Bring-your-own OpenAI key. Strong general reasoning; best when teams already standardize on OpenAI."
  }
];

export function resolveModelCostHint(modelId: string): AiModelCostHint {
  const normalized = modelId.trim().toLowerCase();
  const exact = modelCostHints.find((hint) => hint.modelId === normalized);

  if (exact) {
    return exact;
  }

  if (normalized.includes("composer")) {
    return {
      modelId: normalized,
      costTier: normalized.includes("fast") ? "low" : "low",
      qualityTier: normalized.includes("fast") ? "fast" : "balanced",
      summary: "Composer-family build recognized. Newer Composer ids route through Cursor when available on your account."
    };
  }

  return {
    modelId: normalized || DEFAULT_MODEL_ID,
    costTier: "balanced",
    qualityTier: "balanced",
    summary: "User-selected model. Cost and quality depend on the upstream provider pricing."
  };
}
