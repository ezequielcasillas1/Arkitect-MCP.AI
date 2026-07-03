import type { EventEmitter } from "node:events";
import { EventEmitter as NodeEventEmitter } from "node:events";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createArkitectMcpServer } from "../src/index.js";

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

describe("verify_codebase tool integration", () => {
  let repoPath = "";

  beforeEach(async () => {
    spawnMock.mockReset();
    repoPath = await mkdtemp(join(tmpdir(), "arkitect-mcp-verify-"));
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

  it("executes verify flow and returns step results including test", async () => {
    mockSpawnSequence([
      { exitCode: 0, output: "lint ok" },
      { exitCode: 0, output: "build ok" },
      { exitCode: 0, output: "typecheck ok" },
      { exitCode: 0, output: "tests passed" }
    ]);

    const server = createArkitectMcpServer();
    const tool = server.tools.find((entry) => entry.name === "verify_codebase");

    expect(tool).toBeDefined();

    const result = await tool!.execute({ repoPath });
    const payload = result.content[0].json as {
      ok: boolean;
      steps: Array<{ id: string; status: string }>;
      summary: string;
    };

    expect(payload.ok).toBe(true);
    expect(payload.steps.map((step) => step.id)).toEqual(["lint", "build", "typecheck", "test"]);
    expect(payload.summary).toContain("passed");
  });
});

describe("diagnose_repository execute integration", () => {
  it("runs without Electron and returns structured JSON content", async () => {
    const server = createArkitectMcpServer();
    const tool = server.tools.find((entry) => entry.name === "diagnose_repository");

    const result = await tool!.execute({});
    const payload = result.content[0].json as Record<string, unknown>;

    expect(result.content[0].type).toBe("json");
    expect(payload).toMatchObject({
      summary: expect.any(String),
      cursorGuidance: expect.any(Array)
    });
    expect(payload.diagnosis).toBeTruthy();
  });
});
