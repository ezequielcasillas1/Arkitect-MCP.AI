import type {
  ArchitectureCatalogEntry,
  CatalogMcpPayload,
  DesignPatternCatalogEntry,
  DiagnosisIntake,
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
import { toDiagnosisMcpPayload } from "./diagnosis-payload.js";
import {
  assembleMcpServer,
  createMcpResources,
  createMcpToolTemplates,
  type ArkitectMcpServer
} from "./mcp-tool-definitions.js";

export type { ArkitectMcpServer };
export { toDiagnosisMcpPayload };

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
  const resources = createMcpResources(counts);
  const executeByName: Record<string, (input: unknown) => Promise<ReturnType<typeof createJsonToolResult>>> = {
    diagnose_repository: async (input) => {
      const result = await diagnoseRepository(input as Partial<DiagnosisIntake>);
      return createJsonToolResult(toDiagnosisMcpPayload(result));
    },
    get_last_diagnosis: async () => {
      const result = lastDiagnosis ?? (await diagnoseRepository());
      return createJsonToolResult(toDiagnosisMcpPayload(result));
    },
    list_architecture_catalog: async () => createJsonToolResult(toArchitectureCatalogPayload()),
    list_remix_profiles: async () => createJsonToolResult(toRemixCatalogPayload()),
    list_design_patterns: async () => createJsonToolResult(toPatternCatalogPayload()),
    suggest_requirement_tags: async (input) =>
      createJsonToolResult(await suggestRequirementTagsForIntake(input as Partial<DiagnosisIntake>)),
    list_diagnosis_strategies: async () =>
      createJsonToolResult({
        summary: "Arkitect diagnosis strategies used for healthy continuation, guardrails, and pattern deferral.",
        total: listDiagnosisStrategies().length,
        items: listDiagnosisStrategies()
      }),
    verify_codebase: async (input) => {
      const result = await verifyCodebase(input as { repoPath?: string });
      return createJsonToolResult(result);
    },
    run_tests: async (input) => {
      const result = await runTests(input as { repoPath?: string });
      return createJsonToolResult(result);
    },
    run_test_suite: async (input) => {
      const result = await runTestSuite(input as { repoPath?: string; suite?: "unit" | "integration" | "all" });
      return createJsonToolResult(result);
    }
  };
  const tools = createMcpToolTemplates().map((template) => ({
    ...template,
    execute: async (input: unknown) => executeByName[template.name](input)
  }));

  return assembleMcpServer(tools, resources);
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
