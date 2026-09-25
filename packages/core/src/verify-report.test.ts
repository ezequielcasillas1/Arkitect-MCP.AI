import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CodebaseVerifyResult } from "@arkitect/contracts";
import {
  formatTimestampWithOffset,
  isReportDirectoryInsideRepo,
  pathExists,
  writeVerifyReport
} from "./verify-report.js";

describe("formatTimestampWithOffset", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses local wall time with numeric UTC offset", () => {
    vi.useFakeTimers();
    process.env.TZ = "America/Chicago";
    vi.setSystemTime(new Date("2026-09-25T11:05:16.902Z"));

    expect(formatTimestampWithOffset(new Date("2026-09-25T11:05:16.902Z"))).toBe("2026-09-25T06:05:16-05:00");
  });
});

describe("isReportDirectoryInsideRepo", () => {
  it("detects default in-repo report directory", () => {
    expect(isReportDirectoryInsideRepo("/repo/client", "/repo/client/.arkitect/reports")).toBe(true);
  });

  it("detects external report directory", () => {
    expect(isReportDirectoryInsideRepo("/repo/client", "/tmp/arkitect-reports")).toBe(false);
  });
});

describe("writeVerifyReport", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("writes markdown and JSON report files and returns their paths", async () => {
    vi.useFakeTimers();
    process.env.TZ = "America/Chicago";
    vi.setSystemTime(new Date("2026-09-25T11:05:16.902Z"));

    const repoPath = await mkdtemp(join(tmpdir(), "arkitect-report-"));
    const result: CodebaseVerifyResult = {
      ok: true,
      repoPath,
      command: "npm lint, build, typecheck, test, and audit",
      startedAt: "2026-09-25T11:05:16.902Z",
      finishedAt: "2026-09-25T11:05:16.902Z",
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
    const json = JSON.parse(await readFile(paths.reportJsonPath!, "utf8")) as CodebaseVerifyResult & {
      startedAtUtc: string;
      reportTimestampLocal: string;
    };

    expect(markdown).toContain("**Timestamp:** 2026-09-25T06:05:16-05:00");
    expect(markdown).toContain("**Timestamp (UTC):** 2026-09-25T11:05:16.902Z");
    expect(json.startedAtUtc).toBe("2026-09-25T11:05:16.902Z");
    expect(json.reportTimestampLocal).toBe("2026-09-25T06:05:16-05:00");
    expect(await pathExists(join(repoPath, ".arkitect", ".gitignore"))).toBe(true);
  });

  it("does not write into the target repo when writeReport is false", async () => {
    const repoPath = await mkdtemp(join(tmpdir(), "arkitect-report-skip-"));
    const result: CodebaseVerifyResult = {
      ok: true,
      repoPath,
      command: "verify",
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: 1,
      steps: [],
      summary: "ok"
    };

    const paths = await writeVerifyReport(result, { writeReport: false });

    expect(paths.reportPath).toBeUndefined();
    expect(await pathExists(join(repoPath, ".arkitect"))).toBe(false);
  });

  it("does not create .arkitect in the target repo when reportDir is outside the repo", async () => {
    const repoPath = await mkdtemp(join(tmpdir(), "arkitect-report-repo-"));
    const externalDir = await mkdtemp(join(tmpdir(), "arkitect-report-external-"));
    const result: CodebaseVerifyResult = {
      ok: true,
      repoPath,
      command: "verify",
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: 1,
      steps: [],
      summary: "ok"
    };

    const paths = await writeVerifyReport(result, { reportDir: externalDir });

    expect(paths.reportPath?.startsWith(externalDir)).toBe(true);
    expect(await pathExists(join(repoPath, ".arkitect"))).toBe(false);
  });
});
