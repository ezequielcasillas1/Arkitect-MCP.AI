import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
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

contextBridge.exposeInMainWorld("arkitectDesktop", {
  getShellInfo: () => ipcRenderer.invoke("arkitect:get-shell-info") as Promise<{
    shell: string;
    platform: string;
    electron: string;
    chrome: string;
    storagePath: string;
  }>,
  selectRepoFolder: () => ipcRenderer.invoke("arkitect:select-repo-folder") as Promise<RepoInspection | null>,
  inspectRepoPath: (repoPath: string) => ipcRenderer.invoke("arkitect:inspect-repo-path", repoPath) as Promise<RepoInspection>,
  connectGitHubRoute: (input: GitHubRouteInput) =>
    ipcRenderer.invoke("arkitect:connect-github-route", input) as Promise<GitHubConnectResponse>,
  loadLibrary: () => ipcRenderer.invoke("arkitect:load-library") as Promise<DesktopLibraryState>,
  saveLibrary: (state: DesktopLibraryState) =>
    ipcRenderer.invoke("arkitect:save-library", state) as Promise<DesktopLibraryState>,
  testAiConnection: (credentials: AiProviderCredentials) =>
    ipcRenderer.invoke("arkitect:test-ai-connection", credentials) as Promise<AiConnectionTestResult>,
  runAiDiagnosis: (request: AiDiagnosisRunRequest) =>
    ipcRenderer.invoke("arkitect:run-ai-diagnosis", request) as Promise<AiDiagnosisRunResult>,
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
  onMcpConnectionStateChange: (handler: (state: McpConnectionState) => void) => {
    const listener = (_event: IpcRendererEvent, state: McpConnectionState) => handler(state);
    ipcRenderer.on("arkitect:mcp-state-changed", listener);
    return () => {
      ipcRenderer.removeListener("arkitect:mcp-state-changed", listener);
    };
  }
});
