import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { CodebaseVerifyResult } from "@arkitect/contracts";
import { writeVerifyReport } from "./verify-report.js";

describe("writeVerifyReport", () => {
  it("writes markdown and JSON report files and returns their paths", async () => {
    const repoPath = await mkdtemp(join(tmpdir(), "arkitect-report-"));
    const result: CodebaseVerifyResult = {
      ok: true,
      repoPath,
      command: "npm lint, build, typecheck, test, and audit",
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: 10,
      steps: [],
      summary: "Codebase verification passed.",
      packageManager: "npm",
      gitCommit: "abc123",
      gitBranch: "main"
    };

    const paths = await writeVerifyReport(result, { reportDir: join(repoPath, ".arkitect", "reports") });

    expect(paths.reportPath).toBeDefined();
    expect(paths.reportJsonPath).toBeDefined();

    const markdown = await readFile(paths.reportPath!, "utf8");
    const json = JSON.parse(await readFile(paths.reportJsonPath!, "utf8")) as CodebaseVerifyResult;

    expect(markdown).toContain("Arkitect verify report");
    expect(markdown).toContain(repoPath);
    expect(json.ok).toBe(true);
    expect(json.repoPath).toBe(repoPath);
  });
});
