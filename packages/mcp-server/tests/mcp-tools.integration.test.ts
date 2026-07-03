import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createArkitectMcpServer, runTestSuite } from "../src/index.js";

describe("MCP test tools integration", () => {
  const server = createArkitectMcpServer();
  let repoPath = "";

  beforeEach(async () => {
    repoPath = await mkdtemp(join(tmpdir(), "arkitect-mcp-integration-"));
    await writeFile(
      join(repoPath, "package.json"),
      JSON.stringify({
        scripts: {
          test: 'node -e "console.log(\\"all tests ok\\")"',
          "test:unit": 'node -e "console.log(\\"unit tests ok\\")"',
          "test:integration": 'node -e "console.log(\\"integration tests ok\\")"'
        }
      })
    );
  });

  afterEach(async () => {
    repoPath = "";
  });

  it("registers verify and test runner tools", () => {
    const names = server.tools.map((tool) => tool.name);

    expect(names).toContain("verify_codebase");
    expect(names).toContain("run_tests");
    expect(names).toContain("run_test_suite");
  });

  it("executes run_test_suite tool handler for unit tests", async () => {
    const tool = server.tools.find((entry) => entry.name === "run_test_suite");
    expect(tool).toBeDefined();

    const result = await tool!.execute({ repoPath, suite: "unit" });
    const payload = result.content[0];

    expect(payload?.type).toBe("json");
    if (payload?.type === "json") {
      expect(payload.json).toMatchObject({
        ok: true,
        repoPath,
        suite: "unit",
        command: "pnpm test:unit",
        summary: "Unit tests passed."
      });
      expect(Array.isArray((payload.json as { steps: unknown[] }).steps)).toBe(true);
    }
  });

  it("executes run_tests for all suites on a temp repo", async () => {
    const tool = server.tools.find((entry) => entry.name === "run_tests");
    expect(tool).toBeDefined();

    const result = await tool!.execute({ repoPath });
    const payload = result.content[0];

    expect(payload?.type).toBe("json");
    if (payload?.type === "json") {
      expect(payload.json).toMatchObject({
        ok: true,
        suite: "all",
        command: "pnpm test"
      });
    }
  });

  it("runTestSuite integration helper returns structured output", async () => {
    const result = await runTestSuite({ repoPath, suite: "integration" });

    expect(result.ok).toBe(true);
    expect(result.suite).toBe("integration");
    expect(result.command).toBe("pnpm test:integration");
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0]?.outputTail).toContain("integration tests ok");
  });
});
