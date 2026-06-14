import type {
  AiConnectionTestResult,
  AiDiagnosisEnrichment,
  AiDiagnosisFactsBundle,
  AiProviderCredentials
} from "@arkitect/contracts";
import { DEFAULT_MODEL_ID } from "./constants.js";
import { mergeAiEnrichment } from "./diagnosis-prompt.js";

export function createMockConnectionResult(
  credentials: AiProviderCredentials,
  latencyMs = 120
): AiConnectionTestResult {
  return {
    ok: true,
    connected: true,
    provider: credentials.preferredProvider,
    modelName: credentials.modelName || DEFAULT_MODEL_ID,
    resolvedModelId: credentials.modelName || DEFAULT_MODEL_ID,
    message: "Mock connection succeeded (arkitect-mock key). Use a real Cursor API Key for live model access.",
    code: "mock_success",
    latencyMs
  };
}

export function createMockDiagnosisEnrichment(
  facts: AiDiagnosisFactsBundle,
  credentials: AiProviderCredentials,
  latencyMs = 280
): AiDiagnosisEnrichment {
  const enrichment = mergeAiEnrichment(facts.ruleDecision.warnings, facts.ruleDecision.nextSteps, {
    status: "success",
    provider: credentials.preferredProvider,
    modelName: credentials.modelName || DEFAULT_MODEL_ID,
    summary: `Mock AI review for ${facts.repo.name}: continue the ${facts.detections.currentArchitecture} path with ${facts.ruleDecision.recommendedAction}.`,
    reasoning: [
      `Repo health is ${facts.detections.repoHealth}; rule engine recommends ${facts.ruleDecision.recommendedAction}.`,
      `Top architecture candidate: ${facts.catalog.architectureCandidates[0]?.id ?? "none yet"}.`,
      "This response used the arkitect-mock key — swap in a real Cursor API Key for live Composer reasoning."
    ],
    nextActions: [
      ...facts.ruleDecision.nextSteps.slice(0, 2),
      "Confirm execution permission before applying structural changes."
    ],
    latencyMs,
    generatedAt: new Date().toISOString()
  });

  return enrichment;
}
