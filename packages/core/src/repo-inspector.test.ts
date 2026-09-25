import { cp, mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { inspectRepoPath, listPhpFilesForSyntaxCheck, PHP_SYNTAX_CHECK_FILE_LIMIT } from "./repo-inspector.js";

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

  it("lists more than 48 PHP files for syntax check when present", async () => {
    const repoPath = await mkdtemp(join(tmpdir(), "arkitect-inspect-many-php-"));

    for (let index = 1; index <= 55; index += 1) {
      const dir = join(repoPath, "parts", `home${index}`);
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, "page.php"), `<?php echo ${index};`);
    }

    const listing = await listPhpFilesForSyntaxCheck(repoPath);

    expect(listing.files.length).toBe(55);
    expect(listing.scanCapped).toBe(false);
    expect(PHP_SYNTAX_CHECK_FILE_LIMIT).toBeGreaterThan(48);
  });

  it("honors a custom syntax-check limit and reports scan cap", async () => {
    const repoPath = await mkdtemp(join(tmpdir(), "arkitect-inspect-cap-php-"));

    for (let index = 1; index <= 12; index += 1) {
      await writeFile(join(repoPath, `file-${index}.php`), `<?php echo ${index};`);
    }

    const listing = await listPhpFilesForSyntaxCheck(repoPath, 10);

    expect(listing.files).toHaveLength(10);
    expect(listing.scanCapped).toBe(true);
  });
});
