import type { ArchitectureCatalogEntry, DesignPatternCatalogEntry, RemixProfileCatalogEntry } from "./catalog.js";
import type { DiagnosisResult } from "./diagnosis.js";

export interface McpTextContent {
  type: "text";
  text: string;
}

export interface McpJsonContent {
  type: "json";
  json: unknown;
}

export type McpToolContent = McpTextContent | McpJsonContent;

export interface ArkitectMcpToolResult {
  content: McpToolContent[];
}

export interface ArkitectMcpToolDefinition<TInput = unknown> {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  execute: (input: TInput) => Promise<ArkitectMcpToolResult>;
}

export interface ArkitectMcpResource {
  uri: string;
  name: string;
  description: string;
}

export interface DiagnosisMcpPayload {
  summary: string;
  diagnosis: DiagnosisResult;
  cursorGuidance: string[];
}

export interface CatalogMcpPayload<TEntry> {
  summary: string;
  total: number;
  items: TEntry[];
}

export interface LibraryMcpPayload {
  architectures: CatalogMcpPayload<ArchitectureCatalogEntry>;
  remixProfiles: CatalogMcpPayload<RemixProfileCatalogEntry>;
  designPatterns: CatalogMcpPayload<DesignPatternCatalogEntry>;
}

export type McpConnectionPath = "manual" | "external";
export type McpConnectionStatus = "disconnected" | "connecting" | "connected" | "error";
export type McpAnalyzerMode = "mock" | "real";

export interface McpServerLaunchConfig {
  command: string;
  args: string[];
  env: Record<string, string>;
  cwd?: string;
  useProjectMcpJson: boolean;
  projectMcpJsonPath?: string;
}

export interface McpSurfaceSummary {
  name: string;
  description?: string;
  uri?: string;
}

export interface McpConnectionHealth {
  lastPingAt?: string;
  lastError?: string;
  latencyMs?: number;
}

export interface McpConnectionRuntimeConfig {
  defaultRepoPath?: string;
  analyzerMode: McpAnalyzerMode;
  policyOverridesReadOnly: string[];
}

export interface McpConnectionState {
  status: McpConnectionStatus;
  path: McpConnectionPath | null;
  message: string;
  serverName?: string;
  serverVersion?: string;
  toolCount: number;
  resourceCount: number;
  tools: McpSurfaceSummary[];
  resources: McpSurfaceSummary[];
  health: McpConnectionHealth;
  config: McpConnectionRuntimeConfig;
  bridgePort?: number;
  externalSessionId?: string;
  connectedAt?: string;
  launchConfig?: McpServerLaunchConfig;
}

export interface McpBridgeManifest {
  port: number;
  token: string;
  updatedAt: string;
}

export interface McpExternalRegistration {
  sessionId: string;
  serverName: string;
  serverVersion: string;
  tools: McpSurfaceSummary[];
  resources: McpSurfaceSummary[];
  config?: Partial<McpConnectionRuntimeConfig>;
  pid?: number;
}

export interface McpExternalHeartbeat {
  sessionId: string;
  toolCount: number;
  resourceCount: number;
}

export const DEFAULT_MCP_BRIDGE_PORT = 47821;

export function createDefaultMcpConnectionState(
  overrides: Partial<McpConnectionState> = {}
): McpConnectionState {
  return {
    status: "disconnected",
    path: null,
    message: "No MCP server connected.",
    toolCount: 0,
    resourceCount: 0,
    tools: [],
    resources: [],
    health: {},
    config: {
      analyzerMode: "mock",
      policyOverridesReadOnly: [
        "Honor user overrides before structural changes.",
        "Do not auto-refactor without explicit migration intent.",
        "Continue inside detected architecture when repo health is stable."
      ]
    },
    ...overrides
  };
}

export function createDefaultMcpLaunchConfig(
  overrides: Partial<McpServerLaunchConfig> = {}
): McpServerLaunchConfig {
  return {
    command: "node",
    args: ["packages/mcp-server/dist/stdio.js"],
    env: {},
    useProjectMcpJson: false,
    ...overrides
  };
}
