import type { AiProviderDescriptor, AiRecommendation, AiSettings } from "@arkitect/contracts";

export const providerCatalog: AiProviderDescriptor[] = [
  {
    id: "composer-2.5",
    label: "Composer 2.5",
    recommended: true,
    inputMode: "bring-your-own-key",
    notes: [
      "Use your Cursor API Key; Composer is the selected model family/build.",
      "Arkitect recommends composer-2.5 by default and can recognize newer Composer-family builds when available."
    ]
  },
  {
    id: "anthropic",
    label: "Anthropic",
    recommended: false,
    inputMode: "bring-your-own-key",
    notes: ["User-supplied API key supported.", "Useful when teams standardize on Anthropic tooling."]
  },
  {
    id: "openai",
    label: "OpenAI",
    recommended: false,
    inputMode: "bring-your-own-key",
    notes: ["User-supplied API key supported.", "Good fit when a repo already uses OpenAI models elsewhere."]
  },
  {
    id: "gemini",
    label: "Gemini",
    recommended: false,
    inputMode: "bring-your-own-key",
    notes: ["User-supplied API key supported.", "Suitable for teams already working in the Google ecosystem."]
  },
  {
    id: "groq",
    label: "Groq",
    recommended: false,
    inputMode: "bring-your-own-key",
    notes: ["User-supplied API key supported.", "Low-latency option for interactive analysis loops."]
  },
  {
    id: "custom",
    label: "Custom Provider",
    recommended: false,
    inputMode: "bring-your-own-key",
    notes: ["Reserved for future adapters.", "Keeps Arkitect provider-agnostic."]
  }
];

export function createDefaultAiSettings(): AiSettings {
  return {
    preferredProvider: "composer-2.5",
    modelName: "composer-2.5",
    allowUserSuppliedKeys: true,
    providerAgnostic: true,
    fallbackProviders: ["anthropic", "openai", "gemini"]
  };
}

export function createRecommendedModel(): AiRecommendation {
  const defaults = createDefaultAiSettings();

  return {
    provider: defaults.preferredProvider,
    modelName: defaults.modelName,
    rationale:
      "Arkitect stays provider-agnostic. Use a Cursor account/programmatic API key, keep composer-2.5 as the default model, and allow newer Composer-family builds when they become available.",
    fallbackProviders: defaults.fallbackProviders
  };
}
