import { readFileSync } from "node:fs";
import type {
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

interface DiagnoseWorkerRequest {
  type: "diagnose";
  facts: AiDiagnosisFactsBundle;
  credentials: AiProviderCredentials;
  apiKey: string;
  repoPath: string;
}

function extractAssistantText(result: { result?: string | null; status?: string }) {
  return result.result?.trim() ?? "";
}

async function runDiagnose(request: DiagnoseWorkerRequest): Promise<AiDiagnosisEnrichment> {
  const started = Date.now();
  const modelId = resolveCursorModelId(request.credentials.modelName);
  const prompt = buildDiagnosisPrompt(request.facts);
  const { Agent } = await import("@cursor/sdk");

  const result = await Agent.prompt(prompt, {
    apiKey: request.apiKey,
    model: { id: modelId },
    local: { cwd: request.repoPath }
  });

  if (result.status === "error") {
    return createErrorEnrichment(
      request.credentials.preferredProvider,
      request.credentials.modelName,
      "provider_error",
      "Cursor agent run failed before producing a diagnosis."
    );
  }

  const raw = extractAssistantText(result);
  const parsed = parseAiDiagnosisResponse(raw);

  if (!parsed) {
    return createErrorEnrichment(
      request.credentials.preferredProvider,
      request.credentials.modelName,
      "parse_error",
      "Could not parse AI diagnosis JSON from model response."
    );
  }

  return mergeAiEnrichment(request.facts.ruleDecision.warnings, request.facts.ruleDecision.nextSteps, {
    status: "success",
    provider: request.credentials.preferredProvider,
    modelName: request.credentials.modelName,
    summary: parsed.summary,
    reasoning: parsed.reasoning,
    nextActions: parsed.nextActions,
    latencyMs: Date.now() - started,
    generatedAt: new Date().toISOString()
  });
}

async function main() {
  const request = JSON.parse(readFileSync(0, "utf8")) as DiagnoseWorkerRequest;

  if (request.type !== "diagnose") {
    throw new Error(`Unsupported cursor-sdk-worker request: ${(request as { type?: string }).type ?? "unknown"}`);
  }

  const enrichment = await runDiagnose(request);
  process.stdout.write(JSON.stringify(enrichment));
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Cursor SDK worker failed.";
  process.stdout.write(
    JSON.stringify(
      createErrorEnrichment("composer-2.5", "composer-2.5", "provider_error", message)
    )
  );
  process.exit(1);
});
