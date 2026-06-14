import type {
  AiConnectionTestResult,
  AiDiagnosisEnrichment,
  AiDiagnosisFactsBundle,
  AiDiagnosisRunResult,
  AiProviderCredentials
} from "@arkitect/contracts";
import { validateCredentialsForProvider, isMockApiKey } from "./credentials.js";
import { createSkippedEnrichment } from "./diagnosis-prompt.js";
import { createMockConnectionResult, createMockDiagnosisEnrichment } from "./mock-provider.js";

export interface AiProviderAdapter {
  testConnection(credentials: AiProviderCredentials): Promise<AiConnectionTestResult>;
  runDiagnosis(
    facts: AiDiagnosisFactsBundle,
    credentials: AiProviderCredentials,
    repoPath: string
  ): Promise<AiDiagnosisRunResult>;
}

export interface AiProviderAdapterDelegate {
  testCursorConnection(credentials: AiProviderCredentials, apiKey: string): Promise<AiConnectionTestResult>;
  runCursorDiagnosis(
    facts: AiDiagnosisFactsBundle,
    credentials: AiProviderCredentials,
    apiKey: string,
    repoPath: string
  ): Promise<AiDiagnosisEnrichment>;
  testBringYourOwnConnection?(
    credentials: AiProviderCredentials,
    apiKey: string
  ): Promise<AiConnectionTestResult>;
  runBringYourOwnDiagnosis?(
    facts: AiDiagnosisFactsBundle,
    credentials: AiProviderCredentials,
    apiKey: string
  ): Promise<AiDiagnosisEnrichment>;
}

export function createProviderAdapter(delegate: AiProviderAdapterDelegate): AiProviderAdapter {
  return {
    async testConnection(credentials) {
      const validation = validateCredentialsForProvider(credentials);

      if (!validation.ok) {
        return {
          ok: false,
          connected: false,
          provider: credentials.preferredProvider,
          modelName: credentials.modelName,
          message: validation.message,
          code: validation.code
        };
      }

      if (isMockApiKey(validation.apiKey)) {
        return createMockConnectionResult(credentials);
      }

      if (credentials.preferredProvider === "composer-2.5") {
        return delegate.testCursorConnection(credentials, validation.apiKey);
      }

      if (delegate.testBringYourOwnConnection) {
        return delegate.testBringYourOwnConnection(credentials, validation.apiKey);
      }

      return {
        ok: false,
        connected: false,
        provider: credentials.preferredProvider,
        modelName: credentials.modelName,
        message: `Provider ${credentials.preferredProvider} live adapter is not wired in this milestone.`,
        code: "unsupported_provider"
      };
    },

    async runDiagnosis(facts, credentials, repoPath) {
      const validation = validateCredentialsForProvider(credentials);

      if (!validation.ok) {
        return {
          ok: true,
          enrichment: createSkippedEnrichment(
            credentials.preferredProvider,
            credentials.modelName,
            validation.message
          )
        };
      }

      if (isMockApiKey(validation.apiKey)) {
        return {
          ok: true,
          enrichment: createMockDiagnosisEnrichment(facts, credentials)
        };
      }

      try {
        if (credentials.preferredProvider === "composer-2.5") {
          const enrichment = await delegate.runCursorDiagnosis(facts, credentials, validation.apiKey, repoPath);
          return { ok: enrichment.status !== "error", enrichment };
        }

        if (delegate.runBringYourOwnDiagnosis) {
          const enrichment = await delegate.runBringYourOwnDiagnosis(facts, credentials, validation.apiKey);
          return { ok: enrichment.status !== "error", enrichment };
        }

        return {
          ok: false,
          error: {
            code: "unsupported_provider",
            message: `Provider ${credentials.preferredProvider} live adapter is not wired in this milestone.`
          }
        };
      } catch (error) {
        return {
          ok: false,
          error: {
            code: "network_error",
            message: error instanceof Error ? error.message : "AI diagnosis request failed."
          }
        };
      }
    }
  };
}
