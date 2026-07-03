export type CodebaseVerifyStepId = "lint" | "build" | "typecheck" | "test";

export type CodebaseVerifyStepStatus = "success" | "failure" | "skipped";

export interface CodebaseVerifyStepResult {
  id: CodebaseVerifyStepId;
  label: string;
  status: CodebaseVerifyStepStatus;
  exitCode: number | null;
  outputTail: string;
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
  errorCode?: "missing_repo" | "missing_package_json" | "missing_verify_script" | "spawn_failed" | "not_local_repo";
}

export interface CodebaseVerifyRequest {
  repoPath: string;
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
  errorCode?: "missing_repo" | "missing_package_json" | "missing_test_script" | "spawn_failed";
}

export interface TestRunRequest {
  repoPath: string;
  suite?: TestSuiteId;
}
