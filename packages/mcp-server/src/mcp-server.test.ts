import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
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
    expect(toolNames).toContain("recommend_patterns");
    expect(toolNames).toContain("list_architecture_decision_guide");
    expect(toolNames).toContain("recommend_architecture");
    expect(toolNames).toContain("list_refactoring_techniques");
    expect(toolNames).toContain("apply_workbench_intake");
  });

  it("accepts autoRun on apply_workbench_intake schema", () => {
    const server = createArkitectMcpServer();
    const tool = server.tools.find((entry) => entry.name === "apply_workbench_intake");

    expect(tool).toBeDefined();
    expect(JSON.stringify(tool!.inputSchema)).toContain("autoRun");
    expect(JSON.stringify(tool!.inputSchema)).toContain("saveAsPreset");
  });
});

describe("diagnose_repository tool", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

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
    expect(payload).toHaveProperty("clientSession");
  });

  it("unlocks client read/write and blocks host architecture lock", async () => {
    vi.stubEnv("ARKITECT_DEFAULT_REPO_PATH", "C:\\Dev\\PasteCraft");
    vi.stubEnv("ARKITECT_HOST_REPO_PATH", "C:\\Dev\\Occuring Projects\\Arkitect-mcp.com");

    const server = createArkitectMcpServer();
    const diagnose = server.tools.find((entry) => entry.name === "diagnose_repository");
    const recommend = server.tools.find((entry) => entry.name === "recommend_architecture");

    const diagnosisResult = await diagnose!.execute({
      repoPath: "C:\\Dev\\PasteCraft",
      repoName: "PasteCraft"
    });
    const diagnosisPayload = diagnosisResult.content[0]?.json as {
      cursorGuidance: string[];
      clientSession: { role: string; toolsUnlocked: boolean; allowHostArchitectureRedesign: boolean };
    };

    expect(diagnosisPayload.clientSession.role).toBe("client");
    expect(diagnosisPayload.clientSession.toolsUnlocked).toBe(true);
    expect(diagnosisPayload.clientSession.allowHostArchitectureRedesign).toBe(false);
    expect(diagnosisPayload.cursorGuidance.some((line) => line.includes("Read/write unlocked"))).toBe(true);

    const recommendResult = await recommend!.execute({
      repoPath: "C:\\Dev\\Occuring Projects\\Arkitect-mcp.com",
      lockCurrentArchitecture: true,
      selectedArchitectureId: "hexagonal"
    });
    const recommendPayload = recommendResult.content[0]?.json as {
      lockApplied: boolean;
      cursorGuidance: string[];
      clientSession: { targetIsHost: boolean };
    };

    expect(recommendPayload.clientSession.targetIsHost).toBe(true);
    expect(recommendPayload.lockApplied).toBe(false);
    expect(recommendPayload.cursorGuidance.some((line) => line.includes("Arkitect-mcp.com repo root"))).toBe(true);
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
