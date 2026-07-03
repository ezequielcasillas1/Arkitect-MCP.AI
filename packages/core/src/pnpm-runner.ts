import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";

export function tailOutput(output: string, maxLines = 24): string {
  const lines = output.trim().split(/\r?\n/);

  if (lines.length <= maxLines) {
    return lines.join("\n");
  }

  return lines.slice(-maxLines).join("\n");
}

export function resolvePnpmCommand(): string {
  return process.platform === "win32" ? "pnpm.cmd" : "pnpm";
}

export function runPnpmScript(repoPath: string, script: string): Promise<{ exitCode: number; output: string }> {
  return new Promise((resolvePromise) => {
    const child = spawn(resolvePnpmCommand(), ["run", script], {
      cwd: repoPath,
      shell: process.platform === "win32",
      env: process.env
    });

    let output = "";

    child.stdout.on("data", (chunk: Buffer | string) => {
      output += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer | string) => {
      output += chunk.toString();
    });

    child.on("error", (error: Error) => {
      resolvePromise({
        exitCode: 1,
        output: `${output}\n${error.message}`.trim()
      });
    });

    child.on("close", (code: number | null) => {
      resolvePromise({
        exitCode: code ?? 1,
        output
      });
    });
  });
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

export function validateRepoRoot(inputPath: string): RepoRootValidation {
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

  if (!existsSync(repoPath) || !existsSync(join(repoPath, "package.json"))) {
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
