import { describe, expect, it } from "vitest";
import { suggestRequirementTags } from "./requirement-tag-suggestions.js";

describe("suggestRequirementTags", () => {
  it("suggests MCP and modular package tags from repo scope keywords", () => {
    const suggestions = suggestRequirementTags({
      repoSummary: "Arkitect desktop app with mcp-server, pnpm-workspace, and packages/",
      requestedOutcome: "Expose MCP tools for agent workflows",
      platformType: "desktop",
      workloadType: "architecture-foundation",
      currentArchitecture: "vertical-slice",
      repoHealth: "healthy",
      likelyDiagnosisIntent: "review",
      repoInspection: {
        source: "local-path",
        path: "C:\\Dev\\Arkitect-mcp.com",
        repoName: "Arkitect",
        exists: true,
        isDirectory: true,
        hasGit: true,
        manifestFiles: ["package.json", "pnpm-workspace.yaml"],
        topLevelDirectories: ["apps", "packages"],
        topLevelFiles: [],
        samplePaths: ["apps/desktop", "packages/mcp-server"],
        frameworkHints: ["electron", "wrangler"],
        detectedMarkers: ["features/"],
        validationErrors: [],
        summary: "Monorepo with MCP server and desktop shell.",
        inspectedAt: new Date().toISOString()
      }
    });

    const tags = suggestions.map((item) => item.tag);

    expect(tags).toContain("mcp-tool-registry");
    expect(tags).toContain("modular-packages");
    expect(tags).toContain("desktop-shell");
  });

  it("prioritizes recovery tags for unhealthy repos", () => {
    const suggestions = suggestRequirementTags({
      repoSummary: "Legacy repo with drifting boundaries",
      requestedOutcome: "Recover repo structure",
      platformType: "web",
      workloadType: "migration",
      currentArchitecture: "unknown",
      repoHealth: "spaghetti",
      likelyDiagnosisIntent: "repo-recovery"
    });

    expect(suggestions.some((item) => item.tag === "repo-recovery")).toBe(true);
    expect(suggestions.some((item) => item.tag === "boundary-repair")).toBe(true);
  });
});
