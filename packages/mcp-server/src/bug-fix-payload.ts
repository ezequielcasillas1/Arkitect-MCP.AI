import type {
  BugFixOrchestrationMcpPayload,
  BugFixOrchestrationResult,
  RootCausePortraitMcpPayload,
  RootCausePortraitResult
} from "@arkitect/contracts";
import {
  createBugFixOrchestrationCursorGuidance,
  createRootCausePortraitCursorGuidance
} from "@arkitect/core";

export function toRootCausePortraitMcpPayload(result: RootCausePortraitResult): RootCausePortraitMcpPayload {
  return {
    summary: result.summary,
    portrait: result.portrait,
    diagnosisContext: result.diagnosisContext,
    cursorGuidance: createRootCausePortraitCursorGuidance(result)
  };
}

export function toBugFixOrchestrationMcpPayload(
  result: BugFixOrchestrationResult
): BugFixOrchestrationMcpPayload {
  return {
    summary: result.summary,
    analysis: result,
    cursorGuidance: createBugFixOrchestrationCursorGuidance(result)
  };
}
