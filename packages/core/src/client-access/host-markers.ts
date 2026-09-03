import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { repoPathBasename, repoPathsEqual } from "./paths.js";

const HOST_BASENAME_PATTERN = /^arkitect-mcp(?:\.com|\.ai)?$/i;
const HOST_PACKAGE_NAME = "@arkitect/mcp-server";

export function looksLikeHostRepo(repoPath: string, hostRepoPath?: string): boolean {
  if (!repoPath.trim()) {
    return false;
  }

  if (hostRepoPath && repoPathsEqual(repoPath, hostRepoPath)) {
    return true;
  }

  if (HOST_BASENAME_PATTERN.test(repoPathBasename(repoPath))) {
    return true;
  }

  return hasHostMcpServerPackage(repoPath);
}

function hasHostMcpServerPackage(repoPath: string): boolean {
  const packageJsonPath = join(repoPath, "packages", "mcp-server", "package.json");

  if (!existsSync(packageJsonPath)) {
    return false;
  }

  try {
    const parsed = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { name?: string };
    return parsed.name === HOST_PACKAGE_NAME;
  } catch {
    return false;
  }
}
