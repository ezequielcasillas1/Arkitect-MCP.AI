import type {
  AiConnectionErrorCode,
  AiConnectionTestResult,
  AiDiagnosisEnrichment,
  AiDiagnosisFactsBundle,
  AiProviderCredentials
} from "@arkitect/contracts";
import { resolveCursorModelId, createErrorEnrichment } from "@arkitect/ai";
import { listCursorModelsViaRest, resolveCursorModelFromList } from "./cursor-rest-client.js";
import { runCursorDiagnosisViaWorker } from "./cursor-sdk-spawn.js";

function mapCursorError(error: unknown): { code: AiConnectionErrorCode; message: string } {
  const message = error instanceof Error ? error.message : "Cursor SDK request failed.";

  if (/bindings file|node_sqlite3/i.test(message)) {
    return {
      code: "provider_error",
      message:
        "Cursor SDK native dependency is missing. Run pnpm install from the repo root, then restart Arkitect Desktop."
    };
  }

  if (/auth|api key|unauthorized|401|403|invalid cursor api key/i.test(message)) {
    return { code: "invalid_key", message };
  }

  if (/model|not found|unsupported|404/i.test(message)) {
    return { code: "model_unavailable", message };
  }

  if (/network|fetch|timeout|ECONN|ENOTFOUND/i.test(message)) {
    return { code: "network_error", message };
  }

  return { code: "provider_error", message };
}

export async function testCursorConnection(
  credentials: AiProviderCredentials,
  apiKey: string
): Promise<AiConnectionTestResult> {
  const started = Date.now();
  const modelId = resolveCursorModelId(credentials.modelName);

  try {
    const models = await listCursorModelsViaRest(apiKey);
    const resolvedModelId = resolveCursorModelFromList(models, modelId);

    if (!resolvedModelId) {
      return {
        ok: false,
        connected: false,
        provider: credentials.preferredProvider,
        modelName: credentials.modelName,
        message: `Model ${modelId} is not available on this Cursor account.`,
        code: "model_unavailable",
        latencyMs: Date.now() - started
      };
    }

    return {
      ok: true,
      connected: true,
      provider: credentials.preferredProvider,
      modelName: credentials.modelName,
      resolvedModelId,
      message: `Connected to Cursor. Model ${resolvedModelId} is available.`,
      latencyMs: Date.now() - started
    };
  } catch (error) {
    const mapped = mapCursorError(error);

    return {
      ok: false,
      connected: false,
      provider: credentials.preferredProvider,
      modelName: credentials.modelName,
      message: mapped.message,
      code: mapped.code,
      latencyMs: Date.now() - started
    };
  }
}

export async function runCursorDiagnosis(
  facts: AiDiagnosisFactsBundle,
  credentials: AiProviderCredentials,
  apiKey: string,
  repoPath: string
): Promise<AiDiagnosisEnrichment> {
  try {
    return await runCursorDiagnosisViaWorker({
      facts,
      credentials,
      apiKey,
      repoPath
    });
  } catch (error) {
    const mapped = mapCursorError(error);

    return createErrorEnrichment(
      credentials.preferredProvider,
      credentials.modelName,
      mapped.code,
      mapped.message
    );
  }
}
