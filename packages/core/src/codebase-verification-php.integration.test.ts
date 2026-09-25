import type { EventEmitter } from "node:events";
import { EventEmitter as NodeEventEmitter } from "node:events";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

const spawnMock = vi.fn();

vi.mock("node:child_process", () => ({
  spawn: (...args: unknown[]) => spawnMock(...args)
}));

vi.mock("./verify-report.js", () => ({
  readGitMetadata: vi.fn(async () => ({})),
  writeVerifyReport: vi.fn(async () => ({}))
}));

function mockPhpLintBehavior() {
  spawnMock.mockImplementation((command: string, args: string[]) => {
    const emitter = new NodeEventEmitter() as EventEmitter & { stdout: EventEmitter; stderr: EventEmitter };
    emitter.stdout = new NodeEventEmitter();
    emitter.stderr = new NodeEventEmitter();

    queueMicrotask(() => {
      if (command === "php" && args[0] === "-v") {
        emitter.emit("close", 0);
        return;
      }

      if (command === "php" && args[0] === "-l") {
        const target = args[1] ?? "";

        if (target.includes("zz-broken.php")) {
          emitter.stderr.emit("data", Buffer.from("Parse error: syntax error"));
          emitter.emit("close", 255);
          return;
        }

        emitter.stdout.emit("data", Buffer.from("No syntax errors detected"));
        emitter.emit("close", 0);
        return;
      }

      emitter.emit("close", 0);
    });

    return emitter;
  });
}

describe("runCodebaseVerification PHP syntax integration", () => {
  it("checks more than 48 PHP files and fails on a late syntax error", async () => {
    spawnMock.mockReset();
    mockPhpLintBehavior();

    const { runCodebaseVerification } = await import("./codebase-verification.js");
    const repo = await mkdtemp(join(tmpdir(), "arkitect-php-many-"));

    for (let index = 1; index <= 54; index += 1) {
      const dir = join(repo, "parts", `home${index}`);
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, "page.php"), "<?php echo 'ok';");
    }

    await mkdir(join(repo, "parts", "home4"), { recursive: true });
    await writeFile(join(repo, "parts/home4/zz-broken.php"), "<?php syntax error here");

    const result = await runCodebaseVerification({ repoPath: repo, writeReport: false });
    const syntax = result.steps.find((step) => step.id === "syntax");

    expect(syntax?.status).toBe("failure");
    expect(result.ok).toBe(false);
    expect(syntax?.outputTail).toMatch(/zz-broken\.php/i);
    expect(spawnMock.mock.calls.filter((call) => call[1]?.[0] === "-l").length).toBe(55);
  });
});
