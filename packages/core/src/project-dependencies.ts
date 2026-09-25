import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { PackageManagerId } from "@arkitect/contracts";

interface PackageManifest {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

export interface ProjectDependenciesStatus {
  installed: boolean;
  message: string;
}

function hasDeclaredRuntimeDependencies(manifest: PackageManifest): boolean {
  return (
    Object.keys(manifest.dependencies ?? {}).length > 0 ||
    Object.keys(manifest.devDependencies ?? {}).length > 0 ||
    Object.keys(manifest.peerDependencies ?? {}).length > 0 ||
    Object.keys(manifest.optionalDependencies ?? {}).length > 0
  );
}

function hasYarnPlugNPlayLayout(repoPath: string): boolean {
  return (
    existsSync(join(repoPath, ".pnp.cjs")) ||
    existsSync(join(repoPath, ".pnp.js")) ||
    existsSync(join(repoPath, ".pnp.data.json"))
  );
}

function hasPnpmInstallLayout(repoPath: string): boolean {
  if (existsSync(join(repoPath, "node_modules", ".pnpm"))) {
    return true;
  }

  if (existsSync(join(repoPath, ".pnpm"))) {
    return true;
  }

  return existsSync(join(repoPath, "node_modules")) && existsSync(join(repoPath, ".modules.yaml"));
}

function hasNodeModulesLayout(repoPath: string): boolean {
  return existsSync(join(repoPath, "node_modules"));
}

export function formatPackageInstallCommand(packageManager: PackageManagerId): string {
  switch (packageManager) {
    case "npm":
      return "npm install";
    case "pnpm":
      return "pnpm install";
    case "yarn":
      return "yarn install";
    case "bun":
      return "bun install";
    default:
      return `${packageManager} install`;
  }
}

export function packagesNotInstalledMessage(packageManager: PackageManagerId): string {
  return `packages not installed; run ${formatPackageInstallCommand(packageManager)}`;
}

export async function assessProjectDependenciesInstalled(
  repoPath: string,
  packageManager: PackageManagerId
): Promise<ProjectDependenciesStatus> {
  let manifest: PackageManifest;

  try {
    manifest = JSON.parse(await readFile(join(repoPath, "package.json"), "utf8")) as PackageManifest;
  } catch {
    return { installed: true, message: "" };
  }

  if (!hasDeclaredRuntimeDependencies(manifest)) {
    return { installed: true, message: "" };
  }

  if (hasYarnPlugNPlayLayout(repoPath)) {
    return { installed: true, message: "" };
  }

  if (packageManager === "pnpm" && hasPnpmInstallLayout(repoPath)) {
    return { installed: true, message: "" };
  }

  if (hasNodeModulesLayout(repoPath)) {
    return { installed: true, message: "" };
  }

  return {
    installed: false,
    message: packagesNotInstalledMessage(packageManager)
  };
}
