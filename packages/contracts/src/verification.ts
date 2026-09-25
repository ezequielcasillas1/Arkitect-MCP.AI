export type PackageManagerId = "npm" | "pnpm" | "yarn" | "bun";

export type CodebaseVerifyStepId = "lint" | "build" | "typecheck" | "test" | "audit";

export type CodebaseVerifyStepStatus = "success" | "failure" | "skipped" | "not_run";

export type AuditFailThreshold = "critical" | "high" | "none";

export type DependencyAuditStatus = "success" | "failure" | "inconclusive";

export interface DependencyAuditCounts {
  info: number;
  low: number;
  moderate: number;
  high: number;
  critical: number;
}

export interface DependencyAuditResult {
  status: DependencyAuditStatus;
  command: string;
  exitCode: number | null;
  counts: DependencyAuditCounts;
  failThreshold: AuditFailThreshold;
  outputTail: string;
  durationMs: number;
}

export interface CodebaseVerifyStepResult {
  id: CodebaseVerifyStepId;
  label: string;
  status: CodebaseVerifyStepStatus;
  exitCode: number | null;
  outputTail: string;
  command?: string;
  durationMs?: number;
  startedAt?: string;
  finishedAt?: string;
}

export interface CodebaseVerifyResult {
  ok: boolean;
  repoPath: string;
  command: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  steps: CodebaseVerifyStepResult[];
  summary: string;
  hint?: string;
  packageManager?: PackageManagerId;
  audit?: DependencyAuditResult;
  reportPath?: string;
  reportJsonPath?: string;
  gitCommit?: string;
  gitBranch?: string;
  errorCode?:
    | "missing_repo"
    | "missing_repo_path"
    | "missing_package_json"
    | "missing_verify_script"
    | "spawn_failed"
    | "not_local_repo"
    | "package_manager_missing"
    | "packages_not_installed";
  dependenciesInstalled?: boolean;
}

export interface CodebaseVerifyRequest {
  repoPath: string;
  auditFailThreshold?: AuditFailThreshold;
  reportDir?: string;
  writeReport?: boolean;
}

export type TestSuiteId = "unit" | "integration" | "all";

export type TestRunStepStatus = "success" | "failure" | "skipped";

export interface TestRunStepResult {
  id: TestSuiteId;
  label: string;
  status: TestRunStepStatus;
  exitCode: number | null;
  outputTail: string;
}

export interface TestRunResult {
  ok: boolean;
  repoPath: string;
  suite: TestSuiteId;
  command: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  steps: TestRunStepResult[];
  summary: string;
  hint?: string;
  errorCode?: "missing_repo" | "missing_repo_path" | "missing_package_json" | "missing_test_script" | "spawn_failed";
}

export interface TestRunRequest {
  repoPath: string;
  suite?: TestSuiteId;
}

export type TestOverrideKind =
  | "verify"
  | "lint"
  | "build"
  | "typecheck"
  | "test"
  | "unit"
  | "integration";

export type TestOverrideCategory = "verify" | "quality" | "test";

export interface TestOverrideCapability {
  id: TestOverrideKind;
  label: string;
  command: string;
  available: boolean;
  category: TestOverrideCategory;
}

export interface TestOverrideCatalog {
  repoPath: string;
  capabilities: TestOverrideCapability[];
  summary: string;
}

export interface TestOverrideStepView {
  id: string;
  label: string;
  status: CodebaseVerifyStepStatus;
  exitCode: number | null;
  outputTail: string;
}

export interface TestOverrideRunResult {
  ok: boolean;
  kind: TestOverrideKind;
  repoPath: string;
  command: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  steps: TestOverrideStepView[];
  summary: string;
  hint?: string;
  errorCode?:
    | "missing_repo"
    | "missing_repo_path"
    | "missing_package_json"
    | "missing_verify_script"
    | "missing_test_script"
    | "spawn_failed"
    | "not_local_repo"
    | "package_manager_missing"
    | "packages_not_installed";
}

export interface TestOverrideRunRequest {
  repoPath: string;
  kind: TestOverrideKind;
}
