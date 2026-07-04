import type { DashboardStepId, WorkbenchAutomationPhase } from "@arkitect/contracts";

export function getHighestNavigableIndex(
  repoReady: boolean,
  settingsReviewed: boolean,
  hasResults: boolean
): number {
  if (hasResults) {
    return 6;
  }

  if (settingsReviewed) {
    return 5;
  }

  if (repoReady) {
    return 3;
  }

  return 0;
}

export function shouldClampActiveStep(input: {
  activeStep: DashboardStepId;
  activeIndex: number;
  highestNavigableIndex: number;
  automationPhase: WorkbenchAutomationPhase;
  hasRunOutput: boolean;
}) {
  if (input.activeStep === "mcp-connection") {
    return false;
  }

  if (input.activeIndex <= input.highestNavigableIndex) {
    return false;
  }

  if (
    input.activeStep === "results-overview" &&
    (input.hasRunOutput ||
      input.automationPhase === "running-diagnosis" ||
      input.automationPhase === "running-verify" ||
      input.automationPhase === "complete")
  ) {
    return false;
  }

  return true;
}
