import type {
  ArchitectureCatalogEntry,
  CatalogMcpPayload,
  DesignPatternCatalogEntry,
  DiagnosisIntake,
  DiagnosisResult,
  LibraryMcpPayload,
  RefactoringAnalysisInput,
  RemixProfileCatalogEntry
} from "@arkitect/contracts";
import type { WorkbenchIntakeApplyRequest } from "@arkitect/contracts";
import type {
  PatternIntelligenceLookupRequest,
  PatternRecommendationRequest
} from "@arkitect/contracts";
import {
  buildRefactoringAnalysisResult,
  createDiagnosisResult,
  createRefactoringCatalogPayload,
  defaultArchitecturePolicy,
  getCatalogCounts,
  listArchitectureCatalog,
  listDesignPatternCatalog,
  listDesignPrinciples,
  listDiagnosisStrategies,
  listRemixProfileCatalog,
  lookupPatternIntelligence,
  recommendPatterns,
  buildRequirementTagSuggestionInput,
  suggestRequirementTags,
  createDiagnosisSignals,
  mergeDiagnosisIntake,
  runCodebaseVerification,
  runRepoTests,
  buildTestingForArkApplyRequest,
  resolveWorkbenchApplyRequest
} from "@arkitect/core";
import { normalizeWorkbenchIntakeRequest } from "./workbench-intake-normalize.js";
import { postWorkbenchIntake } from "./desktop-bridge-client.js";
import { MockRepositoryAnalyzer } from "@arkitect/repo-analyzer";
import { toDiagnosisMcpPayload } from "./diagnosis-payload.js";
import { toRefactoringMcpPayload } from "./refactoring-payload.js";
import {
  assembleMcpServer,
  createMcpResources,
  createMcpToolTemplates,
  type ArkitectMcpServer
} from "./mcp-tool-definitions.js";

export type { ArkitectMcpServer };
export { toDiagnosisMcpPayload, toRefactoringMcpPayload };

const analyzer = new MockRepositoryAnalyzer();
let lastDiagnosis: DiagnosisResult | null = null;
let lastRefactoringAnalysis: ReturnType<typeof toRefactoringMcpPayload> | null = null;

function mergeIntake(partial: Partial<DiagnosisIntake>): DiagnosisIntake {
  return mergeDiagnosisIntake(partial);
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

export async function analyzeRefactoring(input: RefactoringAnalysisInput = {}) {
  const intake = mergeIntake(input as Partial<DiagnosisIntake>);
  const mergedInput = {
    ...input,
    repoPath: input.repoPath?.trim() || process.env.ARKITECT_DEFAULT_REPO_PATH?.trim() || process.cwd()
  };
  const autoDetections = await analyzer.analyze(intake);
  const diagnosis = createDiagnosisResult(intake, autoDetections);
  const result = buildRefactoringAnalysisResult(diagnosis, mergedInput, mergedInput.repoPath);
  const payload = toRefactoringMcpPayload(result);
  lastRefactoringAnalysis = payload;
  return payload;
}

function toDesignPrinciplesPayload() {
  const items = listDesignPrinciples();
  return {
    summary: `Arkitect exposes ${items.length} design principles (SOLID plus general OO principles) sourced from Refactoring Guru for pattern orchestration.`,
    total: items.length,
    items
  };
}

export function createArkitectMcpServer(): ArkitectMcpServer {
  const counts = {
    ...getCatalogCounts(),
    refactoringTechniques: createRefactoringCatalogPayload().total,
    designPrinciples: listDesignPrinciples().length
  };
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
    },
    list_refactoring_techniques: async (input) => {
      const category = (input as { category?: RefactoringAnalysisInput["category"] }).category;
      const payload = createRefactoringCatalogPayload();
      if (category) {
        return createJsonToolResult({
          ...payload,
          items: payload.items.filter((entry) => entry.category === category),
          total: payload.items.filter((entry) => entry.category === category).length
        });
      }
      return createJsonToolResult(payload);
    },
    analyze_refactoring_opportunities: async (input) => {
      const result = await analyzeRefactoring(input as RefactoringAnalysisInput);
      return createJsonToolResult(result);
    },
    get_pattern_intelligence: async (input) => {
      const result = lookupPatternIntelligence((input as PatternIntelligenceLookupRequest) ?? {});
      return createJsonToolResult(result);
    },
    list_design_principles: async () => createJsonToolResult(toDesignPrinciplesPayload()),
    recommend_patterns: async (input) => {
      const result = recommendPatterns((input as PatternRecommendationRequest) ?? {});
      return createJsonToolResult(result);
    },
    apply_workbench_intake: async (input) => {
      const request = resolveWorkbenchApplyRequest(normalizeWorkbenchIntakeRequest(input as Record<string, unknown>));
      const merged = mergeIntake(request.intake);
      const bridgeResponse = await postWorkbenchIntake({
        ...request,
        source: request.source ?? "mcp-tool",
        intake: merged
      });

      return createJsonToolResult({
        summary: bridgeResponse.message,
        desktopApplied: bridgeResponse.ok,
        appliedAt: bridgeResponse.appliedAt,
        intake: {
          routeSource: merged.routeSource,
          repoPath: merged.repoPath,
          repoName: merged.repoName,
          repoSummary: merged.repoSummary,
          requestedOutcome: merged.requestedOutcome,
          executionMode: merged.executionMode,
          executionPermission: merged.executionPermission,
          catalogPreferences: merged.catalogPreferences,
          userInput: merged.userInput
        },
        markStepsReviewed: request.markStepsReviewed,
        autoRun: request.autoRun,
        saveAsPreset: request.saveAsPreset,
        advanceToStep: request.advanceToStep,
        examplePreset: buildTestingForArkApplyRequest(),
        cursorGuidance: bridgeResponse.ok
          ? [
              "Desktop workbench intake applied. Review prefilled steps in Arkitect Desktop.",
              "When autoRun is enabled, Desktop runs diagnosis + verify and lands on Results.",
              "API keys are read from Desktop session storage only — never send keys via MCP.",
              "Use saveAsPreset to persist a reusable workbench preset such as Testing for ARK."
            ]
          : [
              "Start Arkitect Desktop and keep the MCP bridge listening, then retry apply_workbench_intake.",
              "Alternatively paste the intake JSON into the desktop Import from MCP panel."
            ]
      });
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
    case "arkitect://catalog/refactoring":
      return createRefactoringCatalogPayload();
    case "arkitect://catalog/design-principles":
      return toDesignPrinciplesPayload();
    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
}
