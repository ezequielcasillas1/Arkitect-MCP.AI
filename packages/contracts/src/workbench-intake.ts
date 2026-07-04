import type { DashboardStepId, DiagnosisIntake } from "./diagnosis.js";

export type WorkbenchIntakeSource = "cursor-interview" | "mcp-tool";

export interface WorkbenchAutoRunFlags {
  diagnosis?: boolean;
  verify?: boolean;
  advanceToResults?: boolean;
}

export interface WorkbenchIntakeReviewFlags {
  profile?: boolean;
  policy?: boolean;
  settings?: boolean;
  mcp?: boolean;
}

export interface WorkbenchIntakeApplyRequest {
  source?: WorkbenchIntakeSource;
  sessionId?: string;
  intake: Partial<DiagnosisIntake>;
  markStepsReviewed?: WorkbenchIntakeReviewFlags;
  advanceToStep?: DashboardStepId;
  autoRun?: WorkbenchAutoRunFlags;
  saveAsPreset?: string;
  /** When true, merges the canonical Testing for ARK full automation config. */
  applyAllTestSources?: boolean;
}

export interface WorkbenchIntakeApplyResponse {
  ok: boolean;
  appliedAt: string;
  message: string;
}

export interface PendingWorkbenchIntakeState {
  pending: WorkbenchIntakeApplyRequest | null;
  receivedAt?: string;
}

export type WorkbenchAutomationPhase =
  | "idle"
  | "prefilling"
  | "testing-ai"
  | "running-diagnosis"
  | "running-verify"
  | "complete"
  | "blocked";

export interface WorkbenchAutomationResult {
  ok: boolean;
  phase: WorkbenchAutomationPhase;
  message: string;
  landedOnStep?: DashboardStepId;
}
