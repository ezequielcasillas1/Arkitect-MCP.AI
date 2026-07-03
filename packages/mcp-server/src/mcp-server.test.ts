import { describe, expect, it } from "vitest";
import { createArkitectMcpServer, diagnoseRepository } from "../src/index.js";

describe("createArkitectMcpServer", () => {
  it("exposes verify_codebase alongside diagnosis tools", () => {
    const server = createArkitectMcpServer();
    const toolNames = server.tools.map((tool) => tool.name);

    expect(toolNames).toContain("diagnose_repository");
    expect(toolNames).toContain("verify_codebase");
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
