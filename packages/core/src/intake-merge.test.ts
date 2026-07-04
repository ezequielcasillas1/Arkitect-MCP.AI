import { describe, expect, it } from "vitest";
import { applyPartialIntakeToDraft, mergeDiagnosisIntake } from "./intake-merge.js";
import { createDefaultIntake } from "./diagnosis-result.js";

describe("mergeDiagnosisIntake", () => {
  it("merges partial fields over defaults", () => {
    const merged = mergeDiagnosisIntake({ repoName: "Custom", requestedOutcome: "Ship feature X" });

    expect(merged.repoName).toBe("Custom");
    expect(merged.requestedOutcome).toBe("Ship feature X");
    expect(merged.executionMode).toBe("guided");
  });

  it("deep-merges catalog preferences and user input", () => {
    const merged = mergeDiagnosisIntake({
      userInput: {
        platformType: { hint: "web", confirmed: true }
      },
      catalogPreferences: {
        complexityProfile: "structured",
        requirementTags: ["mcp", "desktop"]
      }
    });

    expect(merged.userInput.platformType.hint).toBe("web");
    expect(merged.catalogPreferences.complexityProfile).toBe("structured");
    expect(merged.catalogPreferences.requirementTags).toEqual(["mcp", "desktop"]);
  });
});

describe("applyPartialIntakeToDraft", () => {
  it("preserves existing draft fields when partial is sparse", () => {
    const current = createDefaultIntake("C:\\Projects\\Alpha");
    const next = applyPartialIntakeToDraft(current, { requestedOutcome: "Interview outcome" });

    expect(next.repoPath).toBe("C:\\Projects\\Alpha");
    expect(next.requestedOutcome).toBe("Interview outcome");
  });

  it("clears github route when switching to local path", () => {
    const current = {
      ...createDefaultIntake(),
      routeSource: "github-api" as const,
      githubRoute: {
        source: "github-api" as const,
        target: {
          owner: "acme",
          repo: "app",
          branch: "main",
          fullName: "acme/app"
        }
      }
    };
    const next = applyPartialIntakeToDraft(current, { routeSource: "local-path", repoPath: "C:\\Local" });

    expect(next.routeSource).toBe("local-path");
    expect(next.githubRoute).toBeUndefined();
  });
});
