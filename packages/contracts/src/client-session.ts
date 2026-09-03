import type { ExecutionPermission } from "./taxonomy.js";

export type ClientSessionRole = "host" | "client";
export type ClientWriteScope = "client-tree" | "host-architecture";
export type HostArchitectureAction = "lock" | "redesign" | "structural-apply" | "catalog-mutate";

export interface ClientSession {
  role: ClientSessionRole;
  clientRepoPath: string;
  hostRepoPath?: string;
  targetRepoPath: string;
  targetIsHost: boolean;
  writeScope: ClientWriteScope;
  toolsUnlocked: boolean;
  allowLocalOverrides: boolean;
  allowHostArchitectureRedesign: boolean;
  executionPermissionFloor: ExecutionPermission;
  blockedReason?: string;
}

export interface ClientSessionResolveInput {
  repoPath?: string;
  defaultRepoPath?: string;
  hostRepoPath?: string;
  cwd?: string;
}

export interface HostArchitectureGuardResult {
  allowed: boolean;
  reason?: string;
}

export interface CursorMcpServerEntry {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
}

export interface CursorMcpJson {
  mcpServers?: Record<string, CursorMcpServerEntry>;
}
