import { describe, expect, it } from "vitest";
import { suggestProjectProfileNames } from "./profile-name-suggestions.js";

describe("suggestProjectProfileNames", () => {
  it("suggests local and monorepo names from repo inspection", () => {
    const suggestions = suggestProjectProfileNames({
      repoName: "Arkitect",
      repoPath: "C:\\Dev\\Arkitect-mcp.com",
      routeSource: "local-path",
      existingProfileNames: [],
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
        samplePaths: ["apps/desktop"],
        frameworkHints: ["electron"],
        detectedMarkers: [],
        validationErrors: [],
        summary: "Monorepo with desktop shell.",
        inspectedAt: new Date().toISOString()
      }
    });

    const names = suggestions.map((item) => item.name);

    expect(names).toContain("Arkitect local");
    expect(names).toContain("Arkitect monorepo");
    expect(names).toContain("Arkitect desktop");
  });

  it("suggests github branch names and skips existing presets", () => {
    const suggestions = suggestProjectProfileNames({
      repoName: "",
      repoPath: "",
      routeSource: "github-api",
      pendingGitHub: {
        fullName: "octocat/hello-world",
        branch: "feature/mcp"
      },
      existingProfileNames: ["octocat/hello-world"],
      repoInspection: undefined
    });

    const names = suggestions.map((item) => item.name);

    expect(names).not.toContain("octocat/hello-world");
    expect(names).toContain("hello-world (feature/mcp)");
  });
});
