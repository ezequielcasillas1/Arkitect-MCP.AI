import { describe, expect, it } from "vitest";
import { normalizeWorkbenchIntakeRequest } from "./workbench-intake-normalize.js";

describe("normalizeWorkbenchIntakeRequest", () => {
  it("preserves applyAllTestSources on nested intake payloads", () => {
    const request = normalizeWorkbenchIntakeRequest({
      intake: { repoPath: "C:\\Dev\\Arkitect-mcp.com", repoName: "Arkitect" },
      applyAllTestSources: true
    });

    expect(request.applyAllTestSources).toBe(true);
  });

  it("preserves autoRun and saveAsPreset on nested intake payloads", () => {
    const request = normalizeWorkbenchIntakeRequest({
      intake: { repoPath: "C:\\Dev\\Arkitect-mcp.com", repoName: "Arkitect" },
      autoRun: { diagnosis: true, verify: true, advanceToResults: true },
      saveAsPreset: "Testing for ARK",
      markStepsReviewed: { profile: true, policy: true, settings: true, mcp: true }
    });

    expect(request.intake.repoName).toBe("Arkitect");
    expect(request.autoRun?.diagnosis).toBe(true);
    expect(request.autoRun?.advanceToResults).toBe(true);
    expect(request.saveAsPreset).toBe("Testing for ARK");
  });

  it("flattens top-level intake fields when intake object is omitted", () => {
    const request = normalizeWorkbenchIntakeRequest({
      repoPath: "C:\\Dev\\Sample",
      repoName: "Sample",
      requestedOutcome: "Ship feature",
      autoRun: { diagnosis: false, verify: true, advanceToResults: false },
      markStepsReviewed: { profile: true }
    });

    expect(request.intake.repoPath).toBe("C:\\Dev\\Sample");
    expect(request.intake.requestedOutcome).toBe("Ship feature");
    expect(request.autoRun?.verify).toBe(true);
    expect(request.autoRun?.diagnosis).toBe(false);
  });
});
