import type { AiConnectionErrorCode, AiProviderCredentials, AiProviderId } from "@arkitect/contracts";
import { MOCK_API_KEY } from "./constants.js";

export function isMockApiKey(apiKey: string | undefined): boolean {
  return apiKey?.trim() === MOCK_API_KEY;
}

export function resolveActiveApiKey(credentials: AiProviderCredentials): string | undefined {
  const provider = credentials.preferredProvider;

  if (provider === "composer-2.5") {
    return credentials.cursorApiKey?.trim() || undefined;
  }

  return credentials.providerKeys?.[provider]?.trim() || undefined;
}

export function validateCredentialsForProvider(
  credentials: AiProviderCredentials
): { ok: true; apiKey: string } | { ok: false; code: AiConnectionErrorCode; message: string } {
  const apiKey = resolveActiveApiKey(credentials);

  if (!apiKey) {
    return {
      ok: false,
      code: "missing_key",
      message:
        credentials.preferredProvider === "composer-2.5"
          ? "Cursor API Key is required for Composer diagnosis."
          : `API key is required for provider ${credentials.preferredProvider}.`
    };
  }

  if (apiKey.length < 8 && !isMockApiKey(apiKey)) {
    return {
      ok: false,
      code: "invalid_key",
      message: "API key format looks invalid."
    };
  }

  if (credentials.preferredProvider === "custom") {
    return {
      ok: false,
      code: "unsupported_provider",
      message: "Custom provider adapter is not wired yet."
    };
  }

  return { ok: true, apiKey };
}

export function resolveCursorModelId(modelName: string): string {
  const normalized = modelName.trim().toLowerCase();

  if (!normalized || normalized === "composer-2.5") {
    return "composer-2.5";
  }

  if (normalized.startsWith("composer")) {
    return normalized;
  }

  return "composer-2.5";
}

export function providerUsesCursorSdk(provider: AiProviderId): boolean {
  return provider === "composer-2.5";
}
