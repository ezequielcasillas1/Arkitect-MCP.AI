import type { AiProviderId } from "./ai.js";
import type { ArchitectureCatalogId, ComplexityProfile, RemixProfileId } from "./catalog.js";
import type { RepoInspection } from "./diagnosis.js";
import type { DiagnosisRouteSource, ExecutionPermission, UserSignalInputs } from "./taxonomy.js";
import type { GitHubRoutePayload } from "./github.js";

export type ProfileNameSuggestionSource = "repo-inspection" | "route-context" | "stack-hint";

export interface ProfileNameSuggestion {
  name: string;
  reason: string;
  confidence: number;
  source: ProfileNameSuggestionSource;
}

export interface ProfileNameSuggestionInput {
  repoName: string;
  repoPath: string;
  routeSource: DiagnosisRouteSource;
  githubRoute?: GitHubRoutePayload;
  pendingGitHub?: {
    fullName: string;
    branch: string;
  };
  repoInspection?: RepoInspection;
  existingProfileNames: string[];
}

export interface SavedProjectProfile {
  id: string;
  name: string;
  routeSource: DiagnosisRouteSource;
  repoPath: string;
  repoName: string;
  githubRoute?: GitHubRoutePayload;
  repoSummary: string;
  requestedOutcome: string;
  selectedRemixId?: RemixProfileId;
  complexityProfile: ComplexityProfile;
  executionPermission: ExecutionPermission;
  requirementTags: string[];
  userInput: UserSignalInputs;
  createdAt: string;
  updatedAt: string;
}

export interface SavedArchitectureProfile {
  id: string;
  name: string;
  preferredArchitectureId?: ArchitectureCatalogId;
  selectedRemixId?: RemixProfileId;
  complexityProfile: ComplexityProfile;
  requirementTags: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedProviderPreset {
  id: string;
  name: string;
  preferredProvider: AiProviderId;
  modelName: string;
  allowUserSuppliedKeys: boolean;
  fallbackProviders: AiProviderId[];
  createdAt: string;
  updatedAt: string;
}

export interface DesktopLibraryState {
  version: number;
  projectProfiles: SavedProjectProfile[];
  architectureProfiles: SavedArchitectureProfile[];
  providerPresets: SavedProviderPreset[];
  lastOpenedRepoPath?: string;
}
