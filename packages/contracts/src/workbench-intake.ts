import type { DashboardStepId, DiagnosisIntake } from "./diagnosis.js";

export type WorkbenchIntakeSource = "cursor-interview" | "mcp-tool";

export interface WorkbenchIntakeReviewFlags {
  profile?: boolean;
  policy?: boolean;
  settings?: boolean;
}

export interface WorkbenchIntakeApplyRequest {
  source?: WorkbenchIntakeSource;
  sessionId?: string;
  intake: Partial<DiagnosisIntake>;
  markStepsReviewed?: WorkbenchIntakeReviewFlags;
  advanceToStep?: DashboardStepId;
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
