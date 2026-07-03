import type { CodebaseVerifyResult, CodebaseVerifyStepId, CodebaseVerifyStepResult } from "@arkitect/contracts";
import {
  readPackageScripts,
  runPnpmScript,
  tailOutput,
  validateRepoRoot
} from "./pnpm-runner.js";

const verifySteps: Array<{ id: CodebaseVerifyStepId; label: string; script: string }> = [
  { id: "lint", label: "Lint", script: "lint" },
  { id: "build", label: "Build", script: "build" },
  { id: "typecheck", label: "Typecheck", script: "typecheck" },
  { id: "test", label: "Test", script: "test" }
];

export async function runCodebaseVerification(input: { repoPath: string }): Promise<CodebaseVerifyResult> {
  const startedAt = new Date();
  const command = "pnpm verify";
  const validation = validateRepoRoot(input.repoPath);

  if (!validation.ok) {
    return {
      ok: false,
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

  if (!scripts.lint || !scripts.build || !scripts.typecheck || !scripts.test) {
    return {
      ok: false,
      repoPath,
      command,
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: 0,
      steps: [],
      summary: "This repo does not expose lint, build, typecheck, and test scripts.",
      errorCode: "missing_verify_script",
      hint: "Arkitect verify runs pnpm lint, pnpm build, pnpm typecheck, then pnpm test from the repo root."
    };
  }

  const steps: CodebaseVerifyStepResult[] = [];
  let ok = true;

  for (const step of verifySteps) {
    if (!ok) {
      steps.push({
        id: step.id,
        label: step.label,
        status: "skipped",
        exitCode: null,
        outputTail: ""
      });
      continue;
    }

    const result = await runPnpmScript(repoPath, step.script);
    const stepOk = result.exitCode === 0;

    steps.push({
      id: step.id,
      label: step.label,
      status: stepOk ? "success" : "failure",
      exitCode: result.exitCode,
      outputTail: tailOutput(result.output)
    });

    if (!stepOk) {
      ok = false;
    }
  }

  const finishedAt = new Date();
  const passedCount = steps.filter((step) => step.status === "success").length;

  return {
    ok,
    repoPath,
    command,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    steps,
    summary: ok
      ? `Codebase verification passed (${passedCount}/${verifySteps.length} steps).`
      : `Codebase verification failed after ${passedCount}/${verifySteps.length} steps.`,
    hint: ok
      ? undefined
      : "Fix the failing step output below, then run verify again from the connected repo root."
  };
}
