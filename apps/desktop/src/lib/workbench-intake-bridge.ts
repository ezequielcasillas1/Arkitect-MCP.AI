import type {
  DashboardStepId,
  PendingWorkbenchIntakeState,
  WorkbenchIntakeApplyRequest,
  WorkbenchIntakeReviewFlags
} from "@arkitect/contracts";
import { hasDesktopBridge } from "./desktop-bridge";

export async function loadPendingWorkbenchIntake(): Promise<PendingWorkbenchIntakeState> {
  if (hasDesktopBridge() && window.arkitectDesktop?.getPendingWorkbenchIntake) {
    return window.arkitectDesktop.getPendingWorkbenchIntake();
  }

  return { pending: null };
}

export async function clearPendingWorkbenchIntake() {
  if (hasDesktopBridge() && window.arkitectDesktop?.clearPendingWorkbenchIntake) {
    return window.arkitectDesktop.clearPendingWorkbenchIntake();
  }

  return { ok: false };
}

export function subscribeWorkbenchIntake(onReceive: (payload: WorkbenchIntakeApplyRequest) => void) {
  if (!hasDesktopBridge() || !window.arkitectDesktop?.onWorkbenchIntakeReceived) {
    return () => undefined;
  }

  return window.arkitectDesktop.onWorkbenchIntakeReceived(onReceive);
}

export function resolveWorkbenchAdvanceStep(input: {
  advanceToStep?: DashboardStepId;
  repoReady: boolean;
  profileReviewed: boolean;
  policyReviewed: boolean;
  settingsReviewed: boolean;
}): DashboardStepId {
  if (input.advanceToStep) {
    return input.advanceToStep;
  }

  if (!input.repoReady) {
    return "repo-connection";
  }

  if (!input.profileReviewed) {
    return "project-profile";
  }

  if (!input.policyReviewed) {
    return "architecture-policy";
  }

  if (!input.settingsReviewed) {
    return "ai-settings";
  }

  return "review-and-run";
}

export function inferReviewFlagsFromIntake(
  intake: WorkbenchIntakeApplyRequest["intake"],
  explicit?: WorkbenchIntakeReviewFlags
): WorkbenchIntakeReviewFlags {
  if (explicit) {
    return explicit;
  }

  const hasProfileSignals = Boolean(intake.userInput && Object.keys(intake.userInput).length > 0);
  const hasPolicySignals = Boolean(
    intake.catalogPreferences &&
      (intake.catalogPreferences.selectedRemixId ||
        (intake.catalogPreferences.requirementTags?.length ?? 0) > 0 ||
        intake.catalogPreferences.complexityProfile)
  );
  const hasSettingsSignals = Boolean(intake.ai && Object.keys(intake.ai).length > 0);

  return {
    profile: hasProfileSignals,
    policy: hasPolicySignals,
    settings: hasSettingsSignals
  };
}
