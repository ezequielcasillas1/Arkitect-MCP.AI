import type { EventEmitter } from "node:events";
import { EventEmitter as NodeEventEmitter } from "node:events";
import { cp, mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runCodebaseVerification } from "./codebase-verification.js";
import * as repoInspector from "./repo-inspector.js";

const spawnMock = vi.fn();

vi.mock("node:child_process", () => ({
  spawn: (...args: unknown[]) => spawnMock(...args)
}));

vi.mock("./pnpm-runner.js", async () => {
  const actual = await vi.importActual<typeof import("./pnpm-runner.js")>("./pnpm-runner.js");
  return {
    ...actual,
    isPackageManagerInstalled: vi.fn(async () => true)
  };
});

vi.mock("./verify-report.js", () => ({
  readGitMetadata: vi.fn(async () => ({})),
  writeVerifyReport: vi.fn(async () => ({
    reportPath: "/tmp/arkitect-verify-report.md",
    reportJsonPath: "/tmp/arkitect-verify-report.json"
  }))
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

const fixturesRoot = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "verify");

describe("runCodebaseVerification", () => {
  let repoPath = "";

  async function copyFixture(name: string) {
    const target = await mkdtemp(join(tmpdir(), `arkitect-verify-${name}-`));
    await cp(join(fixturesRoot, name), target, { recursive: true });
    await mkdir(join(target, "node_modules"), { recursive: true });
    return target;
  }

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
    await writeFile(join(repoPath, "package-lock.json"), "{}");
    await mkdir(join(repoPath, "node_modules"), { recursive: true });
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

  it("runs static verification for plain HTML fixtures", async () => {
    const htmlRepo = await copyFixture("plain-html");
    const result = await runCodebaseVerification({ repoPath: htmlRepo, writeReport: false });

    expect(result.command).toContain("non-Node");
    expect(result.steps.every((step) => step.status === "not_run")).toBe(true);
    expect(result.summary).toContain("do not apply");
    expect(result.summary).toContain("Static HTML site");
    expect(result.ok).toBe(true);
  });

  it("runs partial Node scripts and marks missing ones as not_run", async () => {
    const partialRepo = await copyFixture("node-partial");

    mockSpawnSequence([
      { exitCode: 0, output: "lint ok" },
      { exitCode: 0, output: "build ok" },
      {
        exitCode: 0,
        output: JSON.stringify({
          metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0 } }
        })
      }
    ]);

    const result = await runCodebaseVerification({ repoPath: partialRepo, writeReport: false });

    expect(result.ok).toBe(true);
    expect(result.errorCode).toBeUndefined();
    expect(result.steps[0]?.status).toBe("success");
    expect(result.steps[1]?.status).toBe("success");
    expect(result.steps[2]?.status).toBe("not_run");
    expect(result.steps[2]?.command).toBeUndefined();
    expect(result.steps[3]?.status).toBe("not_run");
    expect(result.summary).toContain("typecheck and test not configured");
    expect(spawnMock).toHaveBeenCalledTimes(3);
  });

  it("refuses when no lint/build/typecheck/test scripts exist", async () => {
    await writeFile(join(repoPath, "package.json"), JSON.stringify({ scripts: { dev: "vite" } }));

    const result = await runCodebaseVerification({ repoPath });

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe("missing_verify_script");
    expect(result.steps).toHaveLength(4);
    expect(spawnMock).not.toHaveBeenCalled();
  });

  it("runs lint, build, typecheck, test, and audit using npm for package-lock repos", async () => {
    mockSpawnSequence([
      { exitCode: 0, output: "lint ok" },
      { exitCode: 0, output: "build ok" },
      { exitCode: 0, output: "typecheck ok" },
      { exitCode: 0, output: "tests passed" },
      {
        exitCode: 0,
        output: JSON.stringify({
          metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0 } }
        })
      }
    ]);

    const result = await runCodebaseVerification({ repoPath });

    expect(result.ok).toBe(true);
    expect(result.packageManager).toBe("npm");
    expect(result.steps.map((step) => step.id)).toEqual(["lint", "build", "typecheck", "test", "audit"]);
    expect(result.steps.every((step) => step.status === "success")).toBe(true);
    expect(result.reportPath).toBeDefined();
    expect(spawnMock).toHaveBeenCalledTimes(5);
    expect(spawnMock.mock.calls[0]?.[0]).toBe("npm");
  });

  it("runs all configured scripts for the full Node fixture", async () => {
    const fullRepo = await copyFixture("node-full");

    mockSpawnSequence([
      { exitCode: 0, output: "lint ok" },
      { exitCode: 0, output: "build ok" },
      { exitCode: 0, output: "typecheck ok" },
      { exitCode: 0, output: "tests passed" },
      {
        exitCode: 0,
        output: JSON.stringify({
          metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0 } }
        })
      }
    ]);

    const result = await runCodebaseVerification({ repoPath: fullRepo, writeReport: false });

    expect(result.ok).toBe(true);
    expect(result.steps.filter((step) => step.status === "success")).toHaveLength(5);
  });

  it("fails verify when audit reports critical vulnerabilities", async () => {
    mockSpawnSequence([
      { exitCode: 0, output: "lint ok" },
      { exitCode: 0, output: "build ok" },
      { exitCode: 0, output: "typecheck ok" },
      { exitCode: 0, output: "tests passed" },
      {
        exitCode: 1,
        output: JSON.stringify({
          metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 2 } }
        })
      }
    ]);

    const result = await runCodebaseVerification({ repoPath, auditFailThreshold: "critical" });

    expect(result.ok).toBe(false);
    expect(result.audit?.status).toBe("failure");
    expect(result.audit?.counts.critical).toBe(2);
  });

  it("marks lint/build/typecheck/test as not_run when node_modules is missing but still runs audit", async () => {
    const bareRepo = await mkdtemp(join(tmpdir(), "arkitect-verify-bare-"));
    await writeFile(
      join(bareRepo, "package.json"),
      JSON.stringify({
        devDependencies: { eslint: "^9.0.0", typescript: "^5.0.0" },
        scripts: {
          lint: "eslint .",
          build: "next build",
          typecheck: "tsc --noEmit",
          test: "vitest run"
        }
      })
    );
    await writeFile(join(bareRepo, "package-lock.json"), "{}");

    mockSpawnSequence([
      {
        exitCode: 0,
        output: JSON.stringify({
          metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0 } }
        })
      }
    ]);

    const result = await runCodebaseVerification({ repoPath: bareRepo });

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe("packages_not_installed");
    expect(result.dependenciesInstalled).toBe(false);
    expect(result.steps.slice(0, 4).every((step) => step.status === "not_run")).toBe(true);
    expect(result.steps[0]?.outputTail).toContain("npm install");
    expect(result.steps[4]?.id).toBe("audit");
    expect(spawnMock).toHaveBeenCalledTimes(1);
    expect(spawnMock.mock.calls[0]?.[1]).toEqual(["audit", "--json"]);
  });

  it("skips remaining script steps after the first failure", async () => {
    mockSpawnSequence([
      { exitCode: 0, output: "lint ok" },
      { exitCode: 1, output: "build failed" },
      {
        exitCode: 0,
        output: JSON.stringify({
          metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0 } }
        })
      }
    ]);

    const result = await runCodebaseVerification({ repoPath });

    expect(result.ok).toBe(false);
    expect(result.steps[1]?.status).toBe("failure");
    expect(result.steps[2]?.status).toBe("skipped");
    expect(result.steps[3]?.status).toBe("skipped");
    expect(result.steps[4]?.id).toBe("audit");
    expect(spawnMock).toHaveBeenCalledTimes(3);
  });

  it("marks PHP syntax verify as failed when scan cap is hit", async () => {
    const listSpy = vi.spyOn(repoInspector, "listPhpFilesForSyntaxCheck").mockResolvedValue({
      files: ["index.php"],
      scanCapped: true
    });

    mockSpawnSequence([
      { exitCode: 0, output: "PHP 8.4" },
      { exitCode: 0, output: "No syntax errors detected" }
    ]);

    const repo = await mkdtemp(join(tmpdir(), "arkitect-php-cap-"));
    await writeFile(join(repo, "index.php"), "<?php echo 'ok';");

    const result = await runCodebaseVerification({ repoPath: repo, writeReport: false });
    const syntax = result.steps.find((step) => step.id === "syntax");

    expect(syntax?.status).toBe("failure");
    expect(syntax?.outputTail).toContain("Partial PHP syntax scan");
    expect(result.ok).toBe(false);

    listSpy.mockRestore();
  });
});
