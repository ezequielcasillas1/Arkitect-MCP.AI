import { basename, resolve } from "node:path";

export function resolveRepoPath(repoPath: string): string {
  return resolve(repoPath.trim()).replace(/[\\/]+$/, "");
}

export function normalizeRepoPath(repoPath: string): string {
  return resolveRepoPath(repoPath).toLowerCase();
}

export function repoPathsEqual(left?: string, right?: string): boolean {
  if (!left?.trim() || !right?.trim()) {
    return false;
  }

  return normalizeRepoPath(left) === normalizeRepoPath(right);
}

export function repoPathBasename(repoPath: string): string {
  return basename(repoPath.replace(/[\\/]+$/, ""));
}
