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
  RepoInspection,
  TestOverrideKind
} from "@arkitect/contracts";
import { runCodebaseVerification } from "@arkitect/core";
import { fetchGitHubRoutePayload, githubRouteToRepoInspection } from "@arkitect/github";
import { getDesktopLibraryPath, loadDesktopLibrary, saveDesktopLibrary } from "./library-store.js";
import { inspectRepoPath } from "./repo-inspector.js";
import { runAiDiagnosis, testAiConnection } from "./ai-service.js";
import { getTestOverrideCatalog, runTestOverrideCommand } from "./test-override-service.js";
import { getMcpConnectionService } from "./mcp-connection-service.js";
import { installMcpInCursor } from "./mcp-cursor-install.js";
import { installElectronNetFetch } from "./electron-fetch.js";
import { getGitHubOAuthService } from "./github-oauth-service.js";
import { getGitHubOAuthConfigured } from "./github-oauth-config.js";
import { applyDevToolsGuard } from "./protection/devtools-guard.js";
import { enforceProtectionOnStartup, getProtectionConfig } from "./protection/protection-guard.js";
import { checkForAppUpdate, getCurrentAppVersion, openAppUpdateDownload } from "./app-update-service.js";

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

  applyDevToolsGuard(window, getProtectionConfig());

  getMcpConnectionService().attachWindow(window);

  const githubOAuthService = getGitHubOAuthService();
  githubOAuthService.subscribe((state) => {
    if (!window.isDestroyed()) {
      window.webContents.send("arkitect:github-oauth-state-changed", state);
    }
  });

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
  installElectronNetFetch();

  const protection = await enforceProtectionOnStartup();
  if (!protection.ok) {
    return;
  }

  const mcpService = getMcpConnectionService();

  try {
    await mcpService.start();
  } catch (error) {
    console.error("[arkitect-desktop] MCP bridge failed to start:", error);
  }

  ipcMain.handle("arkitect:get-shell-info", () => ({
    shell: "electron",
    platform: process.platform,
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    storagePath: getDesktopLibraryPath(),
    appVersion: getCurrentAppVersion()
  }));
  ipcMain.handle("arkitect:check-for-app-update", () => checkForAppUpdate());
  ipcMain.handle("arkitect:open-app-update-download", async (_event, url: string) => openAppUpdateDownload(url));
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
  ipcMain.handle("arkitect:connect-github-oauth-route", async (_event, input: { owner: string; repo: string; branch?: string }) => {
    try {
      const token = await getGitHubOAuthService().getAccessToken();

      if (!token) {
        return {
          ok: false,
          error: {
            code: "unauthorized",
            message: "Connect GitHub before selecting a repository."
          } satisfies GitHubApiError
        };
      }

      const route = await fetchGitHubRoutePayload({
        token,
        owner: input.owner,
        repo: input.repo,
        branch: input.branch,
        authMode: "oauth"
      });

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
  });
  ipcMain.handle("arkitect:github-oauth-get-configured", () => getGitHubOAuthConfigured());
  ipcMain.handle("arkitect:github-oauth-get-session", () => getGitHubOAuthService().getSession());
  ipcMain.handle("arkitect:github-oauth-get-flow-state", () => getGitHubOAuthService().getFlowState());
  ipcMain.handle("arkitect:github-oauth-start", () => getGitHubOAuthService().startDeviceFlow());
  ipcMain.handle("arkitect:github-oauth-cancel", () => {
    getGitHubOAuthService().cancelDeviceFlow();
  });
  ipcMain.handle("arkitect:github-oauth-disconnect", async () => {
    await getGitHubOAuthService().disconnect();
  });
  ipcMain.handle("arkitect:github-oauth-list-repos", async () => {
    try {
      return {
        ok: true as const,
        repos: await getGitHubOAuthService().listRepositories()
      };
    } catch (error) {
      return {
        ok: false as const,
        error: normalizeGitHubError(error)
      };
    }
  });
  ipcMain.handle("arkitect:github-oauth-list-branches", async (_event, input: { owner: string; repo: string }) => {
    try {
      return {
        ok: true as const,
        branches: await getGitHubOAuthService().listBranches(input.owner, input.repo)
      };
    } catch (error) {
      return {
        ok: false as const,
        error: normalizeGitHubError(error)
      };
    }
  });
  ipcMain.handle("arkitect:load-library", async () => loadDesktopLibrary());
  ipcMain.handle("arkitect:save-library", async (_event, state: DesktopLibraryState) => saveDesktopLibrary(state));
  ipcMain.handle("arkitect:test-ai-connection", async (_event, credentials) => testAiConnection(credentials));
  ipcMain.handle("arkitect:run-ai-diagnosis", async (_event, request) =>
    runAiDiagnosis(request.facts, request.credentials, request.repoPath)
  );
  ipcMain.handle("arkitect:run-codebase-verify", async (_event, input: { repoPath: string }) =>
    runCodebaseVerification(input)
  );
  ipcMain.handle("arkitect:get-test-override-catalog", async (_event, input: { repoPath: string }) =>
    getTestOverrideCatalog(input)
  );
  ipcMain.handle(
    "arkitect:run-test-override",
    async (_event, input: { repoPath: string; kind: TestOverrideKind }) => runTestOverrideCommand(input)
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
  ipcMain.handle("arkitect:get-pending-workbench-intake", () => mcpService.getPendingWorkbenchIntake());
  ipcMain.handle("arkitect:clear-pending-workbench-intake", () => {
    mcpService.clearPendingWorkbenchIntake();
    return { ok: true };
  });
  ipcMain.handle(
    "arkitect:install-mcp-in-cursor",
    async (_event, input: { repoPath?: string; env?: Record<string, string> }) => installMcpInCursor(input)
  );

  await getGitHubOAuthService().hydrateFromStore();

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
