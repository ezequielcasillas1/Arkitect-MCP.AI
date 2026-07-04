import { mkdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type {
  McpBridgeManifest,
  McpConnectionRuntimeConfig,
  McpExternalRegistration,
  WorkbenchIntakeApplyRequest,
  WorkbenchIntakeApplyResponse
} from "@arkitect/contracts";
import { DEFAULT_MCP_BRIDGE_PORT } from "@arkitect/contracts";

const heartbeatIntervalMs = 15_000;
const registrationRetryMs = 2_000;
const registrationMaxAttempts = 30;

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function getBridgeManifestPath() {
  if (process.platform === "win32") {
    return join(
      process.env.LOCALAPPDATA || join(homedir(), "AppData", "Local"),
      "arkitect-desktop",
      "mcp-bridge.json"
    );
  }

  return join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "arkitect-desktop", "mcp-bridge.json");
}

async function readBridgeManifest(): Promise<McpBridgeManifest | null> {
  const explicitPath = process.env.ARKITECT_DESKTOP_BRIDGE_MANIFEST?.trim();

  try {
    const raw = await readFile(explicitPath || getBridgeManifestPath(), "utf8");
    const parsed = JSON.parse(raw) as McpBridgeManifest;

    if (typeof parsed.port === "number" && typeof parsed.token === "string") {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

function buildRuntimeConfig(): McpConnectionRuntimeConfig {
  const analyzerMode = process.env.ARKITECT_ANALYZER === "real" ? "real" : "mock";

  return {
    defaultRepoPath: process.env.ARKITECT_DEFAULT_REPO_PATH?.trim() || undefined,
    analyzerMode,
    policyOverridesReadOnly: [
      "Honor user overrides before structural changes.",
      "Do not auto-refactor without explicit migration intent.",
      "Continue inside detected architecture when repo health is stable."
    ]
  };
}

async function postJson<T>(url: string, token: string, body: unknown): Promise<T | null> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Arkitect-Bridge-Token": token
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export interface DesktopBridgeRegistration {
  sessionId: string;
  stop: () => void;
}

export async function registerWithDesktopBridge(input: {
  serverName: string;
  serverVersion: string;
  tools: McpExternalRegistration["tools"];
  resources: McpExternalRegistration["resources"];
}): Promise<DesktopBridgeRegistration | null> {
  if (process.env.ARKITECT_SKIP_DESKTOP_BRIDGE === "1") {
    return null;
  }

  const sessionId = `ext-${process.pid}-${Date.now()}`;
  let manifest: McpBridgeManifest | null = null;
  let baseUrl = "";

  for (let attempt = 0; attempt < registrationMaxAttempts; attempt += 1) {
    manifest = await readBridgeManifest();

    if (!manifest) {
      await delay(registrationRetryMs);
      continue;
    }

    const port = manifest.port || DEFAULT_MCP_BRIDGE_PORT;
    baseUrl = process.env.ARKITECT_DESKTOP_BRIDGE_URL?.trim() || `http://127.0.0.1:${port}`;

    const registration = await postJson<{ ok: boolean }>(`${baseUrl}/register`, manifest.token, {
      sessionId,
      serverName: input.serverName,
      serverVersion: input.serverVersion,
      tools: input.tools,
      resources: input.resources,
      config: buildRuntimeConfig(),
      pid: process.pid
    } satisfies McpExternalRegistration);

    if (registration?.ok) {
      break;
    }

    manifest = null;
    await delay(registrationRetryMs);
  }

  if (!manifest) {
    if (process.env.ARKITECT_DEBUG_BRIDGE === "1") {
      console.error(
        "[arkitect-mcp] Desktop bridge registration timed out. Start Arkitect Desktop first, then reload MCP tools."
      );
    }
    return null;
  }

  const activeManifest = manifest;
  let stopped = false;
  const heartbeat = setInterval(() => {
    if (stopped) {
      return;
    }

    void (async () => {
      const currentManifest = await readBridgeManifest();
      const token = currentManifest?.token ?? activeManifest.token;
      const heartbeatPort = currentManifest?.port ?? activeManifest.port ?? DEFAULT_MCP_BRIDGE_PORT;
      const heartbeatUrl =
        process.env.ARKITECT_DESKTOP_BRIDGE_URL?.trim() || `http://127.0.0.1:${heartbeatPort}`;

      const result = await postJson(`${heartbeatUrl}/heartbeat`, token, {
        sessionId,
        toolCount: input.tools.length,
        resourceCount: input.resources.length
      });

      if (!result && currentManifest && currentManifest.token !== activeManifest.token) {
        await postJson(`${heartbeatUrl}/register`, currentManifest.token, {
          sessionId,
          serverName: input.serverName,
          serverVersion: input.serverVersion,
          tools: input.tools,
          resources: input.resources,
          config: buildRuntimeConfig(),
          pid: process.pid
        } satisfies McpExternalRegistration);
      }
    })();
  }, heartbeatIntervalMs);

  const stop = () => {
    if (stopped) {
      return;
    }

    stopped = true;
    clearInterval(heartbeat);
    void postJson(`${baseUrl}/disconnect`, activeManifest.token, { sessionId });
  };

  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  process.on("exit", stop);

  return { sessionId, stop };
}

export async function postWorkbenchIntake(
  payload: WorkbenchIntakeApplyRequest
): Promise<WorkbenchIntakeApplyResponse> {
  const appliedAt = new Date().toISOString();
  const manifest = await readBridgeManifest();

  if (!manifest) {
    return {
      ok: false,
      appliedAt,
      message: "Desktop bridge unavailable. Start Arkitect Desktop first, then retry apply_workbench_intake."
    };
  }

  const port = manifest.port || DEFAULT_MCP_BRIDGE_PORT;
  const baseUrl = process.env.ARKITECT_DESKTOP_BRIDGE_URL?.trim() || `http://127.0.0.1:${port}`;
  const result = await postJson<WorkbenchIntakeApplyResponse>(`${baseUrl}/intake`, manifest.token, {
    ...payload,
    source: payload.source ?? "mcp-tool"
  });

  return (
    result ?? {
      ok: false,
      appliedAt,
      message: "Desktop bridge rejected workbench intake."
    }
  );
}

export async function writeBridgeManifestForTests(manifest: McpBridgeManifest) {
  const path = getBridgeManifestPath();
  await mkdir(dirname(path), { recursive: true });
  await import("node:fs/promises").then(({ writeFile }) => writeFile(path, JSON.stringify(manifest, null, 2), "utf8"));
}
