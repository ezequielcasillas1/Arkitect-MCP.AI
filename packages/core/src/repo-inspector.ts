import { readdir, readFile, stat } from "node:fs/promises";
import { basename, join } from "node:path";
import type { RepoInspection } from "@arkitect/contracts";

const manifestFileNames = new Set([
  "package.json",
  "pnpm-workspace.yaml",
  "tsconfig.json",
  "vite.config.ts",
  "vite.config.js",
  "wrangler.jsonc",
  "wrangler.toml",
  "next.config.js",
  "next.config.mjs",
  "next.config.ts",
  "composer.json",
  "Cargo.toml",
  "pyproject.toml",
  "requirements.txt",
  "go.mod",
  "index.php",
  "wp-config.php"
]);

const packageHintNames = [
  "electron",
  "tauri",
  "react",
  "vite",
  "next",
  "wrangler",
  "workerd",
  "express",
  "fastify",
  "@nestjs/core",
  "typescript",
  "wordpress"
];

const maxPhpScanFiles = 48;
const maxWalkDepth = 5;

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

function summarizeInspection(inspection: Omit<RepoInspection, "summary">): string {
  const segments = [
    inspection.hasGit ? "git repo detected" : "git repo not detected",
    inspection.manifestFiles.length > 0 ? `manifests: ${inspection.manifestFiles.join(", ")}` : "no common manifests found",
    inspection.frameworkHints.length > 0 ? `framework hints: ${inspection.frameworkHints.join(", ")}` : "no framework hints detected",
    inspection.topLevelDirectories.length > 0
      ? `top-level dirs: ${inspection.topLevelDirectories.slice(0, 5).join(", ")}`
      : "no top-level directories found"
  ];

  return segments.join(" | ");
}

async function readPackageHints(repoPath: string): Promise<{ repoName?: string; frameworkHints: string[]; validationErrors: string[] }> {
  const packageJsonPath = join(repoPath, "package.json");

  try {
    const raw = await readFile(packageJsonPath, "utf8");
    const parsed = JSON.parse(raw) as {
      name?: string;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      scripts?: Record<string, string>;
    };
    const dependencyNames = [
      ...Object.keys(parsed.dependencies ?? {}),
      ...Object.keys(parsed.devDependencies ?? {}),
      ...Object.keys(parsed.scripts ?? {})
    ];

    return {
      repoName: parsed.name,
      frameworkHints: uniqueSorted(
        dependencyNames.filter((name) => packageHintNames.some((hint) => name.includes(hint)))
      ),
      validationErrors: []
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        frameworkHints: [],
        validationErrors: []
      };
    }

    return {
      frameworkHints: [],
      validationErrors: ["package.json could not be parsed cleanly."]
    };
  }
}

async function readSamplePaths(repoPath: string, topLevelDirectories: string[]): Promise<string[]> {
  const sampleParents = topLevelDirectories.filter((directory) =>
    ["src", "app", "apps", "packages", "features", "parts", "static-preview", "assets"].includes(directory)
  );
  const samples: string[] = [];

  for (const parent of sampleParents.slice(0, 4)) {
    try {
      const childEntries = await readdir(join(repoPath, parent), { withFileTypes: true });
      samples.push(...childEntries.slice(0, 8).map((entry) => `${parent}/${entry.name}`));
    } catch {
      continue;
    }
  }

  return uniqueSorted(samples);
}

async function collectRelativePaths(
  repoPath: string,
  relativeDir: string,
  depth: number,
  extension: string,
  bucket: string[]
): Promise<void> {
  if (depth > maxWalkDepth || bucket.length >= maxPhpScanFiles) {
    return;
  }

  let entries;

  try {
    entries = await readdir(join(repoPath, relativeDir), { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (bucket.length >= maxPhpScanFiles) {
      break;
    }

    if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "vendor") {
      continue;
    }

    const relativePath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;

    if (entry.isFile() && entry.name.endsWith(extension)) {
      bucket.push(relativePath);
      continue;
    }

    if (entry.isDirectory()) {
      await collectRelativePaths(repoPath, relativePath, depth + 1, extension, bucket);
    }
  }
}

async function detectStaticStackHints(
  repoPath: string,
  topLevelFiles: string[],
  topLevelDirectories: string[]
): Promise<{ frameworkHints: string[]; detectedMarkers: string[] }> {
  const frameworkHints: string[] = [];
  const detectedMarkers: string[] = [];

  const phpFiles: string[] = [];
  await collectRelativePaths(repoPath, "", 0, ".php", phpFiles);

  if (phpFiles.length > 0 || topLevelFiles.some((file) => file.endsWith(".php"))) {
    frameworkHints.push("php");
    detectedMarkers.push(...phpFiles.slice(0, 8).map((file) => `php:${file}`));
  }

  const htmlFiles: string[] = [];
  await collectRelativePaths(repoPath, "", 0, ".html", htmlFiles);

  const hasPackageJson = topLevelFiles.includes("package.json");

  if (!hasPackageJson && (htmlFiles.length > 0 || topLevelFiles.some((file) => file.endsWith(".html")))) {
    frameworkHints.push("html-static");
    detectedMarkers.push(...htmlFiles.slice(0, 8).map((file) => `html:${file}`));
  }

  const isWordPress =
    topLevelDirectories.includes("wp-content") ||
    topLevelDirectories.includes("wp-includes") ||
    topLevelFiles.includes("wp-config.php") ||
    (topLevelFiles.includes("style.css") &&
      (await readFile(join(repoPath, "style.css"), "utf8").catch(() => "")).includes("Theme Name:"));

  if (isWordPress) {
    frameworkHints.push("wordpress");
    detectedMarkers.push("wordpress-theme-or-core");
  }

  return {
    frameworkHints: uniqueSorted(frameworkHints),
    detectedMarkers: uniqueSorted(detectedMarkers)
  };
}

export function buildRepoSummaryFromInspection(inspection: RepoInspection): string {
  if (inspection.validationErrors.length > 0) {
    return inspection.summary;
  }

  if (inspection.frameworkHints.includes("wordpress")) {
    return "WordPress theme or site detected from the inspected file tree.";
  }

  if (inspection.frameworkHints.includes("php")) {
    return "Plain PHP web site detected from .php entrypoints and includes.";
  }

  if (inspection.frameworkHints.includes("html-static")) {
    return "Static HTML site detected without a Node package manifest.";
  }

  if (inspection.frameworkHints.length > 0) {
    return `Inspected repo stack: ${inspection.frameworkHints.join(", ")}.`;
  }

  return inspection.summary;
}

export async function inspectRepoPath(repoPath: string): Promise<RepoInspection> {
  const fallbackName = basename(repoPath) || "selected-project";

  try {
    const repoStats = await stat(repoPath);

    if (!repoStats.isDirectory()) {
      return {
        source: "local-path",
        path: repoPath,
        repoName: fallbackName,
        exists: true,
        isDirectory: false,
        hasGit: false,
        manifestFiles: [],
        topLevelDirectories: [],
        topLevelFiles: [],
        samplePaths: [],
        frameworkHints: [],
        detectedMarkers: [],
        validationErrors: ["Selected path is not a directory."],
        summary: "Selected path is not a directory.",
        inspectedAt: new Date().toISOString()
      };
    }

    const entries = await readdir(repoPath, { withFileTypes: true });
    const topLevelDirectories = uniqueSorted(entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name));
    const topLevelFiles = uniqueSorted(entries.filter((entry) => entry.isFile()).map((entry) => entry.name));
    const manifestFiles = uniqueSorted(
      topLevelFiles.filter((fileName) => manifestFileNames.has(fileName) || fileName.endsWith(".sln"))
    );
    const hasGit = topLevelDirectories.includes(".git");
    const packageHints = await readPackageHints(repoPath);
    const samplePaths = await readSamplePaths(repoPath, topLevelDirectories);
    const staticStack = await detectStaticStackHints(repoPath, topLevelFiles, topLevelDirectories);
    const detectedMarkers = uniqueSorted([
      ...manifestFiles,
      ...staticStack.detectedMarkers,
      ...samplePaths.filter((samplePath) =>
        ["features", "domain", "application", "infrastructure", "packages", "apps", "worker", "parts"].some((marker) =>
          samplePath.includes(marker)
        )
      )
    ]);
    const frameworkHints = uniqueSorted([...packageHints.frameworkHints, ...staticStack.frameworkHints]);
    const repoName = packageHints.repoName ?? fallbackName;
    const inspectedAt = new Date().toISOString();
    const baseInspection = {
      source: "local-path" as const,
      path: repoPath,
      repoName,
      exists: true,
      isDirectory: true,
      hasGit,
      manifestFiles,
      topLevelDirectories,
      topLevelFiles,
      samplePaths,
      frameworkHints,
      detectedMarkers,
      validationErrors: packageHints.validationErrors,
      inspectedAt
    } satisfies Omit<RepoInspection, "summary">;

    return {
      ...baseInspection,
      summary: summarizeInspection(baseInspection)
    };
  } catch (error) {
    const validationError =
      (error as NodeJS.ErrnoException).code === "ENOENT"
        ? "Selected path does not exist."
        : "Selected path could not be inspected.";

    return {
      source: "local-path",
      path: repoPath,
      repoName: fallbackName,
      exists: false,
      isDirectory: false,
      hasGit: false,
      manifestFiles: [],
      topLevelDirectories: [],
      topLevelFiles: [],
      samplePaths: [],
      frameworkHints: [],
      detectedMarkers: [],
      validationErrors: [validationError],
      summary: validationError,
      inspectedAt: new Date().toISOString()
    };
  }
}

export async function listPhpFilesForSyntaxCheck(repoPath: string, limit = maxPhpScanFiles): Promise<string[]> {
  const files: string[] = [];
  await collectRelativePaths(repoPath, "", 0, ".php", files);
  return files.slice(0, limit);
}
