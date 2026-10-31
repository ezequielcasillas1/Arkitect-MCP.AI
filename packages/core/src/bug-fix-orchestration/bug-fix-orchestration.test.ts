import { describe, expect, it } from "vitest";
import { createMockAutoDetections } from "@arkitect/repo-analyzer";
import { createDefaultIntake, createDiagnosisResult } from "../diagnosis-result.js";
import {
  buildBugFixOrchestrationResult,
  createBugFixOrchestrationCatalogPayload,
  createBugFixOrchestrationCursorGuidance
} from "./bug-fix-orchestration.js";
import {
  buildRootCausePortraitResult,
  createRootCausePortraitCursorGuidance
} from "./root-cause-portraiture.js";

function diagnoseFromInput(partial: {
  repoSummary?: string;
  requestedOutcome?: string;
  repoName?: string;
}) {
  const intake = createDefaultIntake();
  const mergedIntake = {
    ...intake,
    repoName: partial.repoName ?? intake.repoName,
    repoSummary: partial.repoSummary ?? intake.repoSummary,
    requestedOutcome: partial.requestedOutcome ?? intake.requestedOutcome
  };

  return createDiagnosisResult(mergedIntake, createMockAutoDetections(mergedIntake));
}

describe("root-cause portraiture power unit", () => {
  it("portrays missing-guard from null dereference language", () => {
    const diagnosis = diagnoseFromInput({
      repoSummary: "bug fix for checkout crash",
      requestedOutcome: "find root cause"
    });
    const result = buildRootCausePortraitResult(diagnosis, {
      errorMessage: "TypeError: Cannot read properties of undefined (reading 'id')",
      stackTrace: "at CheckoutService.pay (checkout.ts:42)",
      failingTests: ["checkout pays with saved card"]
    });

    expect(result.portrait.primaryCause.category).toBe("missing-guard");
    expect(result.portrait.evidence.length).toBeGreaterThan(2);
    expect(result.portrait.portraitNarrative).toContain("Primary root cause");
    expect(result.portrait.nextProbes.some((probe) => probe.includes("orchestrate_bug_fix"))).toBe(true);
  });

  it("creates cursor guidance that blocks premature fixes", () => {
    const diagnosis = diagnoseFromInput({ repoSummary: "regression in auth" });
    const result = buildRootCausePortraitResult(diagnosis, {
      symptomText: "config missing API key in staging"
    });
    const guidance = createRootCausePortraitCursorGuidance(result);

    expect(guidance.some((line) => line.includes("Do not apply fixes"))).toBe(true);
    expect(result.portrait.primaryCause.category).toBe("config-drift");
  });
});

describe("bug-fix orchestration unit", () => {
  it("returns catalog with portraiture power unit marker", () => {
    const payload = createBugFixOrchestrationCatalogPayload();

    expect(payload.total).toBeGreaterThan(4);
    expect(payload.powerUnit).toBe("root-cause-portraiture");
  });

  it("limits phases without explicit fix intent", () => {
    const diagnosis = diagnoseFromInput({
      repoSummary: "error in billing",
      requestedOutcome: "diagnose the crash"
    });
    const result = buildBugFixOrchestrationResult(diagnosis, {
      errorMessage: "schema validation failed for InvoicePayload",
      requestedOutcome: "diagnose the crash"
    });

    expect(result.autoFixAllowed).toBe(false);
    expect(result.orchestrationPlan.map((phase) => phase.id)).toEqual([
      "capture-symptoms",
      "portray-root-cause",
      "verify-regression"
    ]);
    expect(result.orchestrationPlan.find((phase) => phase.id === "portray-root-cause")?.powerUnit).toBe(
      "root-cause-portraiture"
    );
  });

  it("expands apply-fix when explicit fix intent is set", () => {
    const diagnosis = diagnoseFromInput({
      repoSummary: "bug and regression in payments",
      requestedOutcome: "fix the bug"
    });
    const result = buildBugFixOrchestrationResult(diagnosis, {
      errorMessage: "race condition timeout waiting for webhook",
      requestedOutcome: "fix the bug",
      explicitFixIntent: true
    });

    expect(result.orchestrationPlan.map((phase) => phase.id)).toContain("apply-fix");
    expect(result.recommendedStrategies.length).toBeGreaterThan(0);
    const guidance = createBugFixOrchestrationCursorGuidance(result);
    expect(guidance.some((line) => line.includes("Auto-fix allowed: false"))).toBe(true);
  });
});
