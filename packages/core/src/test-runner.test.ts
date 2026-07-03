import type { EventEmitter } from "node:events";
import { EventEmitter as NodeEventEmitter } from "node:events";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runRepoTests } from "./test-runner.js";

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

describe("runRepoTests", () => {
  let repoPath = "";

  beforeEach(async () => {
    spawnMock.mockReset();
    repoPath = await mkdtemp(join(tmpdir(), "arkitect-tests-"));
    await writeFile(
      join(repoPath, "package.json"),
      JSON.stringify({
        scripts: {
          test: "vitest run",
          "test:unit": "vitest run --exclude integration",
          "test:integration": "vitest run --include integration"
        }
      })
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns missing_repo when repo path is empty", async () => {
    const result = await runRepoTests({ repoPath: "   " });

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe("missing_repo");
    expect(spawnMock).not.toHaveBeenCalled();
  });

  it("requires the suite script on package.json", async () => {
    await writeFile(join(repoPath, "package.json"), JSON.stringify({ scripts: { test: "vitest run" } }));

    const result = await runRepoTests({ repoPath, suite: "unit" });

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe("missing_test_script");
    expect(result.summary).toContain("test:unit");
  });

  it("runs pnpm test for the all suite", async () => {
    mockSpawnSequence([{ exitCode: 0, output: "all tests passed" }]);

    const result = await runRepoTests({ repoPath, suite: "all" });

    expect(result.ok).toBe(true);
    expect(result.command).toBe("pnpm test");
    expect(result.steps[0]?.id).toBe("all");
    expect(spawnMock).toHaveBeenCalledTimes(1);
  });

  it("runs pnpm test:unit for the unit suite", async () => {
    mockSpawnSequence([{ exitCode: 0, output: "unit tests passed" }]);

    const result = await runRepoTests({ repoPath, suite: "unit" });

    expect(result.ok).toBe(true);
    expect(result.command).toBe("pnpm test:unit");
    expect(result.steps[0]?.id).toBe("unit");
  });

  it("reports failure output tails", async () => {
    mockSpawnSequence([{ exitCode: 1, output: "integration suite failed" }]);

    const result = await runRepoTests({ repoPath, suite: "integration" });

    expect(result.ok).toBe(false);
    expect(result.steps[0]?.status).toBe("failure");
    expect(result.steps[0]?.outputTail).toContain("integration suite failed");
  });
});
