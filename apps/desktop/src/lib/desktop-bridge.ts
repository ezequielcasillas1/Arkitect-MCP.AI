import type { GitHubApiError, GitHubRouteInput } from "@arkitect/contracts";
import { fetchGitHubRoutePayload, githubRouteToRepoInspection } from "@arkitect/github";

export type DesktopRuntime = "electron" | "browser" | "electron-bridge-missing";

export interface RuntimeShellInfo {
  shell: string;
  platform: string;
  electron: string;
  chrome: string;
  storagePath: string;
  runtime: DesktopRuntime;
}

interface GitHubConnectSuccess {
  ok: true;
  route: Awaited<ReturnType<typeof fetchGitHubRoutePayload>>;
  inspection: ReturnType<typeof githubRouteToRepoInspection>;
}

interface GitHubConnectFailure {
  ok: false;
  error: GitHubApiError;
}

export type GitHubConnectResponse = GitHubConnectSuccess | GitHubConnectFailure;

const shellInfoTimeoutMs = 3000;
const browserGitHubApiBase = "/github-api";

export function isElectronUserAgent(): boolean {
  return typeof navigator !== "undefined" && /Electron/i.test(navigator.userAgent);
}

export function hasDesktopBridge(): boolean {
  const bridge = window.arkitectDesktop;

  return Boolean(
    bridge &&
      typeof bridge.getShellInfo === "function" &&
      typeof bridge.connectGitHubRoute === "function" &&
      typeof bridge.inspectRepoPath === "function"
  );
}

function getBrowserFallbackShellInfo(): RuntimeShellInfo {
  return {
    shell: "browser preview",
    platform: navigator.platform,
    electron: "n/a",
    chrome: "n/a",
    storagePath: "Browser localStorage",
    runtime: "browser"
  };
}

function getBridgeMissingShellInfo(): RuntimeShellInfo {
  return {
    shell: "electron (bridge unavailable)",
    platform: navigator.platform,
    electron: "unknown",
    chrome: "unknown",
    storagePath: "Unavailable — restart with pnpm dev:desktop",
    runtime: "electron-bridge-missing"
  };
}

function normalizeGitHubError(error: unknown): GitHubApiError {
  if (error && typeof error === "object" && "code" in error && "message" in error) {
    return error as GitHubApiError;
  }

  if (error instanceof Error) {
    return {
      code: "network_error",
      message: error.message || "GitHub network request failed."
    };
  }

  return {
    code: "unknown_error",
    message: "Unexpected GitHub API error."
  };
}

export function getGitHubConnectBlockedError(runtime: DesktopRuntime): GitHubConnectFailure {
  if (runtime === "browser") {
    return {
      ok: false,
      error: {
        code: "network_error",
        message:
          "GitHub API connect runs in the Electron desktop window. Close this browser tab and use the window opened by pnpm dev:desktop."
      }
    };
  }

  return {
    ok: false,
    error: {
      code: "network_error",
      message:
        "Desktop bridge is unavailable. Stop the app, run pnpm dev:desktop from the repo root, and use the Electron window (not the Vite browser tab)."
    }
  };
}

export function getGitHubConnectBlockedCode(runtime: DesktopRuntime): string {
  return runtime === "browser" ? "browser_preview_unsupported" : "desktop_bridge_unavailable";
}

async function connectGitHubViaBrowserProxy(input: GitHubRouteInput): Promise<GitHubConnectResponse> {
  try {
    const route = await fetchGitHubRoutePayload(input, { apiBase: browserGitHubApiBase });
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

export async function connectGitHubRoute(
  input: GitHubRouteInput,
  runtime: DesktopRuntime
): Promise<GitHubConnectResponse> {
  if (hasDesktopBridge()) {
    try {
      return (await window.arkitectDesktop!.connectGitHubRoute(input)) as GitHubConnectResponse;
    } catch (error) {
      return {
        ok: false,
        error: {
          code: "network_error",
          message: error instanceof Error ? error.message : "Failed to reach desktop GitHub bridge."
        }
      };
    }
  }

  if (runtime === "browser" || (runtime === "electron-bridge-missing" && import.meta.env.DEV)) {
    return connectGitHubViaBrowserProxy(input);
  }

  return getGitHubConnectBlockedError(runtime);
}

export async function resolveRuntimeShellInfo(): Promise<RuntimeShellInfo> {
  if (!hasDesktopBridge()) {
    return isElectronUserAgent() ? getBridgeMissingShellInfo() : getBrowserFallbackShellInfo();
  }

  try {
    const info = await Promise.race([
      window.arkitectDesktop!.getShellInfo(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Shell info request timed out.")), shellInfoTimeoutMs);
      })
    ]);

    return {
      ...info,
      runtime: "electron"
    };
  } catch {
    return isElectronUserAgent() ? getBridgeMissingShellInfo() : getBrowserFallbackShellInfo();
  }
}

export function formatShellLabel(shellInfo: RuntimeShellInfo | null): string {
  if (!shellInfo) {
    return "Detecting runtime...";
  }

  if (shellInfo.runtime === "browser") {
    return "Browser preview (use Electron window for full desktop features)";
  }

  if (shellInfo.runtime === "electron-bridge-missing") {
    return "Electron detected — desktop bridge unavailable";
  }

  return `${shellInfo.shell} on ${shellInfo.platform}`;
}
