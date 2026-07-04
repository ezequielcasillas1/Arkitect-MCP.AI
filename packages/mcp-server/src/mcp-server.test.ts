import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createArkitectMcpServer, diagnoseRepository } from "../src/index.js";
import { toMcpToolResult } from "../src/mcp-result-mapper.js";

type JsonSchema = {
  type?: string;
  properties?: Record<string, JsonSchema>;
};

function matchesSchemaType(schema: JsonSchema, value: unknown): boolean {
  switch (schema.type) {
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number";
    case "boolean":
      return typeof value === "boolean";
    case "array":
      return Array.isArray(value);
    case "object":
      return typeof value === "object" && value !== null && !Array.isArray(value);
    default:
      return true;
  }
}

/**
 * A non-empty but definitely nonexistent repo path. Using a non-empty string here matters:
 * an empty string makes `resolveDefaultRepoPath` fall back to `process.cwd()`, which would
 * cause these handlers to spawn *real* pnpm lint/build/test commands against this very
 * package during the test run. Pointing at a nonexistent folder makes `validateRepoRoot`
 * short-circuit before anything is spawned, while still exercising the real output shape.
 */
const NONEXISTENT_REPO_PATH = join(tmpdir(), "arkitect-mcp-structured-content-test-does-not-exist");

/** Tool inputs that avoid spawning real pnpm processes (invalid repo path short-circuits). */
const SAFE_TOOL_INPUTS: Record<string, unknown> = {
  verify_codebase: { repoPath: NONEXISTENT_REPO_PATH },
  run_tests: { repoPath: NONEXISTENT_REPO_PATH },
  run_test_suite: { repoPath: NONEXISTENT_REPO_PATH, suite: "unit" }
};

describe("createArkitectMcpServer", () => {
  it("exposes verify and test runner tools", () => {
    const server = createArkitectMcpServer();
    const toolNames = server.tools.map((tool) => tool.name);

    expect(toolNames).toContain("diagnose_repository");
    expect(toolNames).toContain("verify_codebase");
    expect(toolNames).toContain("run_tests");
    expect(toolNames).toContain("run_test_suite");
    expect(toolNames).toContain("analyze_refactoring_opportunities");
    expect(toolNames).toContain("list_refactoring_techniques");
    expect(toolNames).toContain("apply_workbench_intake");
  });
});

describe("diagnose_repository tool", () => {
  it("returns the MCP diagnosis payload shape", async () => {
    const server = createArkitectMcpServer();
    const tool = server.tools.find((entry) => entry.name === "diagnose_repository");

    expect(tool).toBeDefined();

    const result = await tool!.execute({ repoName: "Test Repo" });
    const json = result.content[0];

    expect(json.type).toBe("json");
    expect(json).toHaveProperty("json");

    const payload = json.json as {
      summary: string;
      diagnosis: Awaited<ReturnType<typeof diagnoseRepository>>;
      cursorGuidance: string[];
    };

    expect(payload.summary).toContain("Test Repo");
    expect(payload.diagnosis.intake.repoName).toBe("Test Repo");
    expect(payload.cursorGuidance.length).toBeGreaterThan(0);
  });
});

describe("MCP structuredContent compliance", () => {
  it("returns structuredContent matching each tool's declared outputSchema", async () => {
    const server = createArkitectMcpServer();
    expect(server.tools.length).toBeGreaterThan(0);

    for (const tool of server.tools) {
      const input = SAFE_TOOL_INPUTS[tool.name] ?? {};
      const toolResult = await tool.execute(input);
      const mcpResult = toMcpToolResult(toolResult);

      expect(mcpResult.content.length).toBeGreaterThan(0);
      expect(mcpResult.structuredContent, `${tool.name} is missing structuredContent`).toBeDefined();

      const structuredContent = mcpResult.structuredContent as Record<string, unknown>;
      const schema = tool.outputSchema as JsonSchema;
      expect(schema.type).toBe("object");

      for (const [key, propertySchema] of Object.entries(schema.properties ?? {})) {
        expect(structuredContent, `${tool.name}.${key} missing from structuredContent`).toHaveProperty(key);
        expect(
          matchesSchemaType(propertySchema, structuredContent[key]),
          `${tool.name}.${key} does not match declared outputSchema type "${propertySchema.type}"`
        ).toBe(true);
      }
    }
  });
});
