import type { DiagnosisRouteSource } from "./taxonomy.js";

export type GitHubAuthMode = "personal-access-token";

export interface GitHubRepositoryOption {
  id: number;
  fullName: string;
  owner: string;
  repo: string;
  private: boolean;
  defaultBranch: string;
  updatedAt: string;
}

export interface GitHubRepoTarget {
  owner: string;
  repo: string;
  fullName: string;
  branch: string;
  defaultBranch: string;
  private: boolean;
  visibility: string;
  htmlUrl: string;
  description?: string;
  primaryLanguage?: string;
  pushedAt?: string;
}

export interface GitHubRouteSignals {
  topLevelDirectories: string[];
  topLevelFiles: string[];
  manifestFiles: string[];
  samplePaths: string[];
  frameworkHints: string[];
  detectedMarkers: string[];
  summary: string;
}

export interface GitHubRoutePayload {
  source: Extract<DiagnosisRouteSource, "github-api">;
  authMode: GitHubAuthMode;
  target: GitHubRepoTarget;
  signals: GitHubRouteSignals;
}

export interface GitHubRouteInput {
  token: string;
  owner: string;
  repo: string;
  branch?: string;
}

export interface GitHubTokenValidation {
  valid: boolean;
  normalizedToken: string;
  reason?: string;
}

export type GitHubApiErrorCode =
  | "invalid_token_format"
  | "unauthorized"
  | "forbidden"
  | "rate_limited"
  | "repo_not_found"
  | "branch_not_found"
  | "network_error"
  | "unknown_error";

export interface GitHubApiError {
  code: GitHubApiErrorCode;
  message: string;
  status?: number;
  retryAfterSeconds?: number;
  documentationUrl?: string;
}
