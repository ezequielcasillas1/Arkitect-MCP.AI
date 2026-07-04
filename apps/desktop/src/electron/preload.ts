import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import type {
  DesktopLibraryState,
  GitHubApiError,
  GitHubBranchOption,
  GitHubOAuthFlowState,
  GitHubOAuthRepoInput,
  GitHubOAuthSession,
  GitHubRepositoryOption,
  GitHubRouteInput,
  GitHubRoutePayload,
  AiDiagnosisRunRequest,
  AiDiagnosisRunResult,
  AiProviderCredentials,
  AiConnectionTestResult,
  RepoInspection,
  McpConnectionState,
  McpServerLaunchConfig,
  McpBridgeManifest,
  McpCursorInstallResult,
  CodebaseVerifyResult,
  TestOverrideCatalog,
  TestOverrideKind,
  TestOverrideRunResult
} from "@arkitect/contracts";
import type { AppUpdateCheckResult, AppUpdateOpenResult } from "./app-update-types.js";

interface GitHubConnectSuccess {
  ok: true;
  route: GitHubRoutePayload;
  inspection: RepoInspection;
}

interface GitHubConnectFailure {
  ok: false;
  error: GitHubApiError;
}

type GitHubConnectResponse = GitHubConnectSuccess | GitHubConnectFailure;

contextBridge.exposeInMainWorld("arkitectDesktop", {
  getShellInfo: () => ipcRenderer.invoke("arkitect:get-shell-info") as Promise<{
    shell: string;
    platform: string;
    electron: string;
    chrome: string;
    storagePath: string;
    appVersion: string;
  }>,
  checkForAppUpdate: () => ipcRenderer.invoke("arkitect:check-for-app-update") as Promise<AppUpdateCheckResult>,
  openAppUpdateDownload: (url: string) =>
    ipcRenderer.invoke("arkitect:open-app-update-download", url) as Promise<AppUpdateOpenResult>,
  selectRepoFolder: () => ipcRenderer.invoke("arkitect:select-repo-folder") as Promise<RepoInspection | null>,
  inspectRepoPath: (repoPath: string) => ipcRenderer.invoke("arkitect:inspect-repo-path", repoPath) as Promise<RepoInspection>,
  connectGitHubRoute: (input: GitHubRouteInput) =>
    ipcRenderer.invoke("arkitect:connect-github-route", input) as Promise<GitHubConnectResponse>,
  connectGitHubOAuthRoute: (input: GitHubOAuthRepoInput) =>
    ipcRenderer.invoke("arkitect:connect-github-oauth-route", input) as Promise<GitHubConnectResponse>,
  getGitHubOAuthConfigured: () => ipcRenderer.invoke("arkitect:github-oauth-get-configured") as Promise<boolean>,
  getGitHubOAuthSession: () => ipcRenderer.invoke("arkitect:github-oauth-get-session") as Promise<GitHubOAuthSession>,
  getGitHubOAuthFlowState: () => ipcRenderer.invoke("arkitect:github-oauth-get-flow-state") as Promise<GitHubOAuthFlowState>,
  startGitHubOAuth: () => ipcRenderer.invoke("arkitect:github-oauth-start") as Promise<GitHubOAuthFlowState>,
  cancelGitHubOAuth: () => ipcRenderer.invoke("arkitect:github-oauth-cancel") as Promise<void>,
  disconnectGitHubOAuth: () => ipcRenderer.invoke("arkitect:github-oauth-disconnect") as Promise<void>,
  listGitHubOAuthRepos: () =>
    ipcRenderer.invoke("arkitect:github-oauth-list-repos") as Promise<
      { ok: true; repos: GitHubRepositoryOption[] } | { ok: false; error: GitHubApiError }
    >,
  listGitHubOAuthBranches: (input: { owner: string; repo: string }) =>
    ipcRenderer.invoke("arkitect:github-oauth-list-branches", input) as Promise<
      { ok: true; branches: GitHubBranchOption[] } | { ok: false; error: GitHubApiError }
    >,
  loadLibrary: () => ipcRenderer.invoke("arkitect:load-library") as Promise<DesktopLibraryState>,
  saveLibrary: (state: DesktopLibraryState) =>
    ipcRenderer.invoke("arkitect:save-library", state) as Promise<DesktopLibraryState>,
  testAiConnection: (credentials: AiProviderCredentials) =>
    ipcRenderer.invoke("arkitect:test-ai-connection", credentials) as Promise<AiConnectionTestResult>,
  runAiDiagnosis: (request: AiDiagnosisRunRequest) =>
    ipcRenderer.invoke("arkitect:run-ai-diagnosis", request) as Promise<AiDiagnosisRunResult>,
  runCodebaseVerify: (input: { repoPath: string }) =>
    ipcRenderer.invoke("arkitect:run-codebase-verify", input) as Promise<CodebaseVerifyResult>,
  getTestOverrideCatalog: (input: { repoPath: string }) =>
    ipcRenderer.invoke("arkitect:get-test-override-catalog", input) as Promise<TestOverrideCatalog>,
  runTestOverride: (input: { repoPath: string; kind: TestOverrideKind }) =>
    ipcRenderer.invoke("arkitect:run-test-override", input) as Promise<TestOverrideRunResult>,
  getMcpConnectionState: () => ipcRenderer.invoke("arkitect:get-mcp-connection-state") as Promise<McpConnectionState>,
  getMcpLaunchConfig: () => ipcRenderer.invoke("arkitect:get-mcp-launch-config") as Promise<McpServerLaunchConfig>,
  saveMcpLaunchConfig: (config: McpServerLaunchConfig) =>
    ipcRenderer.invoke("arkitect:save-mcp-launch-config", config) as Promise<McpServerLaunchConfig>,
  connectMcpManual: (config: McpServerLaunchConfig) =>
    ipcRenderer.invoke("arkitect:connect-mcp-manual", config) as Promise<McpConnectionState>,
  disconnectMcp: () => ipcRenderer.invoke("arkitect:disconnect-mcp") as Promise<McpConnectionState>,
  switchMcpToManualMode: () =>
    ipcRenderer.invoke("arkitect:switch-mcp-manual-mode") as Promise<McpConnectionState>,
  pingMcpConnection: () => ipcRenderer.invoke("arkitect:ping-mcp-connection") as Promise<McpConnectionState>,
  setMcpDefaultRepoPath: (repoPath?: string) =>
    ipcRenderer.invoke("arkitect:set-mcp-default-repo", repoPath) as Promise<McpConnectionState>,
  getMcpBridgeManifest: () => ipcRenderer.invoke("arkitect:get-mcp-bridge-manifest") as Promise<McpBridgeManifest>,
  installMcpInCursor: (input: { repoPath?: string; env?: Record<string, string> }) =>
    ipcRenderer.invoke("arkitect:install-mcp-in-cursor", input) as Promise<McpCursorInstallResult>,
  onMcpConnectionStateChange: (handler: (state: McpConnectionState) => void) => {
    const listener = (_event: IpcRendererEvent, state: McpConnectionState) => handler(state);
    ipcRenderer.on("arkitect:mcp-state-changed", listener);
    return () => {
      ipcRenderer.removeListener("arkitect:mcp-state-changed", listener);
    };
  },
  onGitHubOAuthStateChange: (handler: (state: GitHubOAuthFlowState) => void) => {
    const listener = (_event: IpcRendererEvent, state: GitHubOAuthFlowState) => handler(state);
    ipcRenderer.on("arkitect:github-oauth-state-changed", listener);
    return () => {
      ipcRenderer.removeListener("arkitect:github-oauth-state-changed", listener);
    };
  }
});
