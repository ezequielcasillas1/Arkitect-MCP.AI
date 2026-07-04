import type { DiagnosisIntake, WorkbenchIntakeApplyRequest } from "@arkitect/contracts";

export function normalizeWorkbenchIntakeRequest(input: Record<string, unknown>): WorkbenchIntakeApplyRequest {
  const autoRun = input.autoRun as WorkbenchIntakeApplyRequest["autoRun"];
  const saveAsPreset = typeof input.saveAsPreset === "string" ? input.saveAsPreset : undefined;
  const applyAllTestSources = input.applyAllTestSources === true;
  const markStepsReviewed = input.markStepsReviewed as WorkbenchIntakeApplyRequest["markStepsReviewed"];
  const advanceToStep = input.advanceToStep as WorkbenchIntakeApplyRequest["advanceToStep"];
  const source = input.source as WorkbenchIntakeApplyRequest["source"];
  const sessionId = typeof input.sessionId === "string" ? input.sessionId : undefined;

  if (input.intake && typeof input.intake === "object") {
    return {
      source,
      sessionId,
      advanceToStep,
      markStepsReviewed,
      autoRun,
      saveAsPreset,
      applyAllTestSources,
      intake: input.intake as Partial<DiagnosisIntake>
    };
  }

  const {
    markStepsReviewed: _m,
    advanceToStep: _a,
    source: _s,
    sessionId: _sid,
    autoRun: _ar,
    saveAsPreset: _sp,
    applyAllTestSources: _ats,
    ...intakeFields
  } = input;

  return {
    source,
    sessionId,
    advanceToStep,
    markStepsReviewed,
    autoRun,
    saveAsPreset,
    applyAllTestSources,
    intake: intakeFields as Partial<DiagnosisIntake>
  };
}
