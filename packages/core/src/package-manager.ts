import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
import type { PackageManagerId } from "@arkitect/contracts";

export interface DetectedPackageManager {
  id: PackageManagerId;
  source: "packageManager-field" | "lockfile" | "default";
  lockfile?: string;
}

const lockfilePriority: Array<{ file: string; id: PackageManagerId }> = [
  { file: "bun.lockb", id: "bun" },
  { file: "bun.lock", id: "bun" },
  { file: "pnpm-lock.yaml", id: "pnpm" },
  { file: "yarn.lock", id: "yarn" },
  { file: "package-lock.json", id: "npm" }
];

function parsePackageManagerField(raw: string | undefined): PackageManagerId | undefined {
  if (!raw?.trim()) {
    return undefined;
  }

  const id = raw.trim().split("@")[0]?.trim().toLowerCase();

  if (id === "npm" || id === "pnpm" || id === "yarn" || id === "bun") {
    return id;
  }

  return undefined;
}

export async function detectPackageManager(repoPath: string): Promise<DetectedPackageManager> {
  try {
    const packageJsonPath = join(repoPath, "package.json");
    const raw = await readFile(packageJsonPath, "utf8");
    const parsed = JSON.parse(raw) as { packageManager?: string };
    const fromField = parsePackageManagerField(parsed.packageManager);

    if (fromField) {
      return { id: fromField, source: "packageManager-field" };
    }
  } catch {
    // fall through to lockfiles
  }

  for (const entry of lockfilePriority) {
    if (existsSync(join(repoPath, entry.file))) {
      return { id: entry.id, source: "lockfile", lockfile: entry.file };
    }
  }

  return { id: "npm", source: "default" };
}

export function resolvePackageManagerCommand(id: PackageManagerId): string {
  if (process.platform === "win32") {
    return id === "pnpm" ? "pnpm.cmd" : id;
  }

  return id;
}

export function formatPackageScriptCommand(id: PackageManagerId, script: string): string {
  switch (id) {
    case "npm":
      return `npm run ${script}`;
    case "pnpm":
      return `pnpm run ${script}`;
    case "yarn":
      return `yarn run ${script}`;
    case "bun":
      return `bun run ${script}`;
    default:
      return `${id} run ${script}`;
  }
}

export function formatPackageAuditCommand(id: PackageManagerId): string {
  switch (id) {
    case "npm":
      return "npm audit --json";
    case "pnpm":
      return "pnpm audit --json";
    case "yarn":
      return "yarn npm audit --json";
    case "bun":
      return "bun audit";
    default:
      return `${id} audit --json`;
  }
}

function spawnCommand(
  command: string,
  args: string[],
  repoPath: string
): Promise<{ exitCode: number; output: string }> {
  return new Promise((resolvePromise) => {
    const child = spawn(command, args, {
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

export async function runPackageScript(
  repoPath: string,
  script: string,
  packageManager: PackageManagerId
): Promise<{ exitCode: number; output: string; command: string }> {
  const command = formatPackageScriptCommand(packageManager, script);
  const binary = resolvePackageManagerCommand(packageManager);
  const args =
    packageManager === "npm" || packageManager === "pnpm" || packageManager === "yarn" || packageManager === "bun"
      ? ["run", script]
      : ["run", script];
  const result = await spawnCommand(binary, args, repoPath);

  return { ...result, command };
}

export async function runPackageAudit(
  repoPath: string,
  packageManager: PackageManagerId
): Promise<{ exitCode: number; output: string; command: string }> {
  const command = formatPackageAuditCommand(packageManager);
  const binary = resolvePackageManagerCommand(packageManager);

  if (packageManager === "npm" || packageManager === "pnpm") {
    const result = await spawnCommand(binary, ["audit", "--json"], repoPath);
    return { ...result, command };
  }

  if (packageManager === "yarn") {
    const result = await spawnCommand(binary, ["npm", "audit", "--json"], repoPath);
    return { ...result, command };
  }

  if (packageManager === "bun") {
    const result = await spawnCommand(binary, ["audit"], repoPath);
    return { ...result, command };
  }

  const result = await spawnCommand(binary, ["audit", "--json"], repoPath);
  return { ...result, command };
}

export async function isPackageManagerInstalled(id: PackageManagerId): Promise<boolean> {
  const binary = resolvePackageManagerCommand(id);
  const result = await spawnCommand(binary, ["--version"], process.cwd());
  return result.exitCode === 0;
}

export function packageManagerMissingHint(id: PackageManagerId, detection: DetectedPackageManager): string {
  const lockHint = detection.lockfile ? ` (detected from ${detection.lockfile})` : "";
  return `${id} is required for this project${lockHint} but is not installed or not on PATH. Install ${id} or enable it via corepack before running Arkitect verify/tests.`;
}
