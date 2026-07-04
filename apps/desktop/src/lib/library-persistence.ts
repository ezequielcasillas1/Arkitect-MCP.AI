import type { AiProviderCredentials, AiProviderId, DesktopLibraryState, DiagnosisIntake } from "@arkitect/contracts";
import { createDefaultDesktopLibrary } from "@arkitect/core";

const browserLibraryKey = "arkitect.desktop.library.v1";
const aiSessionKey = "arkitect.desktop.ai-session.v1";

export interface AiSessionCredentials {
  cursorApiKey?: string;
  providerKeys?: Partial<Record<AiProviderId, string>>;
}

function ensureLibraryShape(value: unknown): DesktopLibraryState {
  const fallback = createDefaultDesktopLibrary();

  if (!value || typeof value !== "object") {
    return fallback;
  }

  const parsed = value as Partial<DesktopLibraryState>;

  return {
    version: typeof parsed.version === "number" ? parsed.version : fallback.version,
    projectProfiles: Array.isArray(parsed.projectProfiles) ? parsed.projectProfiles : fallback.projectProfiles,
    architectureProfiles: Array.isArray(parsed.architectureProfiles)
      ? parsed.architectureProfiles
      : fallback.architectureProfiles,
    providerPresets: Array.isArray(parsed.providerPresets) ? parsed.providerPresets : fallback.providerPresets,
    workbenchPresets: Array.isArray(parsed.workbenchPresets) ? parsed.workbenchPresets : fallback.workbenchPresets,
    lastOpenedRepoPath: parsed.lastOpenedRepoPath
  };
}

export function createLocalId(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36)}`;
}

export function loadBrowserLibrary() {
  if (typeof window === "undefined") {
    return createDefaultDesktopLibrary();
  }

  try {
    const raw = window.localStorage.getItem(browserLibraryKey);
    return raw ? ensureLibraryShape(JSON.parse(raw)) : createDefaultDesktopLibrary();
  } catch {
    return createDefaultDesktopLibrary();
  }
}

export function saveBrowserLibrary(state: DesktopLibraryState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(browserLibraryKey, JSON.stringify(state));
}

export function loadAiSessionCredentials(): AiSessionCredentials {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.sessionStorage.getItem(aiSessionKey);

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as AiSessionCredentials;

    return {
      cursorApiKey: typeof parsed.cursorApiKey === "string" ? parsed.cursorApiKey : undefined,
      providerKeys:
        parsed.providerKeys && typeof parsed.providerKeys === "object"
          ? (parsed.providerKeys as Partial<Record<AiProviderId, string>>)
          : undefined
    };
  } catch {
    return {};
  }
}

export function resolveAiCredentials(input: {
  intake: DiagnosisIntake;
  cursorApiKey?: string;
  providerKeys?: Partial<Record<AiProviderId, string>>;
}): AiProviderCredentials {
  const session = loadAiSessionCredentials();
  const mergedProviderKeys = {
    ...(session.providerKeys ?? {}),
    ...Object.fromEntries(
      Object.entries(input.providerKeys ?? {}).filter(([, value]) => Boolean(value?.trim()))
    )
  } as Partial<Record<AiProviderId, string>>;

  return {
    preferredProvider: input.intake.ai.preferredProvider,
    modelName: input.intake.ai.modelName,
    cursorApiKey: input.cursorApiKey?.trim() || session.cursorApiKey?.trim() || undefined,
    providerKeys: mergedProviderKeys
  };
}

export function saveAiSessionCredentials(credentials: AiSessionCredentials) {
  if (typeof window === "undefined") {
    return;
  }

  const hasCursorKey = Boolean(credentials.cursorApiKey?.trim());
  const hasProviderKeys = Boolean(
    credentials.providerKeys &&
      Object.values(credentials.providerKeys).some((value) => Boolean(value?.trim()))
  );

  if (!hasCursorKey && !hasProviderKeys) {
    window.sessionStorage.removeItem(aiSessionKey);
    return;
  }

  window.sessionStorage.setItem(aiSessionKey, JSON.stringify(credentials));
}
