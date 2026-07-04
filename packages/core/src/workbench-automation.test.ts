import { describe, expect, it, vi } from "vitest";
import {
  TESTING_FOR_ARK_PRESET_NAME,
  buildTestingForArkApplyRequest,
  buildTestingForArkIntake,
  defaultAutoRunFlags,
  resolveWorkbenchApplyRequest,
  runWorkbenchAutomationPipeline,
  upsertWorkbenchPreset,
  workbenchPresetToApplyRequest
} from "./workbench-automation.js";
import { createDefaultDesktopLibrary } from "./desktop-library.js";

describe("buildTestingForArkIntake", () => {
  it("uses local Arkitect repo defaults with structural permission", () => {
    const intake = buildTestingForArkIntake();

    expect(intake.repoPath).toContain("Arkitect-mcp.com");
    expect(intake.executionPermission).toBe("apply-structural-changes");
    expect(intake.userInput.currentArchitecture?.hint).toBe("vertical-slice");
    expect(intake.ai?.preferredProvider).toBe("composer-2.5");
  });
});

describe("buildTestingForArkApplyRequest", () => {
  it("includes full automation flags and preset name", () => {
    const request = buildTestingForArkApplyRequest("Ship MCP sync");

    expect(request.saveAsPreset).toBe(TESTING_FOR_ARK_PRESET_NAME);
    expect(request.autoRun?.diagnosis).toBe(true);
    expect(request.autoRun?.verify).toBe(true);
    expect(request.autoRun?.advanceToResults).toBe(true);
    expect(request.intake.requestedOutcome).toBe("Ship MCP sync");
  });
});

describe("upsertWorkbenchPreset", () => {
  it("adds and updates presets in library state", () => {
    const library = { ...createDefaultDesktopLibrary(), workbenchPresets: [] };
    const first = upsertWorkbenchPreset(library, {
      name: "Testing for ARK",
      intake: buildTestingForArkIntake(),
      autoRun: defaultAutoRunFlags()
    });

    expect(first.workbenchPresets[0]?.name).toBe("Testing for ARK");

    const updated = upsertWorkbenchPreset(
      first,
      {
        name: "Testing for ARK",
        intake: buildTestingForArkIntake("Updated outcome"),
        autoRun: defaultAutoRunFlags({ verify: false })
      },
      first.workbenchPresets[0]?.id
    );

    expect(updated.workbenchPresets).toHaveLength(1);
    expect(updated.workbenchPresets[0]?.intake.requestedOutcome).toBe("Updated outcome");
    expect(updated.workbenchPresets[0]?.autoRun.verify).toBe(false);
  });
});

describe("resolveWorkbenchApplyRequest", () => {
  it("merges canonical Testing for ARK automation when applyAllTestSources is true", () => {
    const request = resolveWorkbenchApplyRequest({
      applyAllTestSources: true,
      intake: { requestedOutcome: "Custom outcome" }
    });

    expect(request.intake.requestedOutcome).toBe("Custom outcome");
    expect(request.autoRun?.diagnosis).toBe(true);
    expect(request.autoRun?.advanceToResults).toBe(true);
    expect(request.saveAsPreset).toBe(TESTING_FOR_ARK_PRESET_NAME);
  });

  it("adds autoRun for Testing for ARK preset saves without explicit automation", () => {
    const request = resolveWorkbenchApplyRequest({
      saveAsPreset: TESTING_FOR_ARK_PRESET_NAME,
      intake: buildTestingForArkIntake()
    });

    expect(request.autoRun?.diagnosis).toBe(true);
    expect(request.autoRun?.verify).toBe(true);
  });
});

describe("workbenchPresetToApplyRequest", () => {
  it("maps saved preset back to apply request", () => {
    const library = upsertWorkbenchPreset(createDefaultDesktopLibrary(), {
      name: "Testing for ARK",
      intake: buildTestingForArkIntake(),
      autoRun: defaultAutoRunFlags()
    });
    const preset = library.workbenchPresets[0]!;
    const request = workbenchPresetToApplyRequest(preset);

    expect(request.intake.repoPath).toBe(preset.intake.repoPath);
    expect(request.autoRun?.diagnosis).toBe(true);
  });
});

describe("runWorkbenchAutomationPipeline", () => {
  it("runs diagnosis and verify when autoRun flags are set", async () => {
    const runDiagnosis = vi.fn(async () => undefined);
    const runVerify = vi.fn(async () => true);
    const testAiConnection = vi.fn(async () => true);
    const goToStep = vi.fn();

    const result = await runWorkbenchAutomationPipeline(
      {
        intake: buildTestingForArkIntake(),
        markStepsReviewed: { profile: true, policy: true, settings: true, mcp: true },
        autoRun: defaultAutoRunFlags()
      },
      { profile: true, policy: true, settings: true, mcp: true },
      {
        testAiConnection,
        runDiagnosis,
        runVerify,
        goToStep
      }
    );

    expect(result.ok).toBe(true);
    expect(testAiConnection).toHaveBeenCalledOnce();
    expect(runDiagnosis).toHaveBeenCalledOnce();
    expect(runVerify).toHaveBeenCalledOnce();
    expect(goToStep).toHaveBeenCalledWith("results-overview");
  });

  it("blocks at ai-settings when session key test fails", async () => {
    const result = await runWorkbenchAutomationPipeline(
      {
        intake: buildTestingForArkIntake(),
        autoRun: defaultAutoRunFlags()
      },
      { profile: true, policy: true, settings: true, mcp: true },
      {
        testAiConnection: async () => false,
        runDiagnosis: async () => undefined,
        runVerify: async () => true,
        goToStep: () => undefined
      }
    );

    expect(result.ok).toBe(false);
    expect(result.phase).toBe("blocked");
    expect(result.landedOnStep).toBe("ai-settings");
  });

  it("skips AI test when settings are not marked reviewed", async () => {
    const testAiConnection = vi.fn(async () => true);
    const runDiagnosis = vi.fn(async () => undefined);

    await runWorkbenchAutomationPipeline(
      {
        intake: buildTestingForArkIntake(),
        autoRun: defaultAutoRunFlags()
      },
      { profile: true, policy: true, settings: false, mcp: true },
      {
        testAiConnection,
        runDiagnosis,
        runVerify: async () => true,
        goToStep: () => undefined
      }
    );

    expect(testAiConnection).not.toHaveBeenCalled();
    expect(runDiagnosis).toHaveBeenCalledOnce();
  });

  it("prefill-only requests should not invoke automation deps", async () => {
    const testAiConnection = vi.fn(async () => true);
    const runDiagnosis = vi.fn(async () => undefined);
    const runVerify = vi.fn(async () => true);

    const result = await runWorkbenchAutomationPipeline(
      {
        intake: buildTestingForArkIntake(),
        autoRun: { diagnosis: false, verify: false, advanceToResults: false }
      },
      { profile: true, policy: true, settings: true, mcp: true },
      {
        testAiConnection,
        runDiagnosis,
        runVerify,
        goToStep: () => undefined
      }
    );

    expect(result.ok).toBe(true);
    expect(testAiConnection).not.toHaveBeenCalled();
    expect(runDiagnosis).not.toHaveBeenCalled();
    expect(runVerify).not.toHaveBeenCalled();
  });
});
