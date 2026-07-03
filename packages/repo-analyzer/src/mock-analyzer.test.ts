import { describe, expect, it } from "vitest";
import { createDefaultIntake } from "@arkitect/core";
import { createMockAutoDetections } from "./mock-analyzer.js";

describe("createMockAutoDetections", () => {
  it("detects desktop and vertical-slice signals for the default intake", () => {
    const intake = createDefaultIntake();
    intake.repoInspection = {
      source: "local-path",
      path: intake.repoPath,
      repoName: intake.repoName,
      exists: true,
      isDirectory: true,
      hasGit: true,
      manifestFiles: ["package.json", "pnpm-workspace.yaml"],
      topLevelDirectories: ["apps", "packages", "features"],
      topLevelFiles: [],
      samplePaths: ["apps/desktop", "packages/core"],
      frameworkHints: ["electron", "vite"],
      detectedMarkers: ["features/"],
      validationErrors: [],
      summary: "Electron monorepo with feature slices.",
      inspectedAt: new Date().toISOString()
    };

    const detections = createMockAutoDetections(intake);

    expect(detections.platformType.value).toBe("desktop");
    expect(["vertical-slice", "modular-monolith"]).toContain(detections.currentArchitecture.value);
    expect(detections.repoHealth.confidence).toBeGreaterThan(0.5);
  });
});
