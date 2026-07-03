import { shell } from "electron";
import type {
  GitHubApiError,
  GitHubBranchOption,
  GitHubOAuthFlowState,
  GitHubOAuthSession,
  GitHubRepositoryOption
} from "@arkitect/contracts";
import {
  fetchGitHubBranchOptions,
  fetchGitHubOAuthSession,
  fetchGitHubRepositoryOptions,
  pollGitHubDeviceToken,
  requestGitHubDeviceCode
} from "@arkitect/github";
import { getGitHubOAuthClientId } from "./github-oauth-config.js";
import {
  clearStoredGitHubOAuth,
  getStoredGitHubOAuthSession,
  loadStoredGitHubOAuth,
  saveStoredGitHubOAuth
} from "./github-oauth-store.js";

type FlowListener = (state: GitHubOAuthFlowState) => void;

class GitHubOAuthService {
  private flowState: GitHubOAuthFlowState = { status: "idle" };
  private pollTimer: NodeJS.Timeout | null = null;
  private pollClientId: string | null = null;
  private pollDeviceCode: string | null = null;
  private pollIntervalMs = 5000;
  private listeners = new Set<FlowListener>();

  subscribe(listener: FlowListener) {
    this.listeners.add(listener);
    listener(this.flowState);

    return () => {
      this.listeners.delete(listener);
    };
  }

  getFlowState() {
    return this.flowState;
  }

  async getSession(): Promise<GitHubOAuthSession> {
    return getStoredGitHubOAuthSession();
  }

  async hydrateFromStore() {
    const session = await getStoredGitHubOAuthSession();

    if (session.connected) {
      this.emit({
        status: "connected",
        session
      });
    }
  }

  private emit(state: GitHubOAuthFlowState) {
    this.flowState = state;
    this.listeners.forEach((listener) => listener(state));
  }

  private clearPollTimer() {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }

    this.pollClientId = null;
    this.pollDeviceCode = null;
  }

  private createConfigError(): GitHubApiError {
    return {
      code: "oauth_not_configured",
      message:
        "GitHub OAuth client ID is missing. Set GITHUB_OAUTH_CLIENT_ID or create apps/desktop/github-oauth.config.json."
    };
  }

  async startDeviceFlow(): Promise<GitHubOAuthFlowState> {
    this.clearPollTimer();

    const clientId = getGitHubOAuthClientId();

    if (!clientId) {
      const state: GitHubOAuthFlowState = {
        status: "error",
        message: this.createConfigError().message
      };
      this.emit(state);
      return state;
    }

    try {
      const device = await requestGitHubDeviceCode(clientId);
      await shell.openExternal(device.verificationUri);

      const state: GitHubOAuthFlowState = {
        status: "awaiting_user",
        device
      };
      this.emit(state);

      this.pollClientId = clientId;
      this.pollDeviceCode = device.deviceCode;
      this.pollIntervalMs = Math.max(device.interval, 5) * 1000;
      this.schedulePoll();

      return state;
    } catch (error) {
      const state: GitHubOAuthFlowState = {
        status: "error",
        message: this.normalizeError(error).message
      };
      this.emit(state);
      return state;
    }
  }

  cancelDeviceFlow() {
    this.clearPollTimer();
    this.emit({ status: "idle" });
  }

  async disconnect() {
    this.clearPollTimer();
    await clearStoredGitHubOAuth();
    this.emit({ status: "idle" });
  }

  private schedulePoll() {
    this.pollTimer = setTimeout(() => {
      void this.pollOnce();
    }, this.pollIntervalMs);
  }

  private async pollOnce() {
    if (!this.pollClientId || !this.pollDeviceCode) {
      return;
    }

    const result = await pollGitHubDeviceToken(this.pollClientId, this.pollDeviceCode);

    if (result.status === "pending") {
      this.schedulePoll();
      return;
    }

    this.clearPollTimer();

    if (result.status === "error") {
      this.emit({
        status: "error",
        message: result.error.message
      });
      return;
    }

    try {
      const session = await fetchGitHubOAuthSession(result.accessToken);
      await saveStoredGitHubOAuth(session, result.accessToken);
      this.emit({
        status: "connected",
        session
      });
    } catch (error) {
      this.emit({
        status: "error",
        message: this.normalizeError(error).message
      });
    }
  }

  private async requireToken(): Promise<string> {
    const stored = await loadStoredGitHubOAuth();

    if (!stored?.token) {
      throw {
        code: "unauthorized",
        message: "Connect GitHub before selecting a repository."
      } satisfies GitHubApiError;
    }

    return stored.token;
  }

  async listRepositories(): Promise<GitHubRepositoryOption[]> {
    const token = await this.requireToken();
    return fetchGitHubRepositoryOptions(token);
  }

  async listBranches(owner: string, repo: string): Promise<GitHubBranchOption[]> {
    const token = await this.requireToken();
    return fetchGitHubBranchOptions(token, owner, repo);
  }

  async getAccessToken(): Promise<string | null> {
    const stored = await loadStoredGitHubOAuth();
    return stored?.token ?? null;
  }

  private normalizeError(error: unknown): GitHubApiError {
    if (error && typeof error === "object" && "code" in error && "message" in error) {
      return error as GitHubApiError;
    }

    if (error instanceof Error) {
      return {
        code: "unknown_error",
        message: error.message
      };
    }

    return {
      code: "unknown_error",
      message: "Unexpected GitHub OAuth error."
    };
  }
}

let service: GitHubOAuthService | null = null;

export function getGitHubOAuthService() {
  if (!service) {
    service = new GitHubOAuthService();
  }

  return service;
}
