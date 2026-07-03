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
  listRemixProfileCatalog,
  buildRequirementTagSuggestionInput,
  suggestRequirementTags,
  createDiagnosisSignals,
  runCodebaseVerification,
  runRepoTests
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
  const topSuggestions = result.requirementTagSuggestions.slice(0, 4).map((item) => item.tag);

  return [
    `Detected platform: ${result.signals.platformType.final.value}`,
    `Detected architecture: ${result.signals.currentArchitecture.final.value}`,
    `Repo health: ${result.signals.repoHealth.final.value}`,
    `Recommended action: ${result.decision.recommendedAction}`,
    `Selected architecture path: ${result.decision.selectedArchitectureId ?? "not yet stable"}`,
    `Selected remix profile: ${result.decision.selectedRemixId ?? "auto-ranked only"}`,
    `Suggested requirement tags: ${topSuggestions.length > 0 ? topSuggestions.join(", ") : "none yet"}`,
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

export async function suggestRequirementTagsForIntake(input: Partial<DiagnosisIntake> = {}) {
  const intake = mergeIntake(input);
  const autoDetections = await analyzer.analyze(intake);
  const signals = createDiagnosisSignals(autoDetections, intake.userInput);
  const suggestions = suggestRequirementTags(buildRequirementTagSuggestionInput(intake, signals));

  return {
    summary: `Arkitect suggested ${suggestions.length} requirement tags from repo scope and diagnosis signals.`,
    suggestions,
    appliedTags: intake.catalogPreferences.requirementTags
  };
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

const verifyToolInputSchema = {
  type: "object",
  properties: {
    repoPath: { type: "string" }
  }
};

const verifyToolOutputSchema = {
  type: "object",
  properties: {
    ok: { type: "boolean" },
    repoPath: { type: "string" },
    command: { type: "string" },
    summary: { type: "string" },
    steps: { type: "array", items: { type: "object" } },
    hint: { type: "string" }
  }
};

const testToolInputSchema = {
  type: "object",
  properties: {
    repoPath: { type: "string" }
  }
};

const testSuiteToolInputSchema = {
  type: "object",
  properties: {
    repoPath: { type: "string" },
    suite: { type: "string", enum: ["unit", "integration", "all"] }
  }
};

const testToolOutputSchema = {
  type: "object",
  properties: {
    ok: { type: "boolean" },
    repoPath: { type: "string" },
    suite: { type: "string" },
    command: { type: "string" },
    summary: { type: "string" },
    steps: { type: "array", items: { type: "object" } },
    hint: { type: "string" }
  }
};

function resolveDefaultRepoPath(input?: { repoPath?: string }): string {
  return input?.repoPath?.trim() || process.env.ARKITECT_DEFAULT_REPO_PATH?.trim() || process.cwd();
}

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

export async function verifyCodebase(input: { repoPath?: string } = {}) {
  const repoPath = resolveDefaultRepoPath(input);
  return runCodebaseVerification({ repoPath });
}

export async function runTests(input: { repoPath?: string } = {}) {
  const repoPath = resolveDefaultRepoPath(input);
  return runRepoTests({ repoPath, suite: "all" });
}

export async function runTestSuite(input: { repoPath?: string; suite?: "unit" | "integration" | "all" } = {}) {
  const repoPath = resolveDefaultRepoPath(input);
  return runRepoTests({ repoPath, suite: input.suite ?? "all" });
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
      name: "suggest_requirement_tags",
      description: "Suggest requirement tags from repo inspection, intake scope, and diagnosis signals.",
      inputSchema: diagnosisToolInputSchema,
      outputSchema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          suggestions: { type: "array", items: { type: "object" } },
          appliedTags: { type: "array", items: { type: "string" } }
        }
      },
      execute: async (input) => createJsonToolResult(await suggestRequirementTagsForIntake(input as Partial<DiagnosisIntake>))
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
    },
    {
      name: "verify_codebase",
      description:
        "Run the full verify pipeline: pnpm lint, build, typecheck, and test from a repo root. Use the connected local path — not a system folder like C:\\Windows\\System32.",
      inputSchema: verifyToolInputSchema,
      outputSchema: verifyToolOutputSchema,
      execute: async (input) => {
        const result = await verifyCodebase(input as { repoPath?: string });
        return createJsonToolResult(result);
      }
    },
    {
      name: "run_tests",
      description:
        "Run unit and integration tests only (pnpm test) from a repo root. Returns structured pass/fail, step output tails, and summary.",
      inputSchema: testToolInputSchema,
      outputSchema: testToolOutputSchema,
      execute: async (input) => {
        const result = await runTests(input as { repoPath?: string });
        return createJsonToolResult(result);
      }
    },
    {
      name: "run_test_suite",
      description:
        "Run a specific test suite from a repo root: unit (test:unit), integration (test:integration), or all (test). Returns structured JSON with steps and output tails.",
      inputSchema: testSuiteToolInputSchema,
      outputSchema: testToolOutputSchema,
      execute: async (input) => {
        const result = await runTestSuite(input as { repoPath?: string; suite?: "unit" | "integration" | "all" });
        return createJsonToolResult(result);
      }
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
