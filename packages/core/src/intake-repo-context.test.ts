import { cp, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createDefaultIntake } from "./diagnosis-result.js";
import { enrichIntakeWithRepoInspection } from "./intake-repo-context.js";
import { inspectRepoPath } from "./repo-inspector.js";
import { mergeDiagnosisIntake } from "./intake-merge.js";

const fixturesRoot = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "verify");

describe("enrichIntakeWithRepoInspection", () => {
  it("replaces host scaffold defaults with inspected client repo context", async () => {
    const repoPath = await mkdtemp(join(tmpdir(), "arkitect-intake-php-"));
    await cp(join(fixturesRoot, "plain-php"), repoPath, { recursive: true });
    const inspection = await inspectRepoPath(repoPath);
    const merged = mergeDiagnosisIntake({ repoPath });
    const intake = enrichIntakeWithRepoInspection(merged, inspection, { repoPath });

    expect(intake.repoName).toBe(inspection.repoName);
    expect(intake.repoSummary).toContain("PHP");
    expect(intake.userInput.platformType?.confirmed).toBe(false);
    expect(intake.repoInspection?.frameworkHints).toContain("php");
  });

  it("preserves explicit repoName overrides", async () => {
    const defaults = createDefaultIntake("/tmp/demo");
    const inspection = await inspectRepoPath("/tmp/demo");
    const intake = enrichIntakeWithRepoInspection(defaults, inspection, {
      repoPath: "/tmp/demo",
      repoName: "Custom Name"
    });

    expect(intake.repoName).toBe("Custom Name");
  });
});
