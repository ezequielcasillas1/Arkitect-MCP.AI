import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createArkitectMcpServer, runTestSuite } from "../src/index.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

describe("MCP test tools integration", () => {
  const server = createArkitectMcpServer();

  it("registers verify and test runner tools", () => {
    const names = server.tools.map((tool) => tool.name);

    expect(names).toContain("verify_codebase");
    expect(names).toContain("run_tests");
    expect(names).toContain("run_test_suite");
  });

  it("executes run_test_suite tool handler for unit tests", async () => {
    const tool = server.tools.find((entry) => entry.name === "run_test_suite");
    expect(tool).toBeDefined();

    const result = await tool!.execute({ repoPath: repoRoot, suite: "unit" });
    const payload = result.content[0];

    expect(payload?.type).toBe("json");
    if (payload?.type === "json") {
      expect(payload.json).toMatchObject({
        repoPath: expect.any(String),
        suite: "unit",
        command: "pnpm test:unit",
        steps: expect.any(Array),
        summary: expect.any(String)
      });
    }
  }, 180_000);

  it("runTestSuite unit helper returns structured output", async () => {
    const result = await runTestSuite({ repoPath: repoRoot, suite: "unit" });

    expect(result.suite).toBe("unit");
    expect(result.command).toBe("pnpm test:unit");
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0]?.outputTail).toBeTruthy();
  }, 180_000);
});
