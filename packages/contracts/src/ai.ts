export type AiProviderId =
  | "composer-2.5"
  | "anthropic"
  | "openai"
  | "gemini"
  | "groq"
  | "custom";

export type ProviderInputMode = "arkitect-managed" | "bring-your-own-key";

export interface AiProviderDescriptor {
  id: AiProviderId;
  label: string;
  recommended: boolean;
  inputMode: ProviderInputMode;
  notes: string[];
}

export interface AiSettings {
  preferredProvider: AiProviderId;
  modelName: string;
  allowUserSuppliedKeys: boolean;
  providerAgnostic: boolean;
  fallbackProviders: AiProviderId[];
}

export interface AiRecommendation {
  provider: AiProviderId;
  modelName: string;
  rationale: string;
  fallbackProviders: AiProviderId[];
}
