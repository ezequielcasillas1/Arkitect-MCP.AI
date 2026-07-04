import type { DiagnosisResult } from "./diagnosis.js";

export type RefactoringTechniqueCategory =
  | "composing-methods"
  | "moving-features"
  | "organizing-data"
  | "simplifying-conditionals"
  | "simplifying-method-calls"
  | "dealing-with-generalization";

export type RefactoringSmellId =
  | "long-methods"
  | "duplicate-code"
  | "god-class"
  | "feature-envy"
  | "spaghetti-structure"
  | "architectural-drift"
  | "primitive-obsession"
  | "switch-statements"
  | "deep-inheritance"
  | "tight-coupling"
  | "mixed-responsibilities";

export interface RefactoringTechnique {
  id: string;
  name: string;
  category: RefactoringTechniqueCategory;
  categoryLabel: string;
  summary: string;
  referenceUrl: string;
  addressesSmells: RefactoringSmellId[];
}

export interface RefactoringSmell {
  id: RefactoringSmellId;
  label: string;
  summary: string;
  confidence: number;
  rationale: string;
}

export interface RefactoringTechniqueRecommendation {
  technique: RefactoringTechnique;
  priority: "high" | "medium" | "low";
  rationale: string;
  triggeredBySmells: RefactoringSmellId[];
}

export interface RefactoringOrchestrationPhase {
  id: string;
  label: string;
  summary: string;
  agentActions: string[];
  techniqueIds: string[];
}

export interface RefactoringAnalysisInput {
  repoPath?: string;
  repoName?: string;
  repoSummary?: string;
  requestedOutcome?: string;
  category?: RefactoringTechniqueCategory;
  explicitRefactorIntent?: boolean;
}

export interface RefactoringAnalysisResult {
  summary: string;
  repoPath: string;
  autoRefactorAllowed: false;
  requiresExplicitIntent: true;
  detectedSmells: RefactoringSmell[];
  recommendedTechniques: RefactoringTechniqueRecommendation[];
  orchestrationPlan: RefactoringOrchestrationPhase[];
  diagnosisContext: Pick<
    DiagnosisResult,
    "signals" | "decision" | "patternGuidance"
  >;
  referenceBaseUrl: string;
}

export interface RefactoringMcpPayload {
  summary: string;
  analysis: RefactoringAnalysisResult;
  cursorGuidance: string[];
}

export interface RefactoringCatalogMcpPayload {
  summary: string;
  total: number;
  categories: Array<{
    id: RefactoringTechniqueCategory;
    label: string;
    techniqueCount: number;
  }>;
  items: RefactoringTechnique[];
}
