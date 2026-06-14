import type { DesktopLibraryState, SavedArchitectureProfile, SavedProviderPreset } from "@arkitect/contracts";

export const desktopLibraryVersion = 1;

function timestamp() {
  return new Date().toISOString();
}

function createStarterArchitectureProfiles(now: string): SavedArchitectureProfile[] {
  return [
    {
      id: "starter-ai-native-desktop",
      name: "AI-Native Desktop Review",
      preferredArchitectureId: "vertical-slice",
      selectedRemixId: "ai-native-stack",
      complexityProfile: "balanced",
      requirementTags: ["desktop-shell", "mcp-tool-registry", "provider-switching", "local-repo-first"],
      notes: "Balanced default for Arkitect-style desktop diagnosis work.",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "starter-clean-recovery",
      name: "Clean Slice Recovery",
      preferredArchitectureId: "clean-architecture",
      selectedRemixId: "clean-slice-fusion",
      complexityProfile: "structured",
      requirementTags: ["repo-recovery", "boundary-repair", "domain-first"],
      notes: "Use when drift exists but the team wants slice delivery plus cleaner boundaries.",
      createdAt: now,
      updatedAt: now
    }
  ];
}

function createStarterProviderPresets(now: string): SavedProviderPreset[] {
  return [
    {
      id: "starter-composer-default",
      name: "Composer Default",
      preferredProvider: "composer-2.5",
      modelName: "composer-2.5",
      allowUserSuppliedKeys: true,
      fallbackProviders: ["anthropic", "openai", "gemini"],
      createdAt: now,
      updatedAt: now
    },
    {
      id: "starter-byo-routing",
      name: "BYO Provider Routing",
      preferredProvider: "custom",
      modelName: "user-selected-provider",
      allowUserSuppliedKeys: true,
      fallbackProviders: ["anthropic", "openai", "gemini", "groq"],
      createdAt: now,
      updatedAt: now
    }
  ];
}

export function createDefaultDesktopLibrary(): DesktopLibraryState {
  const now = timestamp();

  return {
    version: desktopLibraryVersion,
    projectProfiles: [],
    architectureProfiles: createStarterArchitectureProfiles(now),
    providerPresets: createStarterProviderPresets(now)
  };
}
