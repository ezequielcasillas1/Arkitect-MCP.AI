import type {
  CodebaseVerifyResult,
  TestOverrideCapability,
  TestOverrideCatalog,
  TestOverrideKind,
  TestOverrideRunRequest,
  TestOverrideRunResult,
  TestOverrideStepView,
  TestRunResult
} from "@arkitect/contracts";
import { runCodebaseVerification } from "./codebase-verification.js";
import { readPackageScripts, runPnpmScript, tailOutput, validateRepoRoot } from "./pnpm-runner.js";
import { runRepoTests } from "./test-runner.js";

const capabilityDefs: Array<{
  id: TestOverrideKind;
  label: string;
  script: string;
  category: TestOverrideCapability["category"];
}> = [
  { id: "verify", label: "Full verify", script: "verify", category: "verify" },
  { id: "lint", label: "Lint", script: "lint", category: "quality" },
  { id: "build", label: "Build", script: "build", category: "quality" },
  { id: "typecheck", label: "Typecheck", script: "typecheck", category: "quality" },
  { id: "test", label: "All tests", script: "test", category: "test" },
  { id: "unit", label: "Unit tests", script: "test:unit", category: "test" },
  { id: "integration", label: "Integration tests", script: "test:integration", category: "test" }
];

function toStepViews(steps: Array<{ id: string; label: string; status: string; exitCode: number | null; outputTail: string }>): TestOverrideStepView[] {
  return steps.map((step) => ({
    id: step.id,
    label: step.label,
    status: step.status as TestOverrideStepView["status"],
    exitCode: step.exitCode,
    outputTail: step.outputTail
  }));
}

function fromVerifyResult(kind: TestOverrideKind, result: CodebaseVerifyResult): TestOverrideRunResult {
  return {
    ok: result.ok,
    kind,
    repoPath: result.repoPath,
    command: result.command,
    startedAt: result.startedAt,
    finishedAt: result.finishedAt,
    durationMs: result.durationMs,
    steps: toStepViews(result.steps),
    summary: result.summary,
    hint: result.hint,
    errorCode: result.errorCode
  };
}

function fromTestResult(kind: TestOverrideKind, result: TestRunResult): TestOverrideRunResult {
  return {
    ok: result.ok,
    kind,
    repoPath: result.repoPath,
    command: result.command,
    startedAt: result.startedAt,
    finishedAt: result.finishedAt,
    durationMs: result.durationMs,
    steps: toStepViews(result.steps),
    summary: result.summary,
    hint: result.hint,
    errorCode: result.errorCode
  };
}

export async function discoverTestCapabilities(input: { repoPath: string }): Promise<TestOverrideCatalog> {
  const validation = validateRepoRoot(input.repoPath);

  if (!validation.ok) {
    return {
      repoPath: validation.repoPath,
      capabilities: capabilityDefs.map((def) => ({
        id: def.id,
        label: def.label,
        command: `pnpm ${def.script}`,
        available: false,
        category: def.category
      })),
      summary: validation.summary ?? "Invalid repo path."
    };
  }

  const repoPath = validation.repoPath;
  let scripts: Record<string, string>;

  try {
    scripts = await readPackageScripts(repoPath);
  } catch {
    return {
      repoPath,
      capabilities: capabilityDefs.map((def) => ({
        id: def.id,
        label: def.label,
        command: `pnpm ${def.script}`,
        available: false,
        category: def.category
      })),
      summary: "Could not read package.json scripts."
    };
  }

  const hasVerifyScripts = Boolean(scripts.lint && scripts.build && scripts.typecheck && scripts.test);
  const capabilities = capabilityDefs.map((def) => {
    const available = def.id === "verify" ? hasVerifyScripts : Boolean(scripts[def.script]);

    return {
      id: def.id,
      label: def.label,
      command: `pnpm ${def.script}`,
      available,
      category: def.category
    };
  });

  const availableCount = capabilities.filter((cap) => cap.available).length;

  return {
    repoPath,
    capabilities,
    summary:
      availableCount > 0
        ? `${availableCount} runnable command${availableCount === 1 ? "" : "s"} discovered from package.json.`
        : "No lint, build, typecheck, or test scripts found at the repo root."
  };
}

async function runSingleQualityStep(input: {
  repoPath: string;
  kind: TestOverrideKind;
  script: string;
  label: string;
}): Promise<TestOverrideRunResult> {
  const startedAt = new Date();
  const command = `pnpm ${input.script}`;
  const validation = validateRepoRoot(input.repoPath);

  if (!validation.ok) {
    return {
      ok: false,
      kind: input.kind,
      repoPath: validation.repoPath,
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
      kind: input.kind,
      repoPath,
      command,
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: 0,
      steps: [],
      summary: "Could not read package.json scripts.",
      errorCode: "missing_package_json"
    };
  }

  if (!scripts[input.script]) {
    return {
      ok: false,
      kind: input.kind,
      repoPath,
      command,
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: 0,
      steps: [],
      summary: `This repo does not expose a ${input.script} script.`,
      errorCode: input.kind === "test" || input.kind === "unit" || input.kind === "integration" ? "missing_test_script" : "missing_verify_script",
      hint: `Add a root "${input.script}" script before running ${input.label.toLowerCase()}.`
    };
  }

  const result = await runPnpmScript(repoPath, input.script);
  const stepOk = result.exitCode === 0;
  const finishedAt = new Date();

  return {
    ok: stepOk,
    kind: input.kind,
    repoPath,
    command,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    steps: [
      {
        id: input.kind,
        label: input.label,
        status: stepOk ? "success" : "failure",
        exitCode: result.exitCode,
        outputTail: tailOutput(result.output)
      }
    ],
    summary: stepOk ? `${input.label} passed.` : `${input.label} failed (exit ${result.exitCode}).`,
    hint: stepOk ? undefined : "Fix the output below, then re-run from the connected repo root."
  };
}

export async function runTestOverride(input: TestOverrideRunRequest): Promise<TestOverrideRunResult> {
  const { repoPath, kind } = input;

  if (kind === "verify") {
    return fromVerifyResult(kind, await runCodebaseVerification({ repoPath }));
  }

  if (kind === "test") {
    return fromTestResult(kind, await runRepoTests({ repoPath, suite: "all" }));
  }

  if (kind === "unit") {
    return fromTestResult(kind, await runRepoTests({ repoPath, suite: "unit" }));
  }

  if (kind === "integration") {
    return fromTestResult(kind, await runRepoTests({ repoPath, suite: "integration" }));
  }

  const scriptMap: Record<"lint" | "build" | "typecheck", { script: string; label: string }> = {
    lint: { script: "lint", label: "Lint" },
    build: { script: "build", label: "Build" },
    typecheck: { script: "typecheck", label: "Typecheck" }
  };

  const step = scriptMap[kind as "lint" | "build" | "typecheck"];

  return runSingleQualityStep({
    repoPath,
    kind,
    script: step.script,
    label: step.label
  });
}
