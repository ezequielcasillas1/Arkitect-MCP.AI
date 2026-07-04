import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { McpConnectionRuntimeConfig, McpConnectionState, McpServerLaunchConfig, McpSurfaceSummary } from "@arkitect/contracts";
import { createDefaultMcpConnectionState } from "@arkitect/contracts";
import { resolveDevRepoRoot, resolveMcpNodeCommand, resolveMcpStdioPath, withMcpNodeSpawnEnv } from "./mcp-runtime-paths.js";

interface CursorMcpJson {
  mcpServers?: Record<
    string,
    {
      command?: string;
      args?: string[];
      env?: Record<string, string>;
      cwd?: string;
    }
  >;
}

async function readProjectMcpLaunch(repoPath?: string): Promise<McpServerLaunchConfig | null> {
  const roots = [repoPath, process.cwd(), resolveDevRepoRoot()].filter(Boolean) as string[];

  for (const root of roots) {
    const configPath = join(root, ".cursor", "mcp.json");

    if (!existsSync(configPath)) {
      continue;
    }

    try {
      const parsed = JSON.parse(await readFile(configPath, "utf8")) as CursorMcpJson;
      const entry =
        parsed.mcpServers?.["arkitect-mcp"] ??
        Object.entries(parsed.mcpServers ?? {}).find(([name]) => name.includes("arkitect"))?.[1];

      if (!entry?.command) {
        continue;
      }

      return {
        command: entry.command,
        args: entry.args ?? [],
        env: entry.env ?? {},
        cwd: entry.cwd ?? root,
        useProjectMcpJson: true,
        projectMcpJsonPath: configPath
      };
    } catch {
      continue;
    }
  }

  return null;
}

export async function resolveManualLaunchConfig(
  config: McpServerLaunchConfig,
  repoPath?: string
): Promise<McpServerLaunchConfig> {
  if (config.useProjectMcpJson) {
    const projectConfig = await readProjectMcpLaunch(repoPath);

    if (projectConfig) {
      return projectConfig;
    }
  }

  const stdioPath = resolveMcpStdioPath();
  const args =
    config.args.length > 0 && config.args.some((arg) => arg.includes("stdio"))
      ? config.args
      : [stdioPath];

  return {
    ...config,
    command: config.command || resolveMcpNodeCommand(),
    args,
    cwd: config.cwd || resolveDevRepoRoot(),
    env: {
      ...config.env,
      ARKITECT_ANALYZER: config.env.ARKITECT_ANALYZER ?? "mock"
    }
  };
}

function buildRuntimeConfig(launchConfig: McpServerLaunchConfig, repoPath?: string): McpConnectionRuntimeConfig {
  const analyzerMode = launchConfig.env.ARKITECT_ANALYZER === "real" ? "real" : "mock";

  return {
    defaultRepoPath: launchConfig.env.ARKITECT_DEFAULT_REPO_PATH || repoPath,
    analyzerMode,
    policyOverridesReadOnly: [
      "Honor user overrides before structural changes.",
      "Do not auto-refactor without explicit migration intent.",
      "Continue inside detected architecture when repo health is stable."
    ]
  };
}

export class McpClientManager {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private currentState = createDefaultMcpConnectionState();
  private onStateChange: ((state: McpConnectionState) => void) | null = null;

  getState() {
    return this.currentState;
  }

  setOnStateChange(handler: (state: McpConnectionState) => void) {
    this.onStateChange = handler;
  }

  private publish(state: McpConnectionState) {
    this.currentState = state;
    this.onStateChange?.(state);
  }

  async connect(config: McpServerLaunchConfig, repoPath?: string, bridgePort?: number) {
    await this.disconnect(false);

    const launchConfig = await resolveManualLaunchConfig(config, repoPath);

    this.publish({
      ...createDefaultMcpConnectionState(),
      status: "connecting",
      path: "manual",
      message: "Starting MCP server process…",
      launchConfig,
      bridgePort,
      config: buildRuntimeConfig(launchConfig, repoPath)
    });

    const transport = new StdioClientTransport({
      command: launchConfig.command,
      args: launchConfig.args,
      env: withMcpNodeSpawnEnv({
        ...launchConfig.env,
        ARKITECT_SKIP_DESKTOP_BRIDGE: "1",
        ARKITECT_DESKTOP_BRIDGE_PORT: bridgePort ? String(bridgePort) : launchConfig.env.ARKITECT_DESKTOP_BRIDGE_PORT
      }),
      cwd: launchConfig.cwd,
      stderr: "pipe"
    });

    const client = new Client({
      name: "arkitect-desktop",
      version: "0.2.0"
    });

    try {
      await client.connect(transport);
      const serverInfo = client.getServerVersion();
      const toolsResult = await client.listTools();
      const resourcesResult = await client.listResources();

      const tools: McpSurfaceSummary[] = toolsResult.tools.map((tool) => ({
        name: tool.name,
        description: tool.description
      }));
      const resources: McpSurfaceSummary[] = resourcesResult.resources.map((resource) => ({
        name: resource.name,
        description: resource.description,
        uri: resource.uri
      }));

      this.client = client;
      this.transport = transport;

      const connectedAt = new Date().toISOString();

      this.publish({
        status: "connected",
        path: "manual",
        message: `Manual MCP connected (${serverInfo?.name ?? "server"}).`,
        serverName: serverInfo?.name,
        serverVersion: serverInfo?.version,
        toolCount: tools.length,
        resourceCount: resources.length,
        tools,
        resources,
        health: {
          lastPingAt: connectedAt,
          latencyMs: 0
        },
        config: buildRuntimeConfig(launchConfig, repoPath),
        bridgePort,
        launchConfig,
        connectedAt
      });

      this.startPingLoop();
    } catch (error) {
      await transport.close().catch(() => undefined);

      this.publish({
        ...createDefaultMcpConnectionState({
          bridgePort,
          launchConfig,
          config: buildRuntimeConfig(launchConfig, repoPath)
        }),
        status: "error",
        path: "manual",
        message: error instanceof Error ? error.message : "Failed to connect to MCP server."
      });

      throw error;
    }
  }

  private startPingLoop() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
    }

    this.pingTimer = setInterval(() => {
      void this.ping();
    }, 15_000);
  }

  async ping() {
    if (!this.client || this.currentState.path !== "manual") {
      return this.currentState;
    }

    const started = Date.now();

    try {
      const toolsResult = await this.client.listTools();
      const resourcesResult = await this.client.listResources();
      const lastPingAt = new Date().toISOString();

      this.publish({
        ...this.currentState,
        status: "connected",
        toolCount: toolsResult.tools.length,
        resourceCount: resourcesResult.resources.length,
        tools: toolsResult.tools.map((tool) => ({
          name: tool.name,
          description: tool.description
        })),
        resources: resourcesResult.resources.map((resource) => ({
          name: resource.name,
          description: resource.description,
          uri: resource.uri
        })),
        health: {
          lastPingAt,
          latencyMs: Date.now() - started
        }
      });
    } catch (error) {
      this.publish({
        ...this.currentState,
        status: "error",
        message: error instanceof Error ? error.message : "MCP health check failed.",
        health: {
          ...this.currentState.health,
          lastError: error instanceof Error ? error.message : "MCP health check failed."
        }
      });
    }

    return this.currentState;
  }

  async disconnect(publish = true) {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }

    if (this.client) {
      await this.client.close().catch(() => undefined);
      this.client = null;
    }

    if (this.transport) {
      await this.transport.close().catch(() => undefined);
      this.transport = null;
    }

    if (publish) {
      this.publish(
        createDefaultMcpConnectionState({
          bridgePort: this.currentState.bridgePort,
          launchConfig: this.currentState.launchConfig,
          message: "Manual MCP disconnected."
        })
      );
    }
  }
}

export async function readProjectMcpJsonPreview(repoPath?: string) {
  return readProjectMcpLaunch(repoPath);
}
