import type {
  AiConnectionErrorCode,
  AiConnectionTestResult,
  AiDiagnosisEnrichment,
  AiDiagnosisFactsBundle,
  AiProviderCredentials
} from "@arkitect/contracts";
import {
  buildDiagnosisPrompt,
  createErrorEnrichment,
  mergeAiEnrichment,
  parseAiDiagnosisResponse,
  resolveCursorModelId
} from "@arkitect/ai";

function mapCursorError(error: unknown): { code: AiConnectionErrorCode; message: string } {
  const message = error instanceof Error ? error.message : "Cursor SDK request failed.";

  if (/auth|api key|unauthorized|401|403/i.test(message)) {
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

function extractAssistantText(result: { result?: string | null; status?: string }): string {
  return result.result?.trim() ?? "";
}

export async function testCursorConnection(
  credentials: AiProviderCredentials,
  apiKey: string
): Promise<AiConnectionTestResult> {
  const started = Date.now();
  const modelId = resolveCursorModelId(credentials.modelName);

  try {
    const { Cursor } = await import("@cursor/sdk");
    const models = await Cursor.models.list({ apiKey });
    const resolved = models.find((model) => model.id === modelId) ?? models.find((model) => model.id.includes("composer"));

    if (!resolved) {
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
      resolvedModelId: resolved.id,
      message: `Connected to Cursor. Model ${resolved.id} is available.`,
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
  const started = Date.now();
  const modelId = resolveCursorModelId(credentials.modelName);
  const prompt = buildDiagnosisPrompt(facts);

  try {
    const { Agent } = await import("@cursor/sdk");
    const result = await Agent.prompt(prompt, {
      apiKey,
      model: { id: modelId },
      local: { cwd: repoPath }
    });

    if (result.status === "error") {
      return createErrorEnrichment(
        credentials.preferredProvider,
        credentials.modelName,
        "provider_error",
        "Cursor agent run failed before producing a diagnosis."
      );
    }

    const raw = extractAssistantText(result);
    const parsed = parseAiDiagnosisResponse(raw);

    if (!parsed) {
      return createErrorEnrichment(
        credentials.preferredProvider,
        credentials.modelName,
        "parse_error",
        "Could not parse AI diagnosis JSON from model response."
      );
    }

    return mergeAiEnrichment(facts.ruleDecision.warnings, facts.ruleDecision.nextSteps, {
      status: "success",
      provider: credentials.preferredProvider,
      modelName: credentials.modelName,
      summary: parsed.summary,
      reasoning: parsed.reasoning,
      nextActions: parsed.nextActions,
      latencyMs: Date.now() - started,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    const mapped = mapCursorError(error);

    return createErrorEnrichment(credentials.preferredProvider, credentials.modelName, mapped.code, mapped.message);
  }
}
