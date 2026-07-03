import type { EventEmitter } from "node:events";
import { EventEmitter as NodeEventEmitter } from "node:events";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runCodebaseVerification } from "./codebase-verification.js";

const spawnMock = vi.fn();

vi.mock("node:child_process", () => ({
  spawn: (...args: unknown[]) => spawnMock(...args)
}));

function mockSpawnSequence(results: Array<{ exitCode: number; output?: string }>) {
  spawnMock.mockImplementation(() => {
    const next = results.shift() ?? { exitCode: 0, output: "" };
    const emitter = new NodeEventEmitter() as EventEmitter & { stdout: EventEmitter; stderr: EventEmitter };

    emitter.stdout = new NodeEventEmitter();
    emitter.stderr = new NodeEventEmitter();

    queueMicrotask(() => {
      if (next.output) {
        emitter.stdout.emit("data", Buffer.from(next.output));
      }

      emitter.emit("close", next.exitCode);
    });

    return emitter;
  });
}

describe("runCodebaseVerification", () => {
  let repoPath = "";

  beforeEach(async () => {
    spawnMock.mockReset();
    repoPath = await mkdtemp(join(tmpdir(), "arkitect-verify-"));
    await writeFile(
      join(repoPath, "package.json"),
      JSON.stringify({
        scripts: {
          lint: "eslint .",
          build: "tsc",
          typecheck: "tsc --noEmit",
          test: "vitest run"
        }
      })
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns missing_repo when repo path is empty", async () => {
    const result = await runCodebaseVerification({ repoPath: "   " });

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe("missing_repo");
    expect(spawnMock).not.toHaveBeenCalled();
  });

  it("returns missing_package_json for non-project folders", async () => {
    const emptyPath = await mkdtemp(join(tmpdir(), "arkitect-empty-"));
    const result = await runCodebaseVerification({ repoPath: emptyPath });

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe("missing_package_json");
  });

  it("requires lint, build, typecheck, and test scripts", async () => {
    await writeFile(join(repoPath, "package.json"), JSON.stringify({ scripts: { lint: "eslint ." } }));

    const result = await runCodebaseVerification({ repoPath });

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe("missing_verify_script");
    expect(result.summary).toContain("test");
  });

  it("runs lint, build, typecheck, and test in order", async () => {
    mockSpawnSequence([
      { exitCode: 0, output: "lint ok" },
      { exitCode: 0, output: "build ok" },
      { exitCode: 0, output: "typecheck ok" },
      { exitCode: 0, output: "tests passed" }
    ]);

    const result = await runCodebaseVerification({ repoPath });

    expect(result.ok).toBe(true);
    expect(result.steps.map((step) => step.id)).toEqual(["lint", "build", "typecheck", "test"]);
    expect(result.steps.every((step) => step.status === "success")).toBe(true);
    expect(spawnMock).toHaveBeenCalledTimes(4);
  });

  it("skips remaining steps after the first failure", async () => {
    mockSpawnSequence([
      { exitCode: 0, output: "lint ok" },
      { exitCode: 1, output: "build failed" }
    ]);

    const result = await runCodebaseVerification({ repoPath });

    expect(result.ok).toBe(false);
    expect(result.steps[1]?.status).toBe("failure");
    expect(result.steps[2]?.status).toBe("skipped");
    expect(result.steps[3]?.status).toBe("skipped");
    expect(spawnMock).toHaveBeenCalledTimes(2);
  });
});
