import { describe, expect, it } from "vitest";
import { createDefaultIntake, createDiagnosisResult } from "./diagnosis-result.js";
import {
  buildRefactoringAnalysisResult,
  createRefactoringCatalogPayload,
  createRefactoringCursorGuidance
} from "./refactoring-analysis.js";
import { createMockAutoDetections } from "@arkitect/repo-analyzer";

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

describe("createRefactoringCatalogPayload", () => {
  it("returns the encoded Refactoring Guru catalog", () => {
    const payload = createRefactoringCatalogPayload();

    expect(payload.total).toBeGreaterThan(20);
    expect(payload.categories).toHaveLength(6);
    expect(payload.items[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      referenceUrl: expect.stringContaining("refactoring.guru")
    });
  });
});

describe("buildRefactoringAnalysisResult", () => {
  it("detects spaghetti smells and recommends composing-method techniques", () => {
    const diagnosis = diagnoseFromInput({
      repoName: "Legacy App",
      repoSummary: "spaghetti ball of mud legacy helpers",
      requestedOutcome: "review structure"
    });
    const result = buildRefactoringAnalysisResult(diagnosis, {
      repoSummary: "spaghetti ball of mud legacy helpers",
      requestedOutcome: "review structure"
    });

    expect(result.detectedSmells.some((smell) => smell.id === "spaghetti-structure")).toBe(true);
    expect(result.recommendedTechniques.length).toBeGreaterThan(0);
    expect(result.recommendedTechniques[0]?.technique.referenceUrl).toContain("refactoring.guru");
    expect(result.autoRefactorAllowed).toBe(false);
    expect(result.orchestrationPlan[0]?.id).toBe("assess");
  });

  it("limits orchestration to assess and verify when unhealthy and no refactor intent", () => {
    const diagnosis = diagnoseFromInput({
      repoSummary: "spaghetti drift unhealthy legacy",
      requestedOutcome: "diagnose only"
    });
    const result = buildRefactoringAnalysisResult(diagnosis, {
      repoSummary: "spaghetti drift unhealthy legacy",
      requestedOutcome: "diagnose only"
    });

    expect(result.orchestrationPlan.map((phase) => phase.id)).toEqual(["assess", "verify"]);
  });

  it("expands orchestration when explicit refactor intent is provided", () => {
    const diagnosis = diagnoseFromInput({
      repoSummary: "modular monolith with some drift",
      requestedOutcome: "refactor boundaries"
    });
    const result = buildRefactoringAnalysisResult(diagnosis, {
      repoSummary: "modular monolith with some drift",
      requestedOutcome: "refactor boundaries",
      explicitRefactorIntent: true
    });

    expect(result.orchestrationPlan.length).toBeGreaterThan(2);
  });

  it("creates cursor guidance aligned with policy guardrails", () => {
    const diagnosis = diagnoseFromInput({ repoSummary: "vertical slice monorepo" });
    const result = buildRefactoringAnalysisResult(diagnosis, { repoSummary: "vertical slice monorepo" });
    const guidance = createRefactoringCursorGuidance(result);

    expect(guidance.some((line) => line.includes("Auto-refactor allowed: false"))).toBe(true);
    expect(guidance.some((line) => line.includes("Do not auto-refactor"))).toBe(true);
  });
});
