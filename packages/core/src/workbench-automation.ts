import type {
  DesktopLibraryState,
  DiagnosisIntake,
  SavedWorkbenchPreset,
  SavedWorkbenchPresetInput,
  WorkbenchAutoRunFlags,
  WorkbenchIntakeApplyRequest,
  WorkbenchIntakeReviewFlags,
  WorkbenchAutomationResult
} from "@arkitect/contracts";
import { createDefaultIntake } from "./diagnosis-result.js";

export const TESTING_FOR_ARK_PRESET_NAME = "Testing for ARK";

export function buildTestingForArkIntake(requestedOutcome?: string): Partial<DiagnosisIntake> {
  const defaults = createDefaultIntake("C:\\Dev\\Arkitect-mcp.com");

  return {
    routeSource: "local-path",
    repoPath: defaults.repoPath,
    repoName: defaults.repoName,
    repoSummary: defaults.repoSummary,
    requestedOutcome: requestedOutcome?.trim() || defaults.requestedOutcome,
    executionPermission: "apply-structural-changes",
    userInput: defaults.userInput,
    catalogPreferences: defaults.catalogPreferences,
    ai: {
      ...defaults.ai,
      preferredProvider: "composer-2.5",
      modelName: "composer-2.5"
    }
  };
}

export function buildTestingForArkApplyRequest(requestedOutcome?: string): WorkbenchIntakeApplyRequest {
  return {
    source: "cursor-interview",
    intake: buildTestingForArkIntake(requestedOutcome),
    markStepsReviewed: {
      profile: true,
      policy: true,
      settings: true,
      mcp: true
    },
    autoRun: {
      diagnosis: true,
      verify: true,
      advanceToResults: true
    },
    saveAsPreset: TESTING_FOR_ARK_PRESET_NAME
  };
}

export function resolveWorkbenchApplyRequest(payload: WorkbenchIntakeApplyRequest): WorkbenchIntakeApplyRequest {
  if (payload.applyAllTestSources) {
    const canonical = buildTestingForArkApplyRequest(
      typeof payload.intake.requestedOutcome === "string" ? payload.intake.requestedOutcome : undefined
    );

    return {
      ...canonical,
      ...payload,
      source: payload.source ?? canonical.source,
      intake: { ...canonical.intake, ...payload.intake },
      markStepsReviewed: { ...canonical.markStepsReviewed, ...payload.markStepsReviewed },
      autoRun: { ...canonical.autoRun, ...payload.autoRun },
      saveAsPreset: payload.saveAsPreset ?? canonical.saveAsPreset
    };
  }

  const autoRun = payload.autoRun ?? {};
  const hasAutomation = Boolean(autoRun.diagnosis || autoRun.verify || autoRun.advanceToResults);

  if (!hasAutomation && payload.saveAsPreset?.trim().toLowerCase() === TESTING_FOR_ARK_PRESET_NAME.toLowerCase()) {
    return {
      ...payload,
      autoRun: defaultAutoRunFlags()
    };
  }

  return payload;
}

export function workbenchPresetToApplyRequest(preset: SavedWorkbenchPreset): WorkbenchIntakeApplyRequest {
  return resolveWorkbenchApplyRequest({
    source: "cursor-interview",
    intake: preset.intake,
    markStepsReviewed: preset.markStepsReviewed,
    autoRun: preset.autoRun,
    saveAsPreset: preset.name
  });
}

export function upsertWorkbenchPreset(
  library: DesktopLibraryState,
  input: SavedWorkbenchPresetInput,
  existingId?: string,
  createId: (prefix: string) => string = (prefix) => `${prefix}-${Date.now()}`
): DesktopLibraryState {
  const now = new Date().toISOString();
  const matchedId =
    existingId ??
    library.workbenchPresets.find((item) => item.name.toLowerCase() === input.name.trim().toLowerCase())?.id;
  const preset: SavedWorkbenchPreset = {
    id: matchedId ?? createId("workbench"),
    name: input.name.trim(),
    intake: input.intake,
    markStepsReviewed: input.markStepsReviewed ?? {
      profile: true,
      policy: true,
      settings: true,
      mcp: true
    },
    autoRun: input.autoRun ?? {
      diagnosis: true,
      verify: true,
      advanceToResults: true
    },
    createdAt: library.workbenchPresets.find((item) => item.id === matchedId)?.createdAt ?? now,
    updatedAt: now
  };

  const exists = library.workbenchPresets.some((item) => item.id === preset.id);

  return {
    ...library,
    workbenchPresets: exists
      ? library.workbenchPresets.map((item) => (item.id === preset.id ? preset : item))
      : [preset, ...library.workbenchPresets]
  };
}

export function applyRequestToWorkbenchPreset(
  payload: WorkbenchIntakeApplyRequest,
  presetName: string,
  createId: (prefix: string) => string
): SavedWorkbenchPresetInput {
  return {
    name: presetName,
    intake: payload.intake,
    markStepsReviewed: payload.markStepsReviewed ?? {
      profile: true,
      policy: true,
      settings: true,
      mcp: true
    },
    autoRun: payload.autoRun ?? {
      diagnosis: false,
      verify: false,
      advanceToResults: false
    }
  };
}

export interface WorkbenchAutomationDeps {
  testAiConnection: () => Promise<boolean>;
  runDiagnosis: () => Promise<void>;
  runVerify: () => Promise<boolean>;
  goToStep: (step: WorkbenchAutomationResult["landedOnStep"]) => void;
}

export async function runWorkbenchAutomationPipeline(
  payload: WorkbenchIntakeApplyRequest,
  reviewFlags: WorkbenchIntakeReviewFlags,
  deps: WorkbenchAutomationDeps
): Promise<WorkbenchAutomationResult> {
  const autoRun = payload.autoRun ?? {};
  const needsAiForRun = Boolean(autoRun.diagnosis || autoRun.verify);

  if (needsAiForRun && reviewFlags.settings) {
    const aiReady = await deps.testAiConnection();

    if (!aiReady) {
      deps.goToStep("ai-settings");

      return {
        ok: false,
        phase: "blocked",
        message: "Saved Cursor API key missing or invalid. Add your key on AI / Execution, then retry.",
        landedOnStep: "ai-settings"
      };
    }
  }

  if (autoRun.diagnosis) {
    await deps.runDiagnosis();
  }

  if (autoRun.verify) {
    const verifyOk = await deps.runVerify();

    if (!verifyOk && !autoRun.diagnosis) {
      return {
        ok: false,
        phase: "blocked",
        message: "Codebase verify failed. Review output on Results.",
        landedOnStep: "results-overview"
      };
    }
  }

  if (autoRun.advanceToResults) {
    deps.goToStep("results-overview");
  }

  return {
    ok: true,
    phase: "complete",
    message: "Workbench automation finished.",
    landedOnStep: autoRun.advanceToResults ? "results-overview" : undefined
  };
}

export function defaultAutoRunFlags(overrides: Partial<WorkbenchAutoRunFlags> = {}): WorkbenchAutoRunFlags {
  return {
    diagnosis: true,
    verify: true,
    advanceToResults: true,
    ...overrides
  };
}

export function defaultReviewFlags(overrides: Partial<WorkbenchIntakeReviewFlags> = {}): WorkbenchIntakeReviewFlags {
  return {
    profile: true,
    policy: true,
    settings: true,
    mcp: true,
    ...overrides
  };
}
