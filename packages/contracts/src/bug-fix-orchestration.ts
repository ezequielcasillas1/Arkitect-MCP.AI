import type { DiagnosisResult } from "./diagnosis.js";

export type BugSymptomCategory =
  | "runtime-error"
  | "logic-defect"
  | "regression"
  | "integration-failure"
  | "performance"
  | "configuration"
  | "flaky-test"
  | "unknown";

export type RootCauseCategory =
  | "incorrect-assumption"
  | "missing-guard"
  | "stale-contract"
  | "race-or-timing"
  | "dependency-mismatch"
  | "config-drift"
  | "state-corruption"
  | "architectural-boundary-leak"
  | "test-gap"
  | "unknown";

export interface BugEvidenceItem {
  id: string;
  kind: "log" | "stack" | "test-failure" | "signal" | "intake" | "repro";
  summary: string;
  confidence: number;
  source?: string;
}

export interface RootCauseCandidate {
  id: string;
  category: RootCauseCategory;
  label: string;
  summary: string;
  confidence: number;
  supportingEvidenceIds: string[];
  falsificationChecks: string[];
}

/** Structured portrait produced by the root-cause portraiture power unit. */
export interface RootCausePortrait {
  id: string;
  title: string;
  symptomCategory: BugSymptomCategory;
  symptomSummary: string;
  primaryCause: RootCauseCandidate;
  contributingCauses: RootCauseCandidate[];
  evidence: BugEvidenceItem[];
  blastRadius: "local" | "module" | "service" | "system";
  confidence: number;
  nextProbes: string[];
  portraitNarrative: string;
}

export interface BugFixStrategy {
  id: string;
  name: string;
  summary: string;
  addressesCategories: RootCauseCategory[];
  agentActions: string[];
}

export interface BugFixStrategyRecommendation {
  strategy: BugFixStrategy;
  priority: "high" | "medium" | "low";
  rationale: string;
  triggeredByCauseIds: string[];
}

export interface BugFixOrchestrationPhase {
  id: string;
  label: string;
  summary: string;
  agentActions: string[];
  strategyIds: string[];
  powerUnit?: "root-cause-portraiture";
}

export interface BugFixOrchestrationInput {
  repoPath?: string;
  repoName?: string;
  repoSummary?: string;
  requestedOutcome?: string;
  errorMessage?: string;
  stackTrace?: string;
  failingTests?: string[];
  reproductionSteps?: string;
  explicitFixIntent?: boolean;
}

export interface RootCausePortraitInput extends BugFixOrchestrationInput {
  /** Optional free-form symptom text when errorMessage is not enough. */
  symptomText?: string;
}

export interface RootCausePortraitResult {
  summary: string;
  repoPath: string;
  portrait: RootCausePortrait;
  diagnosisContext: Pick<DiagnosisResult, "signals" | "decision" | "patternGuidance">;
}

export interface BugFixOrchestrationResult {
  summary: string;
  repoPath: string;
  autoFixAllowed: false;
  requiresExplicitIntent: true;
  portrait: RootCausePortrait;
  recommendedStrategies: BugFixStrategyRecommendation[];
  orchestrationPlan: BugFixOrchestrationPhase[];
  diagnosisContext: Pick<DiagnosisResult, "signals" | "decision" | "patternGuidance">;
}

export interface RootCausePortraitMcpPayload {
  summary: string;
  portrait: RootCausePortrait;
  diagnosisContext: RootCausePortraitResult["diagnosisContext"];
  cursorGuidance: string[];
}

export interface BugFixOrchestrationMcpPayload {
  summary: string;
  analysis: BugFixOrchestrationResult;
  cursorGuidance: string[];
}
