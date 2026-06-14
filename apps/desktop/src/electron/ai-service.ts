import type {
  AiConnectionTestResult,
  AiDiagnosisEnrichment,
  AiDiagnosisFactsBundle,
  AiProviderCredentials
} from "@arkitect/contracts";
import { createProviderAdapter } from "@arkitect/ai";
import { runCursorDiagnosis, testCursorConnection } from "./ai-runner.js";

const aiAdapter = createProviderAdapter({
  testCursorConnection,
  runCursorDiagnosis
});

export function testAiConnection(credentials: AiProviderCredentials): Promise<AiConnectionTestResult> {
  return aiAdapter.testConnection(credentials);
}

export function runAiDiagnosis(
  facts: AiDiagnosisFactsBundle,
  credentials: AiProviderCredentials,
  repoPath: string
): Promise<{ ok: boolean; enrichment?: AiDiagnosisEnrichment; error?: { code: string; message: string } }> {
  return aiAdapter.runDiagnosis(facts, credentials, repoPath);
}
