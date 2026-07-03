import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as pnpmRunner from "./pnpm-runner.js";
import { discoverTestCapabilities, runTestOverride } from "./test-override.js";

vi.mock("./pnpm-runner.js", async () => {
  const actual = await vi.importActual<typeof import("./pnpm-runner.js")>("./pnpm-runner.js");

  return {
    ...actual,
    runPnpmScript: vi.fn()
  };
});

vi.mock("./codebase-verification.js", () => ({
  runCodebaseVerification: vi.fn(async () => ({
    ok: true,
    repoPath: "/repo",
    command: "pnpm verify",
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    durationMs: 10,
    steps: [{ id: "lint", label: "Lint", status: "success", exitCode: 0, outputTail: "" }],
    summary: "Codebase verification passed (1/4 steps)."
  }))
}));

vi.mock("./test-runner.js", () => ({
  runRepoTests: vi.fn(async () => ({
    ok: true,
    repoPath: "/repo",
    suite: "all",
    command: "pnpm test",
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    durationMs: 10,
    steps: [{ id: "all", label: "All tests", status: "success", exitCode: 0, outputTail: "" }],
    summary: "All tests passed."
  }))
}));

describe("discoverTestCapabilities", () => {
  it("marks scripts as available from package.json", async () => {
    const repoPath = await mkdtemp(join(tmpdir(), "arkitect-override-"));
    await writeFile(
      join(repoPath, "package.json"),
      JSON.stringify({
        scripts: {
          lint: "turbo run lint",
          build: "turbo run build",
          typecheck: "turbo run typecheck",
          test: "turbo run test",
          "test:unit": "turbo run test:unit"
        }
      })
    );

    const catalog = await discoverTestCapabilities({ repoPath });

    expect(catalog.capabilities.find((cap) => cap.id === "lint")?.available).toBe(true);
    expect(catalog.capabilities.find((cap) => cap.id === "integration")?.available).toBe(false);
    expect(catalog.capabilities.find((cap) => cap.id === "verify")?.available).toBe(true);
  });
});

describe("runTestOverride", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("runs lint as a single quality step", async () => {
    const repoPath = await mkdtemp(join(tmpdir(), "arkitect-override-run-"));
    await writeFile(
      join(repoPath, "package.json"),
      JSON.stringify({ scripts: { lint: "eslint ." } })
    );

    vi.mocked(pnpmRunner.runPnpmScript).mockResolvedValue({ exitCode: 0, output: "ok" });

    const result = await runTestOverride({ repoPath, kind: "lint" });

    expect(result.ok).toBe(true);
    expect(result.kind).toBe("lint");
    expect(result.steps).toHaveLength(1);
  });

  it("delegates verify to codebase verification", async () => {
    const result = await runTestOverride({ repoPath: "/repo", kind: "verify" });

    expect(result.kind).toBe("verify");
    expect(result.ok).toBe(true);
  });
});
