import type { DiagnosisRouteSource } from "./taxonomy.js";

export type GitHubAuthMode = "personal-access-token" | "oauth";

export interface GitHubRepositoryOption {
  id: number;
  fullName: string;
  owner: string;
  repo: string;
  private: boolean;
  defaultBranch: string;
  updatedAt: string;
  description?: string;
  htmlUrl?: string;
}

export interface GitHubBranchOption {
  name: string;
  protected: boolean;
}

export interface GitHubOAuthDeviceStart {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresIn: number;
  interval: number;
}

export interface GitHubOAuthSession {
  connected: boolean;
  login?: string;
  name?: string;
  avatarUrl?: string;
}

export type GitHubOAuthFlowStatus = "idle" | "awaiting_user" | "connected" | "error";

export interface GitHubOAuthFlowState {
  status: GitHubOAuthFlowStatus;
  device?: GitHubOAuthDeviceStart;
  session?: GitHubOAuthSession;
  message?: string;
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
  authMode?: GitHubAuthMode;
}

export interface GitHubOAuthRepoInput {
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
  | "oauth_not_configured"
  | "oauth_cancelled"
  | "oauth_expired"
  | "oauth_denied"
  | "oauth_pending"
  | "unknown_error";

export interface GitHubApiError {
  code: GitHubApiErrorCode;
  message: string;
  status?: number;
  retryAfterSeconds?: number;
  documentationUrl?: string;
}
