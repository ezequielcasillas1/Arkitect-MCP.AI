import type {
  ArchitectureCatalogId,
  ArchitectureStyle,
  Detection,
  DiagnosisFieldValueMap,
  DiagnosisIntake,
  DiagnosisIntent,
  PlatformType,
  RepoInspection,
  RepoHealth,
  WorkloadType
} from "@arkitect/contracts";
import { listArchitectureCatalog } from "@arkitect/core";

export type AutoDetections = {
  [K in keyof DiagnosisFieldValueMap]: Detection<DiagnosisFieldValueMap[K]>;
};

export interface RepositoryAnalyzer {
  analyze(intake: DiagnosisIntake): Promise<AutoDetections>;
}

function levelFromConfidence(confidence: number): "low" | "medium" | "high" {
  if (confidence >= 0.86) {
    return "high";
  }

  if (confidence >= 0.62) {
    return "medium";
  }

  return "low";
}

function createDetection<T>(value: T, confidence: number, rationale: string): Detection<T> {
  return {
    value,
    confidence,
    level: levelFromConfidence(confidence),
    source: "auto-detected",
    rationale
  };
}

function includesAny(text: string, needles: string[]): boolean {
  return needles.some((needle) => text.includes(needle));
}

function hasAny(values: string[], needles: string[]): boolean {
  return needles.some((needle) => values.some((value) => value.toLowerCase().includes(needle)));
}

function toInspectionText(inspection?: RepoInspection): string {
  if (!inspection) {
    return "";
  }

  return [
    inspection.repoName,
    inspection.path,
    inspection.summary,
    ...inspection.manifestFiles,
    ...inspection.topLevelDirectories,
    ...inspection.topLevelFiles,
    ...inspection.samplePaths,
    ...inspection.frameworkHints,
    ...inspection.detectedMarkers
  ]
    .join(" ")
    .toLowerCase();
}

export interface CatalogDetectionHook {
  architectureId: ArchitectureCatalogId;
  matchedKeywords: string[];
  confidence: number;
  rationale: string;
}

export function createCatalogDetectionHooks(summary: string): CatalogDetectionHook[] {
  const normalized = summary.toLowerCase();

  return listArchitectureCatalog()
    .map((entry) => {
      const matchedKeywords = entry.detectionKeywords.filter((keyword) => normalized.includes(keyword));

      if (matchedKeywords.length === 0) {
        return null;
      }

      const confidence = Math.min(0.62 + matchedKeywords.length * 0.08, 0.96);

      return {
        architectureId: entry.id,
        matchedKeywords,
        confidence,
        rationale: `${entry.displayName} matched ${matchedKeywords.join(", ")} from the encoded architecture catalog.`
      } satisfies CatalogDetectionHook;
    })
    .filter((value): value is CatalogDetectionHook => value !== null)
    .sort((left, right) => right.confidence - left.confidence);
}

function detectPlatformType(summary: string, inspection?: RepoInspection): Detection<PlatformType> {
  const inspectionText = toInspectionText(inspection);

  if (
    hasAny(inspection?.frameworkHints ?? [], ["electron", "tauri", "wpf", "winui"]) ||
    includesAny(inspectionText, ["desktop", "electron", "windows", "tauri", "wpf", "winui"])
  ) {
    return createDetection(
      "desktop",
      0.95,
      "Desktop markers in the inspected repo point to a Windows-first desktop product shell."
    );
  }

  if (
    hasAny(inspection?.frameworkHints ?? [], ["wrangler", "workerd"]) ||
    includesAny(inspectionText, ["wrangler", "cloudflare", "worker", "workerd"])
  ) {
    return createDetection("worker", 0.88, "Worker runtime markers indicate an edge or background worker surface.");
  }

  if (
    hasAny(inspection?.frameworkHints ?? [], ["next", "react", "vite"]) ||
    includesAny(inspectionText, ["next", "react", "vite", "website", "marketing"])
  ) {
    return createDetection("web", 0.78, "Frontend framework markers suggest a web surface.");
  }

  if (includesAny(inspectionText, ["express", "fastify", "nest", "controller", "route handler"])) {
    return createDetection("api", 0.72, "API framework markers suggest a service surface.");
  }

  if (includesAny(inspectionText, ["cli", "command", "bin"])) {
    return createDetection("cli", 0.68, "Command-oriented markers suggest a CLI surface.");
  }

  if (includesAny(summary, ["site", "website", "marketing"])) {
    return createDetection("web", 0.72, "Marketing and membership wording suggests a web surface.");
  }

  return createDetection("unknown", 0.38, "No clear platform markers were found in the current intake.");
}

function detectWorkloadType(summary: string, inspection?: RepoInspection): Detection<WorkloadType> {
  const inspectionText = toInspectionText(inspection);

  if (includesAny(summary, ["foundation", "monorepo", "scaffold", "baseline"])) {
    return createDetection(
      "architecture-foundation",
      0.91,
      "Foundation and scaffold language indicates structural setup rather than a narrow feature."
    );
  }

  if (includesAny(summary, ["bug", "fix", "regression"])) {
    return createDetection("bug-fix", 0.82, "Bug and regression language signals a repair workflow.");
  }

  if (includesAny(inspectionText, ["legacy", "strangler", "migration"])) {
    return createDetection("migration", 0.73, "Legacy or migration markers suggest modernization work.");
  }

  return createDetection("diagnosis", 0.56, "The current request looks exploratory but not yet fully classified.");
}

function detectArchitecture(summary: string, inspection?: RepoInspection): Detection<ArchitectureStyle> {
  const inspectionText = toInspectionText(inspection);

  if (includesAny(summary, ["spaghetti", "ball of mud"])) {
    return createDetection(
      "spaghetti",
      0.84,
      "The intake explicitly calls out spaghetti structure or a ball-of-mud architecture."
    );
  }

  if (
    hasAny(inspection?.topLevelDirectories ?? [], ["apps", "packages"]) ||
    includesAny(inspectionText, ["pnpm-workspace", "apps/desktop", "packages/core", "workspace"])
  ) {
    return createDetection(
      "modular-monolith",
      0.9,
      "Workspace-style modules and shared packages point to a modular monolith baseline."
    );
  }

  if (includesAny(inspectionText, ["src/features", "features/", "vertical slice", "slice"])) {
    return createDetection("vertical-slice", 0.82, "Feature-oriented markers suggest a vertical slice structure.");
  }

  if (includesAny(inspectionText, ["src/domain", "src/application", "src/infrastructure", "use-case", "use case"])) {
    return createDetection(
      "clean-architecture",
      0.81,
      "Domain, application, and infrastructure seams suggest a clean architecture shape."
    );
  }

  if (includesAny(inspectionText, ["ports", "adapters", "inbound", "outbound"])) {
    return createDetection("hexagonal", 0.77, "Ports and adapters markers suggest a hexagonal structure.");
  }

  if (includesAny(inspectionText, ["controllers", "services", "repositories", "models"])) {
    return createDetection("layered", 0.69, "Controller/service/repository seams suggest a layered structure.");
  }

  const catalogHooks = createCatalogDetectionHooks(summary);

  if (catalogHooks.length > 0) {
    const topHook = catalogHooks[0];
    return createDetection(topHook.architectureId, topHook.confidence, topHook.rationale);
  }

  return createDetection("unknown", 0.41, "No stable architecture signature was strong enough to classify.");
}

function detectRepoHealth(summary: string, inspection?: RepoInspection): Detection<RepoHealth> {
  const inspectionText = toInspectionText(inspection);

  if (includesAny(summary, ["spaghetti", "drift", "unhealthy"])) {
    return createDetection(
      "spaghetti",
      0.8,
      "The intake explicitly references unhealthy structure or architectural drift."
    );
  }

  if (inspection && inspection.validationErrors.length > 0) {
    return createDetection(
      "unknown",
      0.42,
      "The selected path did not validate cleanly, so repo health remains unknown."
    );
  }

  if (
    includesAny(inspectionText, ["misc", "helpers", "legacy", "tmp", "temp", "old"]) &&
    (inspection?.samplePaths.length ?? 0) > 5
  ) {
    return createDetection("drifting", 0.73, "Mixed legacy or catch-all markers suggest architectural drift.");
  }

  if (
    inspection?.hasGit &&
    ((inspection.topLevelDirectories.includes("apps") && inspection.topLevelDirectories.includes("packages")) ||
      includesAny(inspectionText, ["src/features", "src/domain", "src/application"]))
  ) {
    return createDetection(
      "healthy",
      0.82,
      "The inspected repo shows deliberate module or boundary markers and version-control hygiene."
    );
  }

  if (includesAny(summary, ["foundation", "baseline", "approved", "targeted updates"])) {
    return createDetection(
      "healthy",
      0.76,
      "The repo appears to have a deliberate scaffold baseline rather than uncontrolled structural drift."
    );
  }

  return createDetection("unknown", 0.48, "Repo health needs deeper filesystem analysis to move beyond unknown.");
}

function detectIntent(summary: string, inspection?: RepoInspection): Detection<DiagnosisIntent> {
  const inspectionText = toInspectionText(inspection);

  if (includesAny(summary, ["migration", "refactor"])) {
    return createDetection(
      "migration",
      0.77,
      "Migration or refactor language signals an explicit structural change objective."
    );
  }

  if (includesAny(summary, ["foundation", "implement", "scaffold"])) {
    return createDetection(
      "feature",
      0.84,
      "The request focuses on implementing a new foundation rather than auditing only."
    );
  }

  if (includesAny(summary, ["diagnosis", "review", "analyze"])) {
    return createDetection("review", 0.71, "The intake is phrased as a diagnosis or review request.");
  }

  if (includesAny(inspectionText, ["legacy", "strangler"])) {
    return createDetection("repo-recovery", 0.67, "Legacy-modernization markers suggest a recovery intent.");
  }

  return createDetection("review", 0.58, "The intake still reads like a diagnostic review more than a change request.");
}

export function createMockAutoDetections(intake: DiagnosisIntake): AutoDetections {
  const summary = `${intake.repoName} ${intake.repoSummary} ${intake.requestedOutcome}`.toLowerCase();
  const inspection = intake.repoInspection;

  return {
    platformType: detectPlatformType(summary, inspection),
    workloadType: detectWorkloadType(summary, inspection),
    currentArchitecture: detectArchitecture(summary, inspection),
    repoHealth: detectRepoHealth(summary, inspection),
    likelyDiagnosisIntent: detectIntent(summary, inspection)
  };
}

export class MockRepositoryAnalyzer implements RepositoryAnalyzer {
  async analyze(intake: DiagnosisIntake): Promise<AutoDetections> {
    return createMockAutoDetections(intake);
  }
}
