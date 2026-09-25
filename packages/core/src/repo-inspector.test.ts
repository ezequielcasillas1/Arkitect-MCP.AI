import { cp, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { inspectRepoPath } from "./repo-inspector.js";

const fixturesRoot = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "verify");

describe("inspectRepoPath", () => {
  it("detects PHP markers for plain PHP fixtures", async () => {
    const repoPath = await mkdtemp(join(tmpdir(), "arkitect-inspect-php-"));
    await cp(join(fixturesRoot, "plain-php"), repoPath, { recursive: true });

    const inspection = await inspectRepoPath(repoPath);

    expect(inspection.frameworkHints).toContain("php");
    expect(inspection.detectedMarkers.some((marker) => marker.startsWith("php:"))).toBe(true);
  });

  it("detects static HTML markers without package.json", async () => {
    const repoPath = await mkdtemp(join(tmpdir(), "arkitect-inspect-html-"));
    await cp(join(fixturesRoot, "plain-html"), repoPath, { recursive: true });

    const inspection = await inspectRepoPath(repoPath);

    expect(inspection.frameworkHints).toContain("html-static");
    expect(inspection.manifestFiles).not.toContain("package.json");
  });
});
