import type { CodebaseVerifyRequest, CodebaseVerifyResult, CodebaseVerifyStepResult } from "@arkitect/contracts";
import { auditBlocksVerifyPass, buildAuditResult, resolveAuditFailThreshold } from "./dependency-audit.js";
import {
  detectPackageManager,
  formatPackageScriptCommand,
  isPackageManagerInstalled,
  packageManagerMissingHint,
  readPackageScripts,
  runPackageAudit,
  runPackageScript,
  tailOutput,
  validateRepoRoot
} from "./pnpm-runner.js";
import { readGitMetadata, writeVerifyReport } from "./verify-report.js";

const verifySteps: Array<{ id: "lint" | "build" | "typecheck" | "test"; label: string; script: string }> = [
  { id: "lint", label: "Lint", script: "lint" },
  { id: "build", label: "Build", script: "build" },
  { id: "typecheck", label: "Typecheck", script: "typecheck" },
  { id: "test", label: "Test", script: "test" }
];

function buildFailureResult(
  partial: Omit<CodebaseVerifyResult, "startedAt" | "finishedAt" | "durationMs"> & { startedAt?: Date }
): CodebaseVerifyResult {
  const startedAt = partial.startedAt ?? new Date();
  const finishedAt = new Date();

  return {
    ...partial,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    steps: partial.steps ?? []
  };
}

export async function runCodebaseVerification(input: CodebaseVerifyRequest): Promise<CodebaseVerifyResult> {
  const startedAt = new Date();
  const validation = validateRepoRoot(input.repoPath);

  if (!validation.ok) {
    return buildFailureResult({
      ok: false,
      repoPath: validation.repoPath,
      command: "verify",
      steps: [],
      summary: validation.summary ?? "Invalid repo path.",
      errorCode: validation.errorCode,
      hint: validation.hint,
      startedAt
    });
  }

  const repoPath = validation.repoPath;
  const detection = await detectPackageManager(repoPath);
  const packageManager = detection.id;
  const command = `${packageManager} lint, build, typecheck, test, and audit`;

  const pmInstalled = await isPackageManagerInstalled(packageManager);

  if (!pmInstalled) {
    return buildFailureResult({
      ok: false,
      repoPath,
      command,
      packageManager,
      steps: [],
      summary: `${packageManager} is not installed or not on PATH.`,
      errorCode: "package_manager_missing",
      hint: packageManagerMissingHint(packageManager, detection),
      startedAt
    });
  }

  let scripts: Record<string, string>;

  try {
    scripts = await readPackageScripts(repoPath);
  } catch {
    return buildFailureResult({
      ok: false,
      repoPath,
      command,
      packageManager,
      steps: [],
      summary: "Could not read package.json scripts.",
      errorCode: "missing_package_json",
      startedAt
    });
  }

  if (!scripts.lint || !scripts.build || !scripts.typecheck || !scripts.test) {
    return buildFailureResult({
      ok: false,
      repoPath,
      command,
      packageManager,
      steps: [],
      summary: "This repo does not expose lint, build, typecheck, and test scripts.",
      errorCode: "missing_verify_script",
      hint: `Arkitect verify runs ${formatPackageScriptCommand(packageManager, "lint")}, ${formatPackageScriptCommand(packageManager, "build")}, ${formatPackageScriptCommand(packageManager, "typecheck")}, then ${formatPackageScriptCommand(packageManager, "test")} from the repo root.`,
      startedAt
    });
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
        outputTail: "",
        command: formatPackageScriptCommand(packageManager, step.script)
      });
      continue;
    }

    const stepStarted = new Date();
    const result = await runPackageScript(repoPath, step.script, packageManager);
    const stepFinished = new Date();
    const stepOk = result.exitCode === 0;

    steps.push({
      id: step.id,
      label: step.label,
      status: stepOk ? "success" : "failure",
      exitCode: result.exitCode,
      outputTail: tailOutput(result.output),
      command: result.command,
      startedAt: stepStarted.toISOString(),
      finishedAt: stepFinished.toISOString(),
      durationMs: stepFinished.getTime() - stepStarted.getTime()
    });

    if (!stepOk) {
      ok = false;
    }
  }

  const auditThreshold = resolveAuditFailThreshold(input.auditFailThreshold);
  const auditStarted = new Date();
  const auditRun = await runPackageAudit(repoPath, packageManager);
  const auditFinished = new Date();
  const audit = buildAuditResult({
    command: auditRun.command,
    exitCode: auditRun.exitCode,
    output: auditRun.output,
    failThreshold: auditThreshold,
    durationMs: auditFinished.getTime() - auditStarted.getTime()
  });

  steps.push({
    id: "audit",
    label: "Dependency audit",
    status: audit.status === "success" ? "success" : audit.status === "inconclusive" ? "skipped" : "failure",
    exitCode: audit.exitCode,
    outputTail: audit.outputTail,
    command: audit.command,
    startedAt: auditStarted.toISOString(),
    finishedAt: auditFinished.toISOString(),
    durationMs: audit.durationMs
  });

  if (auditBlocksVerifyPass(audit)) {
    ok = false;
  }

  const finishedAt = new Date();
  const passedCount = steps.filter((step) => step.status === "success").length;
  const git = await readGitMetadata(repoPath);

  let summary = ok
    ? `Codebase verification passed (${passedCount}/${steps.length} steps).`
    : `Codebase verification failed after ${passedCount}/${steps.length} steps.`;

  if (audit.status === "inconclusive") {
    summary = `${summary} Dependency audit inconclusive (not counted as pass).`;
  } else if (audit.status === "failure") {
    summary = `${summary} Dependency audit failed (${auditThreshold} threshold).`;
  }

  const baseResult: CodebaseVerifyResult = {
    ok,
    repoPath,
    command,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    steps,
    packageManager,
    audit,
    gitCommit: git.commit,
    gitBranch: git.branch,
    summary,
    hint: ok
      ? undefined
      : "Fix the failing step output below, then run verify again from the connected repo root."
  };

  const reportPaths = await writeVerifyReport(baseResult, {
    reportDir: input.reportDir,
    writeReport: input.writeReport
  });

  return {
    ...baseResult,
    ...reportPaths
  };
}
