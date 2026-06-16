import type {
  DesktopLibraryState,
  GitHubApiError,
  GitHubRouteInput,
  GitHubRoutePayload,
  AiDiagnosisRunRequest,
  AiDiagnosisRunResult,
  AiProviderCredentials,
  AiConnectionTestResult,
  RepoInspection,
  McpConnectionState,
  McpServerLaunchConfig,
  McpBridgeManifest
} from "@arkitect/contracts";

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
      }>;
      selectRepoFolder: () => Promise<RepoInspection | null>;
      inspectRepoPath: (repoPath: string) => Promise<RepoInspection>;
      connectGitHubRoute: (input: GitHubRouteInput) => Promise<GitHubConnectResponse>;
      loadLibrary: () => Promise<DesktopLibraryState>;
      saveLibrary: (state: DesktopLibraryState) => Promise<DesktopLibraryState>;
      testAiConnection: (credentials: AiProviderCredentials) => Promise<AiConnectionTestResult>;
      runAiDiagnosis: (request: AiDiagnosisRunRequest) => Promise<AiDiagnosisRunResult>;
      getMcpConnectionState: () => Promise<McpConnectionState>;
      getMcpLaunchConfig: () => Promise<McpServerLaunchConfig>;
      saveMcpLaunchConfig: (config: McpServerLaunchConfig) => Promise<McpServerLaunchConfig>;
      connectMcpManual: (config: McpServerLaunchConfig) => Promise<McpConnectionState>;
      disconnectMcp: () => Promise<McpConnectionState>;
      switchMcpToManualMode: () => Promise<McpConnectionState>;
      pingMcpConnection: () => Promise<McpConnectionState>;
      setMcpDefaultRepoPath: (repoPath?: string) => Promise<McpConnectionState>;
      getMcpBridgeManifest: () => Promise<McpBridgeManifest>;
      onMcpConnectionStateChange: (handler: (state: McpConnectionState) => void) => () => void;
    };
  }
}

export {};
