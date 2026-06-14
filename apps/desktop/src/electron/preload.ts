import { contextBridge, ipcRenderer } from "electron";
import type {
  DesktopLibraryState,
  GitHubApiError,
  GitHubRouteInput,
  GitHubRoutePayload,
  AiDiagnosisRunRequest,
  AiDiagnosisRunResult,
  AiProviderCredentials,
  AiConnectionTestResult,
  RepoInspection
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
    ipcRenderer.invoke("arkitect:run-ai-diagnosis", request) as Promise<AiDiagnosisRunResult>
});
