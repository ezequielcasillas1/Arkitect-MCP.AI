import type { RefactoringAnalysisResult, RefactoringMcpPayload } from "@arkitect/contracts";
import { createRefactoringCursorGuidance } from "@arkitect/core";

export function toRefactoringMcpPayload(result: RefactoringAnalysisResult): RefactoringMcpPayload {
  return {
    summary: result.summary,
    analysis: result,
    cursorGuidance: createRefactoringCursorGuidance(result)
  };
}
