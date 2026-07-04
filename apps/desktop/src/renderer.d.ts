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
  PendingWorkbenchIntakeState,
  WorkbenchIntakeApplyRequest,
  CodebaseVerifyResult,
  TestOverrideCatalog,
  TestOverrideKind,
  TestOverrideRunResult
} from "@arkitect/contracts";
import type { AppUpdateCheckResult, AppUpdateOpenResult } from "./lib/app-update-types";

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

declare global {
  interface Window {
    arkitectDesktop?: {
      getShellInfo: () => Promise<{
        shell: string;
        platform: string;
        electron: string;
        chrome: string;
        storagePath: string;
        appVersion: string;
      }>;
      checkForAppUpdate: () => Promise<AppUpdateCheckResult>;
      openAppUpdateDownload: (url: string) => Promise<AppUpdateOpenResult>;
      selectRepoFolder: () => Promise<RepoInspection | null>;
      inspectRepoPath: (repoPath: string) => Promise<RepoInspection>;
      connectGitHubRoute: (input: GitHubRouteInput) => Promise<GitHubConnectResponse>;
      connectGitHubOAuthRoute: (input: GitHubOAuthRepoInput) => Promise<GitHubConnectResponse>;
      getGitHubOAuthConfigured: () => Promise<boolean>;
      getGitHubOAuthSession: () => Promise<GitHubOAuthSession>;
      getGitHubOAuthFlowState: () => Promise<GitHubOAuthFlowState>;
      startGitHubOAuth: () => Promise<GitHubOAuthFlowState>;
      cancelGitHubOAuth: () => Promise<void>;
      disconnectGitHubOAuth: () => Promise<void>;
      listGitHubOAuthRepos: () => Promise<
        { ok: true; repos: GitHubRepositoryOption[] } | { ok: false; error: GitHubApiError }
      >;
      listGitHubOAuthBranches: (input: { owner: string; repo: string }) => Promise<
        { ok: true; branches: GitHubBranchOption[] } | { ok: false; error: GitHubApiError }
      >;
      loadLibrary: () => Promise<DesktopLibraryState>;
      saveLibrary: (state: DesktopLibraryState) => Promise<DesktopLibraryState>;
      testAiConnection: (credentials: AiProviderCredentials) => Promise<AiConnectionTestResult>;
      runAiDiagnosis: (request: AiDiagnosisRunRequest) => Promise<AiDiagnosisRunResult>;
      runCodebaseVerify: (input: { repoPath: string }) => Promise<CodebaseVerifyResult>;
      getTestOverrideCatalog: (input: { repoPath: string }) => Promise<TestOverrideCatalog>;
      runTestOverride: (input: { repoPath: string; kind: TestOverrideKind }) => Promise<TestOverrideRunResult>;
      getMcpConnectionState: () => Promise<McpConnectionState>;
      getMcpLaunchConfig: () => Promise<McpServerLaunchConfig>;
      saveMcpLaunchConfig: (config: McpServerLaunchConfig) => Promise<McpServerLaunchConfig>;
      connectMcpManual: (config: McpServerLaunchConfig) => Promise<McpConnectionState>;
      disconnectMcp: () => Promise<McpConnectionState>;
      switchMcpToManualMode: () => Promise<McpConnectionState>;
      pingMcpConnection: () => Promise<McpConnectionState>;
      setMcpDefaultRepoPath: (repoPath?: string) => Promise<McpConnectionState>;
      getMcpBridgeManifest: () => Promise<McpBridgeManifest>;
      getPendingWorkbenchIntake: () => Promise<PendingWorkbenchIntakeState>;
      clearPendingWorkbenchIntake: () => Promise<{ ok: boolean }>;
      installMcpInCursor: (input: { repoPath?: string; env?: Record<string, string> }) => Promise<McpCursorInstallResult>;
      onMcpConnectionStateChange: (handler: (state: McpConnectionState) => void) => () => void;
      onWorkbenchIntakeReceived: (handler: (payload: WorkbenchIntakeApplyRequest) => void) => () => void;
      onGitHubOAuthStateChange: (handler: (state: GitHubOAuthFlowState) => void) => () => void;
    };
  }
}

export {};
