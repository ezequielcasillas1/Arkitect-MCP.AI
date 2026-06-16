import { existsSync } from "node:fs";
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import type { OpenDialogOptions } from "electron";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  DesktopLibraryState,
  GitHubApiError,
  GitHubRouteInput,
  GitHubRoutePayload,
  RepoInspection
} from "@arkitect/contracts";
import { fetchGitHubRoutePayload, githubRouteToRepoInspection } from "@arkitect/github";
import { getDesktopLibraryPath, loadDesktopLibrary, saveDesktopLibrary } from "./library-store.js";
import { inspectRepoPath } from "./repo-inspector.js";
import { runAiDiagnosis, testAiConnection } from "./ai-service.js";
import { getMcpConnectionService } from "./mcp-connection-service.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
let mainWindow: BrowserWindow | null = null;

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

function normalizeGitHubError(error: unknown): GitHubApiError {
  if (error && typeof error === "object" && "code" in error && "message" in error) {
    return error as GitHubApiError;
  }

  if (error instanceof Error) {
    return {
      code: "network_error",
      message: error.message || "GitHub network request failed.",
      status: undefined
    };
  }

  return {
    code: "unknown_error",
    message: "Unexpected GitHub API error.",
    status: undefined
  };
}

function createWindow() {
  const preloadPath = join(__dirname, "preload.js");

  if (!existsSync(preloadPath)) {
    console.error(`[arkitect-desktop] Preload script missing at ${preloadPath}. Run the desktop build/watch step first.`);
  }

  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1180,
    minHeight: 780,
    backgroundColor: "#090b10",
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  mainWindow = window;

  getMcpConnectionService().attachWindow(window);

  window.webContents.on("preload-error", (_event, preloadFile, error) => {
    console.error(`[arkitect-desktop] Preload failed for ${preloadFile}:`, error);
  });

  const rendererUrl = process.env.ARKITECT_RENDERER_URL;

  if (rendererUrl) {
    void window.loadURL(rendererUrl);
  } else {
    void window.loadFile(join(__dirname, "../dist/index.html"));
  }

  window.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  const mcpService = getMcpConnectionService();
  await mcpService.start();

  ipcMain.handle("arkitect:get-shell-info", () => ({
    shell: "electron",
    platform: process.platform,
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    storagePath: getDesktopLibraryPath()
  }));
  ipcMain.handle("arkitect:select-repo-folder", async () => {
    const properties: OpenDialogOptions["properties"] = ["openDirectory"];
    const options: OpenDialogOptions = {
      title: "Select a local repository or project folder",
      properties
    };
    const result = mainWindow
      ? await dialog.showOpenDialog(mainWindow, options)
      : await dialog.showOpenDialog(options);

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return inspectRepoPath(result.filePaths[0]);
  });
  ipcMain.handle("arkitect:inspect-repo-path", async (_event, repoPath: string) => inspectRepoPath(repoPath));
  ipcMain.handle(
    "arkitect:connect-github-route",
    async (_event, input: GitHubRouteInput): Promise<GitHubConnectResponse> => {
      try {
        const route = await fetchGitHubRoutePayload(input);
        return {
          ok: true,
          route,
          inspection: githubRouteToRepoInspection(route)
        };
      } catch (error) {
        return {
          ok: false,
          error: normalizeGitHubError(error)
        };
      }
    }
  );
  ipcMain.handle("arkitect:load-library", async () => loadDesktopLibrary());
  ipcMain.handle("arkitect:save-library", async (_event, state: DesktopLibraryState) => saveDesktopLibrary(state));
  ipcMain.handle("arkitect:test-ai-connection", async (_event, credentials) => testAiConnection(credentials));
  ipcMain.handle("arkitect:run-ai-diagnosis", async (_event, request) =>
    runAiDiagnosis(request.facts, request.credentials, request.repoPath)
  );
  ipcMain.handle("arkitect:get-mcp-connection-state", () => mcpService.getState());
  ipcMain.handle("arkitect:get-mcp-launch-config", () => mcpService.getLaunchConfig());
  ipcMain.handle("arkitect:save-mcp-launch-config", async (_event, config) => mcpService.saveLaunchConfig(config));
  ipcMain.handle("arkitect:connect-mcp-manual", async (_event, config) => mcpService.connectManual(config));
  ipcMain.handle("arkitect:disconnect-mcp", async () => mcpService.disconnect());
  ipcMain.handle("arkitect:switch-mcp-manual-mode", async () => mcpService.switchToManualMode());
  ipcMain.handle("arkitect:ping-mcp-connection", async () => mcpService.ping());
  ipcMain.handle("arkitect:set-mcp-default-repo", async (_event, repoPath?: string) => {
    mcpService.setDefaultRepoPath(repoPath);
    return mcpService.getState();
  });
  ipcMain.handle("arkitect:get-mcp-bridge-manifest", () => mcpService.getBridgeManifest());

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  void getMcpConnectionService()
    .stop()
    .finally(() => {
      if (process.platform !== "darwin") {
        app.quit();
      }
    });
});
