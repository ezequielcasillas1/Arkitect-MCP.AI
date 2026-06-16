import type {
  ArchitectureCatalogEntry,
  ArkitectMcpResource,
  ArkitectMcpToolDefinition,
  CatalogMcpPayload,
  DesignPatternCatalogEntry,
  DiagnosisIntake,
  DiagnosisMcpPayload,
  DiagnosisResult,
  LibraryMcpPayload,
  RemixProfileCatalogEntry
} from "@arkitect/contracts";
import {
  createDefaultIntake,
  createDiagnosisResult,
  defaultArchitecturePolicy,
  getCatalogCounts,
  listArchitectureCatalog,
  listDesignPatternCatalog,
  listDiagnosisStrategies,
  listRemixProfileCatalog
} from "@arkitect/core";
import { MockRepositoryAnalyzer } from "@arkitect/repo-analyzer";

export interface ArkitectMcpServer {
  info: {
    name: string;
    version: string;
    description: string;
  };
  tools: ArkitectMcpToolDefinition[];
  resources: ArkitectMcpResource[];
}

const analyzer = new MockRepositoryAnalyzer();
let lastDiagnosis: DiagnosisResult | null = null;

function mergeIntake(partial: Partial<DiagnosisIntake>): DiagnosisIntake {
  const defaults = createDefaultIntake(partial.repoPath);

  return {
    ...defaults,
    ...partial,
    ai: partial.ai ?? defaults.ai,
    userInput: partial.userInput ? { ...defaults.userInput, ...partial.userInput } : defaults.userInput,
    catalogPreferences: partial.catalogPreferences
      ? {
          ...defaults.catalogPreferences,
          ...partial.catalogPreferences,
          requirementTags: partial.catalogPreferences.requirementTags ?? defaults.catalogPreferences.requirementTags
        }
      : defaults.catalogPreferences
  };
}

function createCursorGuidance(result: DiagnosisResult): string[] {
  return [
    `Detected platform: ${result.signals.platformType.final.value}`,
    `Detected architecture: ${result.signals.currentArchitecture.final.value}`,
    `Repo health: ${result.signals.repoHealth.final.value}`,
    `Recommended action: ${result.decision.recommendedAction}`,
    `Selected architecture path: ${result.decision.selectedArchitectureId ?? "not yet stable"}`,
    `Selected remix profile: ${result.decision.selectedRemixId ?? "auto-ranked only"}`,
    `Active strategies: ${result.decision.appliedStrategies.join(", ")}`,
    "Honor overrides before applying any structural changes.",
    "Do not auto-refactor spaghetti structure without explicit migration or refactor intent."
  ];
}

export function toDiagnosisMcpPayload(result: DiagnosisResult): DiagnosisMcpPayload {
  return {
    summary: `${result.intake.repoName} is ready for diagnosis-first architecture guidance with dashboard-visible detections and permission-aware execution.`,
    diagnosis: result,
    cursorGuidance: createCursorGuidance(result)
  };
}

function toArchitectureCatalogPayload(): CatalogMcpPayload<ArchitectureCatalogEntry> {
  const items = listArchitectureCatalog();
  return {
    summary: `Arkitect exposes ${items.length} encoded architecture entries for recommendation and diagnosis.`,
    total: items.length,
    items
  };
}

function toRemixCatalogPayload(): CatalogMcpPayload<RemixProfileCatalogEntry> {
  const items = listRemixProfileCatalog();
  return {
    summary: `Arkitect exposes ${items.length} remix profiles composed from the supported architecture and pattern library.`,
    total: items.length,
    items
  };
}

function toPatternCatalogPayload(): CatalogMcpPayload<DesignPatternCatalogEntry> {
  const items = listDesignPatternCatalog();
  return {
    summary: `Arkitect exposes ${items.length} design patterns across creational, structural, and behavioral families.`,
    total: items.length,
    items
  };
}

export function toLibraryMcpPayload(): LibraryMcpPayload {
  return {
    architectures: toArchitectureCatalogPayload(),
    remixProfiles: toRemixCatalogPayload(),
    designPatterns: toPatternCatalogPayload()
  };
}

export async function diagnoseRepository(input: Partial<DiagnosisIntake> = {}): Promise<DiagnosisResult> {
  const intake = mergeIntake(input);
  const autoDetections = await analyzer.analyze(intake);
  const result = createDiagnosisResult(intake, autoDetections);
  lastDiagnosis = result;

  return result;
}

const diagnosisToolInputSchema = {
  type: "object",
  properties: {
    repoPath: { type: "string" },
    repoName: { type: "string" },
    repoSummary: { type: "string" },
    requestedOutcome: { type: "string" },
    catalogPreferences: {
      type: "object",
      properties: {
        selectedRemixId: { type: "string" },
        complexityProfile: { type: "string" },
        requirementTags: { type: "array", items: { type: "string" } }
      }
    }
  }
};

const diagnosisToolOutputSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    diagnosis: { type: "object" },
    cursorGuidance: { type: "array", items: { type: "string" } }
  }
};

const catalogToolOutputSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    total: { type: "number" },
    items: { type: "array", items: { type: "object" } }
  }
};

function createJsonToolResult(json: unknown) {
  return {
    content: [
      {
        type: "json" as const,
        json
      }
    ]
  };
}

export function createArkitectMcpServer(): ArkitectMcpServer {
  const counts = getCatalogCounts();
  const resources: ArkitectMcpResource[] = [
    {
      uri: "arkitect://diagnosis/latest",
      name: "Latest Diagnosis Result",
      description: "Last diagnosis result payload exposed for MCP-aware clients like Cursor."
    },
    {
      uri: "arkitect://policy/default",
      name: "Default Architecture Policy",
      description: "The default architecture-first Arkitect policy for healthy and unhealthy repos."
    },
    {
      uri: "arkitect://catalog/architectures",
      name: "Architecture Catalog",
      description: `The ${counts.architectures}-entry Arkitect architecture library.`
    },
    {
      uri: "arkitect://catalog/remixes",
      name: "Remix Profile Catalog",
      description: `The ${counts.remixProfiles}-entry Arkitect remix profile library.`
    },
    {
      uri: "arkitect://catalog/patterns",
      name: "Design Pattern Catalog",
      description: `The ${counts.designPatterns}-entry Arkitect design pattern library.`
    }
  ];

  const tools: ArkitectMcpToolDefinition[] = [
    {
      name: "diagnose_repository",
      description: "Analyze intake signals, apply Arkitect policy, and expose an MCP-friendly diagnosis payload.",
      inputSchema: diagnosisToolInputSchema,
      outputSchema: diagnosisToolOutputSchema,
      execute: async (input) => {
        const result = await diagnoseRepository(input as Partial<DiagnosisIntake>);
        return createJsonToolResult(toDiagnosisMcpPayload(result));
      }
    },
    {
      name: "get_last_diagnosis",
      description: "Return the most recent diagnosis payload that Arkitect exposed to MCP clients.",
      inputSchema: { type: "object", properties: {} },
      outputSchema: diagnosisToolOutputSchema,
      execute: async () => {
        const result = lastDiagnosis ?? (await diagnoseRepository());
        return createJsonToolResult(toDiagnosisMcpPayload(result));
      }
    },
    {
      name: "list_architecture_catalog",
      description: "Return the encoded Arkitect architecture catalog with metadata and affinity fields.",
      inputSchema: { type: "object", properties: {} },
      outputSchema: catalogToolOutputSchema,
      execute: async () => createJsonToolResult(toArchitectureCatalogPayload())
    },
    {
      name: "list_remix_profiles",
      description: "Return Arkitect remix profiles with composed architectures, patterns, and rationale.",
      inputSchema: { type: "object", properties: {} },
      outputSchema: catalogToolOutputSchema,
      execute: async () => createJsonToolResult(toRemixCatalogPayload())
    },
    {
      name: "list_design_patterns",
      description: "Return Arkitect's design pattern catalog grouped by family with fit metadata.",
      inputSchema: { type: "object", properties: {} },
      outputSchema: catalogToolOutputSchema,
      execute: async () => createJsonToolResult(toPatternCatalogPayload())
    },
    {
      name: "list_diagnosis_strategies",
      description: "Return the diagnosis and continuation strategies Arkitect applies during recommendation.",
      inputSchema: { type: "object", properties: {} },
      outputSchema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          total: { type: "number" },
          items: { type: "array", items: { type: "object" } }
        }
      },
      execute: async () =>
        createJsonToolResult({
          summary: "Arkitect diagnosis strategies used for healthy continuation, guardrails, and pattern deferral.",
          total: listDiagnosisStrategies().length,
          items: listDiagnosisStrategies()
        })
    }
  ];

  return {
    info: {
      name: "arkitect-mcp",
      version: "0.1.0",
      description: "Scaffolded Arkitect MCP surface for diagnosis-first architecture context."
    },
    tools,
    resources
  };
}

export const arkitectMcpServer = createArkitectMcpServer();

export async function readArkitectMcpResource(uri: string): Promise<unknown> {
  switch (uri) {
    case "arkitect://diagnosis/latest": {
      const result = lastDiagnosis ?? (await diagnoseRepository());
      return toDiagnosisMcpPayload(result);
    }
    case "arkitect://policy/default":
      return defaultArchitecturePolicy;
    case "arkitect://catalog/architectures":
      return toArchitectureCatalogPayload();
    case "arkitect://catalog/remixes":
      return toRemixCatalogPayload();
    case "arkitect://catalog/patterns":
      return toPatternCatalogPayload();
    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
}
