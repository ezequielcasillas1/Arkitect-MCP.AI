import type { ClientSession, ClientSessionResolveInput } from "@arkitect/contracts";
import { looksLikeHostRepo } from "./host-markers.js";
import { repoPathsEqual, resolveRepoPath } from "./paths.js";

const HOST_REDESIGN_BLOCKED =
  "Host architecture redesign is only allowed from the Arkitect-mcp.com repo root.";

function resolveWorkspacePath(input: ClientSessionResolveInput): string {
  return (
    input.defaultRepoPath?.trim() ||
    process.env.ARKITECT_DEFAULT_REPO_PATH?.trim() ||
    input.cwd?.trim() ||
    process.cwd()
  );
}

function resolveHostPath(input: ClientSessionResolveInput, workspacePath: string, targetPath: string): string | undefined {
  const explicit = input.hostRepoPath?.trim() || process.env.ARKITECT_HOST_REPO_PATH?.trim();

  if (explicit) {
    return resolveRepoPath(explicit);
  }

  if (looksLikeHostRepo(workspacePath)) {
    return resolveRepoPath(workspacePath);
  }

  if (looksLikeHostRepo(targetPath)) {
    return resolveRepoPath(targetPath);
  }

  return undefined;
}

export function resolveClientSession(input: ClientSessionResolveInput = {}): ClientSession {
  const workspacePath = resolveRepoPath(resolveWorkspacePath(input));
  const targetPath = resolveRepoPath(input.repoPath?.trim() || workspacePath);
  const hostRepoPath = resolveHostPath(input, workspacePath, targetPath);
  const workspaceIsHost = looksLikeHostRepo(workspacePath, hostRepoPath);
  const targetIsHost = looksLikeHostRepo(targetPath, hostRepoPath);
  const clientRepoPath = workspaceIsHost ? targetPath : workspacePath;

  if (workspaceIsHost && targetIsHost) {
    return {
      role: "host",
      clientRepoPath,
      hostRepoPath: hostRepoPath ?? workspacePath,
      targetRepoPath: targetPath,
      targetIsHost: true,
      writeScope: "host-architecture",
      toolsUnlocked: true,
      allowLocalOverrides: true,
      allowHostArchitectureRedesign: true,
      executionPermissionFloor: "apply-safe-changes"
    };
  }

  if (targetIsHost) {
    return {
      role: "client",
      clientRepoPath,
      hostRepoPath,
      targetRepoPath: targetPath,
      targetIsHost: true,
      writeScope: "client-tree",
      toolsUnlocked: true,
      allowLocalOverrides: true,
      allowHostArchitectureRedesign: false,
      executionPermissionFloor: "generate-plan",
      blockedReason: HOST_REDESIGN_BLOCKED
    };
  }

  return {
    role: "client",
    clientRepoPath,
    hostRepoPath,
    targetRepoPath: targetPath,
    targetIsHost: false,
    writeScope: "client-tree",
    toolsUnlocked: true,
    allowLocalOverrides: true,
    allowHostArchitectureRedesign: false,
    executionPermissionFloor: "apply-safe-changes",
    blockedReason: hostRepoPath && repoPathsEqual(targetPath, hostRepoPath) ? HOST_REDESIGN_BLOCKED : undefined
  };
}
