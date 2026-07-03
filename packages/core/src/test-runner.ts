import type { TestRunResult, TestRunStepResult, TestSuiteId } from "@arkitect/contracts";
import {
  readPackageScripts,
  runPnpmScript,
  tailOutput,
  validateRepoRoot
} from "./pnpm-runner.js";

const suiteScripts: Record<TestSuiteId, string> = {
  all: "test",
  unit: "test:unit",
  integration: "test:integration"
};

const suiteLabels: Record<TestSuiteId, string> = {
  all: "All tests",
  unit: "Unit tests",
  integration: "Integration tests"
};

function resolveSuite(input?: { suite?: TestSuiteId }): TestSuiteId {
  return input?.suite ?? "all";
}

export async function runRepoTests(input: { repoPath: string; suite?: TestSuiteId }): Promise<TestRunResult> {
  const startedAt = new Date();
  const suite = resolveSuite(input);
  const script = suiteScripts[suite];
  const command = `pnpm ${script}`;
  const validation = validateRepoRoot(input.repoPath);

  if (!validation.ok) {
    return {
      ok: false,
      repoPath: validation.repoPath,
      suite,
      command,
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: 0,
      steps: [],
      summary: validation.summary ?? "Invalid repo path.",
      errorCode: validation.errorCode,
      hint: validation.hint
    };
  }

  const repoPath = validation.repoPath;
  let scripts: Record<string, string>;

  try {
    scripts = await readPackageScripts(repoPath);
  } catch {
    return {
      ok: false,
      repoPath,
      suite,
      command,
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: 0,
      steps: [],
      summary: "Could not read package.json scripts.",
      errorCode: "missing_package_json"
    };
  }

  if (!scripts[script]) {
    return {
      ok: false,
      repoPath,
      suite,
      command,
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: 0,
      steps: [],
      summary: `This repo does not expose a ${script} script.`,
      errorCode: "missing_test_script",
      hint:
        suite === "all"
          ? "Arkitect run_tests expects pnpm test at the repo root."
          : `Add a root "${script}" script (e.g. turbo run ${script}) before running the ${suite} suite.`
    };
  }

  const result = await runPnpmScript(repoPath, script);
  const stepOk = result.exitCode === 0;
  const steps: TestRunStepResult[] = [
    {
      id: suite,
      label: suiteLabels[suite],
      status: stepOk ? "success" : "failure",
      exitCode: result.exitCode,
      outputTail: tailOutput(result.output)
    }
  ];
  const finishedAt = new Date();

  return {
    ok: stepOk,
    repoPath,
    suite,
    command,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    steps,
    summary: stepOk
      ? `${suiteLabels[suite]} passed.`
      : `${suiteLabels[suite]} failed (exit ${result.exitCode}).`,
    hint: stepOk ? undefined : "Fix failing tests, then re-run from the connected repo root."
  };
}
