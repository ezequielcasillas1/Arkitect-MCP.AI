import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import {
  detectPackageManager,
  formatPackageAuditCommand,
  formatPackageScriptCommand,
  isPackageManagerInstalled,
  packageManagerMissingHint,
  runPackageAudit,
  runPackageScript,
  type DetectedPackageManager
} from "./package-manager.js";

export { tailOutput } from "./process-output.js";
export {
  detectPackageManager,
  formatPackageAuditCommand,
  formatPackageScriptCommand,
  isPackageManagerInstalled,
  packageManagerMissingHint,
  runPackageAudit,
  runPackageScript,
  type DetectedPackageManager
};

export async function runPnpmScript(repoPath: string, script: string): Promise<{ exitCode: number; output: string }> {
  const result = await runPackageScript(repoPath, script, "pnpm");
  return { exitCode: result.exitCode, output: result.output };
}

export async function readPackageScripts(repoPath: string): Promise<Record<string, string>> {
  const packageJsonPath = join(repoPath, "package.json");
  const raw = await readFile(packageJsonPath, "utf8");
  const parsed = JSON.parse(raw) as { scripts?: Record<string, string> };

  return parsed.scripts ?? {};
}

export interface RepoRootValidation {
  ok: boolean;
  repoPath: string;
  scripts?: Record<string, string>;
  errorCode?: "missing_repo" | "missing_package_json";
  summary?: string;
  hint?: string;
}

export interface DirectoryValidation {
  ok: boolean;
  repoPath: string;
  errorCode?: "missing_repo";
  summary?: string;
  hint?: string;
}

export function validateDirectoryRoot(inputPath: string): DirectoryValidation {
  const trimmed = inputPath.trim();

  if (!trimmed) {
    return {
      ok: false,
      repoPath: trimmed,
      errorCode: "missing_repo",
      summary: "No repo path provided.",
      hint: "Connect a local repo path before running commands."
    };
  }

  const repoPath = resolve(trimmed);

  if (!existsSync(repoPath)) {
    return {
      ok: false,
      repoPath,
      errorCode: "missing_repo",
      summary: "The repo path does not exist.",
      hint: "Pass an existing directory as repoPath."
    };
  }

  return { ok: true, repoPath };
}

export function validateRepoRoot(inputPath: string): RepoRootValidation {
  const directory = validateDirectoryRoot(inputPath);

  if (!directory.ok) {
    return directory;
  }

  const repoPath = directory.repoPath;

  if (!existsSync(join(repoPath, "package.json"))) {
    return {
      ok: false,
      repoPath,
      errorCode: "missing_package_json",
      summary: "This folder is not a Node project root.",
      hint: "Run from the repo root that contains package.json — not C:\\Windows\\System32."
    };
  }

  return { ok: true, repoPath };
}
