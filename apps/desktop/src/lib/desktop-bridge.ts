import type {
  AiConnectionTestResult,
  AiDiagnosisRunRequest,
  AiDiagnosisRunResult,
  AiProviderCredentials,
  CodebaseVerifyResult,
  GitHubApiError,
  GitHubBranchOption,
  GitHubOAuthFlowState,
  GitHubOAuthRepoInput,
  GitHubOAuthSession,
  GitHubRepositoryOption,
  GitHubRouteInput
} from "@arkitect/contracts";
import {
  createMockConnectionResult,
  createMockDiagnosisEnrichment,
  createProviderAdapter,
  createSkippedEnrichment,
  isMockApiKey,
  validateCredentialsForProvider
} from "@arkitect/ai";
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

export async function connectGitHubOAuthRoute(
  input: GitHubOAuthRepoInput,
  runtime: DesktopRuntime
): Promise<GitHubConnectResponse> {
  if (hasDesktopBridge() && window.arkitectDesktop?.connectGitHubOAuthRoute) {
    try {
      return (await window.arkitectDesktop.connectGitHubOAuthRoute(input)) as GitHubConnectResponse;
    } catch (error) {
      return {
        ok: false,
        error: {
          code: "network_error",
          message: error instanceof Error ? error.message : "Failed to reach desktop GitHub OAuth bridge."
        }
      };
    }
  }

  return getGitHubConnectBlockedError(runtime);
}

export async function getGitHubOAuthConfiguredViaBridge(): Promise<boolean> {
  return (await window.arkitectDesktop?.getGitHubOAuthConfigured?.()) ?? false;
}

export async function getGitHubOAuthSessionViaBridge(): Promise<GitHubOAuthSession> {
  return (await window.arkitectDesktop?.getGitHubOAuthSession?.()) ?? { connected: false };
}

export async function getGitHubOAuthFlowStateViaBridge(): Promise<GitHubOAuthFlowState> {
  return (await window.arkitectDesktop?.getGitHubOAuthFlowState?.()) ?? { status: "idle" };
}

export async function startGitHubOAuthViaBridge(): Promise<GitHubOAuthFlowState> {
  if (!window.arkitectDesktop?.startGitHubOAuth) {
    return {
      status: "error",
      message: "GitHub OAuth requires the Electron desktop app."
    };
  }

  return window.arkitectDesktop.startGitHubOAuth();
}

export async function cancelGitHubOAuthViaBridge(): Promise<void> {
  await window.arkitectDesktop?.cancelGitHubOAuth?.();
}

export async function disconnectGitHubOAuthViaBridge(): Promise<void> {
  await window.arkitectDesktop?.disconnectGitHubOAuth?.();
}

export async function listGitHubOAuthReposViaBridge(): Promise<
  { ok: true; repos: GitHubRepositoryOption[] } | { ok: false; error: GitHubApiError }
> {
  if (!window.arkitectDesktop?.listGitHubOAuthRepos) {
    return {
      ok: false,
      error: {
        code: "network_error",
        message: "GitHub repo list requires the Electron desktop app."
      }
    };
  }

  return window.arkitectDesktop.listGitHubOAuthRepos();
}

export async function listGitHubOAuthBranchesViaBridge(
  owner: string,
  repo: string
): Promise<{ ok: true; branches: GitHubBranchOption[] } | { ok: false; error: GitHubApiError }> {
  if (!window.arkitectDesktop?.listGitHubOAuthBranches) {
    return {
      ok: false,
      error: {
        code: "network_error",
        message: "GitHub branch list requires the Electron desktop app."
      }
    };
  }

  return window.arkitectDesktop.listGitHubOAuthBranches({ owner, repo });
}

export function subscribeGitHubOAuthStateViaBridge(handler: (state: GitHubOAuthFlowState) => void) {
  return window.arkitectDesktop?.onGitHubOAuthStateChange?.(handler) ?? (() => undefined);
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

const browserAiAdapter = createProviderAdapter({
  testCursorConnection: async (credentials) => createMockConnectionResult(credentials),
  runCursorDiagnosis: async (facts, credentials) => createMockDiagnosisEnrichment(facts, credentials)
});

export function getAiConnectBlockedMessage(runtime: DesktopRuntime): string {
  if (runtime === "browser") {
    return "Live Cursor API connection runs in the Electron desktop window. Close this browser tab and use the window opened by pnpm dev:desktop.";
  }

  return "AI connection requires the Electron desktop bridge. Stop the app, run pnpm dev:desktop from the repo root, and use the Electron window (not the Vite browser tab).";
}

function shouldBlockLiveAiInBrowser(credentials: AiProviderCredentials, runtime: DesktopRuntime): boolean {
  if (runtime !== "browser") {
    return false;
  }

  const validation = validateCredentialsForProvider(credentials);

  return validation.ok && !isMockApiKey(validation.apiKey);
}

export async function testAiConnectionViaBridge(
  credentials: AiProviderCredentials,
  runtime: DesktopRuntime
): Promise<AiConnectionTestResult> {
  if (hasDesktopBridge() && window.arkitectDesktop?.testAiConnection) {
    try {
      return await window.arkitectDesktop.testAiConnection(credentials);
    } catch (error) {
      return {
        ok: false,
        connected: false,
        provider: credentials.preferredProvider,
        modelName: credentials.modelName,
        message: error instanceof Error ? error.message : "AI connection test failed.",
        code: "network_error"
      };
    }
  }

  if (runtime === "electron" || runtime === "electron-bridge-missing") {
    return {
      ok: false,
      connected: false,
      provider: credentials.preferredProvider,
      modelName: credentials.modelName,
      message: getAiConnectBlockedMessage(runtime),
      code: "network_error"
    };
  }

  if (shouldBlockLiveAiInBrowser(credentials, runtime)) {
    return {
      ok: false,
      connected: false,
      provider: credentials.preferredProvider,
      modelName: credentials.modelName,
      message: getAiConnectBlockedMessage(runtime),
      code: "network_error"
    };
  }

  return browserAiAdapter.testConnection(credentials);
}

export async function runAiDiagnosisViaBridge(request: AiDiagnosisRunRequest, runtime: DesktopRuntime): Promise<AiDiagnosisRunResult> {
  const validation = validateCredentialsForProvider(request.credentials);

  if (!validation.ok) {
    return {
      ok: true,
      enrichment: {
        status: "skipped",
        provider: request.credentials.preferredProvider,
        modelName: request.credentials.modelName,
        summary: validation.message,
        reasoning: ["Rule-based diagnosis remains the baseline."],
        nextActions: [],
        generatedAt: new Date().toISOString()
      }
    };
  }

  if (hasDesktopBridge() && window.arkitectDesktop?.runAiDiagnosis) {
    try {
      return await window.arkitectDesktop.runAiDiagnosis(request);
    } catch (error) {
      return {
        ok: false,
        error: {
          code: "network_error",
          message: error instanceof Error ? error.message : "AI diagnosis bridge call failed."
        }
      };
    }
  }

  if (runtime === "electron" || runtime === "electron-bridge-missing") {
    return {
      ok: false,
      error: {
        code: "network_error",
        message: getAiConnectBlockedMessage(runtime)
      }
    };
  }

  if (shouldBlockLiveAiInBrowser(request.credentials, runtime)) {
    return {
      ok: true,
      enrichment: createSkippedEnrichment(
        request.credentials.preferredProvider,
        request.credentials.modelName,
        getAiConnectBlockedMessage(runtime)
      )
    };
  }

  const enrichment = await browserAiAdapter.runDiagnosis(request.facts, request.credentials, request.repoPath);

  return {
    ok: enrichment.ok,
    enrichment: enrichment.enrichment,
    error: enrichment.error
  };
}

export async function runCodebaseVerifyViaBridge(
  input: { repoPath: string },
  runtime: DesktopRuntime
): Promise<CodebaseVerifyResult> {
  if (hasDesktopBridge() && window.arkitectDesktop?.runCodebaseVerify) {
    try {
      return await window.arkitectDesktop.runCodebaseVerify(input);
    } catch (error) {
      return {
        ok: false,
        repoPath: input.repoPath,
        command: "pnpm verify",
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: 0,
        steps: [],
        summary: "Codebase verification bridge call failed.",
        hint: error instanceof Error ? error.message : "Unknown bridge error."
      };
    }
  }

  const browserHint =
    "Run from the repo root in PowerShell: cd C:\\Dev\\Arkitect-mcp.com then pnpm verify — not C:\\Windows\\System32.";

  if (runtime === "browser") {
    return {
      ok: false,
      repoPath: input.repoPath,
      command: "pnpm verify",
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: 0,
      steps: [],
      summary: "Codebase verification requires the Electron desktop app.",
      errorCode: "not_local_repo",
      hint: browserHint
    };
  }

  return {
    ok: false,
    repoPath: input.repoPath,
    command: "pnpm verify",
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    durationMs: 0,
    steps: [],
    summary: "Desktop bridge unavailable for codebase verification.",
    hint: "Restart with pnpm dev:desktop, or run pnpm verify from the connected repo root in PowerShell."
  };
}
