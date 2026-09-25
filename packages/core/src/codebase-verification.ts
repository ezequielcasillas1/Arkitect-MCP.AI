import { spawn } from "node:child_process";
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
  validateDirectoryRoot,
  validateRepoRoot
} from "./pnpm-runner.js";
import { inspectRepoPath, listPhpFilesForSyntaxCheck, PHP_SYNTAX_CHECK_FILE_LIMIT } from "./repo-inspector.js";
import { readGitMetadata, writeVerifyReport } from "./verify-report.js";
import { assessProjectDependenciesInstalled } from "./project-dependencies.js";

const verifySteps: Array<{ id: "lint" | "build" | "typecheck" | "test"; label: string; script: string }> = [
  { id: "lint", label: "Lint", script: "lint" },
  { id: "build", label: "Build", script: "build" },
  { id: "typecheck", label: "Typecheck", script: "typecheck" },
  { id: "test", label: "Test", script: "test" }
];

const notApplicableNodeScriptReason =
  "Not applicable — this repo is not a Node.js project (no package.json at the repo root).";

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

function missingScriptReason(script: string): string {
  return `Skipped — no "${script}" script is configured in package.json.`;
}

function buildStaticSiteLabel(frameworkHints: string[]): string {
  const hasPhp = frameworkHints.includes("php");
  const hasHtml = frameworkHints.includes("html-static");

  if (hasPhp && hasHtml) {
    return "Static PHP/HTML site";
  }

  if (hasPhp) {
    return "Static PHP site";
  }

  if (hasHtml) {
    return "Static HTML site";
  }

  if (frameworkHints.includes("wordpress")) {
    return "WordPress site";
  }

  return "Static non-Node site";
}

function formatMissingScriptSummary(missing: string[]): string {
  if (missing.length === 0) {
    return "";
  }

  if (missing.length === 1) {
    return `${missing[0]} not configured`;
  }

  if (missing.length === 2) {
    return `${missing[0]} and ${missing[1]} not configured`;
  }

  return `${missing.slice(0, -1).join(", ")}, and ${missing.at(-1)} not configured`;
}

function buildExecutedSummary(ok: boolean, steps: CodebaseVerifyStepResult[], missingScripts: string[]): string {
  const executed = steps.filter((step) => step.status === "success" || step.status === "failure");
  const passed = executed.filter((step) => step.status === "success").length;
  const missingSummary = formatMissingScriptSummary(missingScripts);
  const base = ok
    ? `Codebase verification passed (${passed}/${executed.length} executed steps`
    : `Codebase verification failed after ${passed}/${executed.length} executed steps`;

  if (!missingSummary) {
    return `${base}).`;
  }

  return `${base}; ${missingSummary}).`;
}

async function isPhpCliAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn("php", ["-v"], { stdio: "ignore" });
    child.on("error", () => resolve(false));
    child.on("close", (code) => resolve(code === 0));
  });
}

async function runPhpSyntaxCheck(repoPath: string): Promise<CodebaseVerifyStepResult> {
  const startedAt = new Date();
  const { files: phpFiles, scanCapped } = await listPhpFilesForSyntaxCheck(repoPath);

  if (phpFiles.length === 0) {
    const finishedAt = new Date();
    return {
      id: "syntax",
      label: "PHP syntax",
      status: "skipped",
      exitCode: null,
      outputTail: "No PHP files found to lint.",
      command: "php -l",
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime()
    };
  }

  const phpAvailable = await isPhpCliAvailable();

  if (!phpAvailable) {
    const finishedAt = new Date();
    return {
      id: "syntax",
      label: "PHP syntax",
      status: "skipped",
      exitCode: null,
      outputTail: "php CLI is not installed or not on PATH.",
      command: "php -l",
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime()
    };
  }

  const failures: string[] = [];

  for (const relativePath of phpFiles) {
    const exitCode = await new Promise<number | null>((resolve) => {
      const child = spawn("php", ["-l", relativePath], { cwd: repoPath });
      let output = "";

      child.stdout.on("data", (chunk) => {
        output += chunk.toString();
      });
      child.stderr.on("data", (chunk) => {
        output += chunk.toString();
      });
      child.on("error", () => resolve(null));
      child.on("close", (code) => {
        if (code !== 0) {
          failures.push(`${relativePath}: ${tailOutput(output, 8)}`);
        }
        resolve(code);
      });
    });

    if (exitCode === null) {
      const finishedAt = new Date();
      return {
        id: "syntax",
        label: "PHP syntax",
        status: "skipped",
        exitCode: null,
        outputTail: "php -l could not be executed.",
        command: "php -l",
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime()
      };
    }
  }

  const finishedAt = new Date();
  const syntaxErrors = failures.length > 0;
  const partialScan = scanCapped;
  const status = syntaxErrors || partialScan ? "failure" : "success";
  const outputTail = syntaxErrors
    ? tailOutput(failures.join("\n"), 24)
    : partialScan
      ? `Partial PHP syntax scan: checked ${phpFiles.length} file(s); additional files were not scanned (cap ${PHP_SYNTAX_CHECK_FILE_LIMIT}).`
      : `Checked ${phpFiles.length} PHP file(s) with php -l.`;

  return {
    id: "syntax",
    label: "PHP syntax",
    status,
    exitCode: status === "success" ? 0 : 1,
    outputTail,
    command: "php -l",
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime()
  };
}

async function runStaticCodebaseVerification(
  repoPath: string,
  input: CodebaseVerifyRequest,
  startedAt: Date
): Promise<CodebaseVerifyResult> {
  const inspection = await inspectRepoPath(repoPath);
  const steps: CodebaseVerifyStepResult[] = verifySteps.map((step) => ({
    id: step.id,
    label: step.label,
    status: "not_run",
    exitCode: null,
    outputTail: notApplicableNodeScriptReason
  }));

  const syntaxStep = inspection.frameworkHints.includes("php") ? await runPhpSyntaxCheck(repoPath) : null;

  if (syntaxStep) {
    steps.push(syntaxStep);
  }

  const applicable = steps.filter((step) => step.status === "success" || step.status === "failure");
  const ok = applicable.length === 0 ? true : applicable.every((step) => step.status === "success");
  const finishedAt = new Date();
  const siteLabel = buildStaticSiteLabel(inspection.frameworkHints);
  const git = await readGitMetadata(repoPath);

  const summary = ok
    ? `${siteLabel} verification passed. Node lint/build/typecheck/test do not apply.${syntaxStep ? ` PHP syntax: ${syntaxStep.status}.` : ""}`
    : `${siteLabel} verification failed.${syntaxStep?.status === "failure" ? " PHP syntax check reported errors or a partial scan." : ""}`;

  const baseResult: CodebaseVerifyResult = {
    ok,
    repoPath,
    command: "static stack inspection (non-Node)",
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    steps,
    gitCommit: git.commit,
    gitBranch: git.branch,
    summary,
    hint: ok ? undefined : "Fix PHP syntax errors or structural issues, then run verify again."
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

export async function runCodebaseVerification(input: CodebaseVerifyRequest): Promise<CodebaseVerifyResult> {
  const startedAt = new Date();
  const directoryValidation = validateDirectoryRoot(input.repoPath);

  if (!directoryValidation.ok) {
    return buildFailureResult({
      ok: false,
      repoPath: directoryValidation.repoPath,
      command: "verify",
      steps: [],
      summary: directoryValidation.summary ?? "Invalid repo path.",
      errorCode: directoryValidation.errorCode,
      hint: directoryValidation.hint,
      startedAt
    });
  }

  const repoPath = directoryValidation.repoPath;
  const nodeValidation = validateRepoRoot(repoPath);

  if (!nodeValidation.ok) {
    if (nodeValidation.errorCode === "missing_package_json") {
      return runStaticCodebaseVerification(repoPath, input, startedAt);
    }

    return buildFailureResult({
      ok: false,
      repoPath,
      command: "verify",
      steps: [],
      summary: nodeValidation.summary ?? "Invalid repo path.",
      errorCode: nodeValidation.errorCode,
      hint: nodeValidation.hint,
      startedAt
    });
  }

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

  const configuredSteps = verifySteps.filter((step) => Boolean(scripts[step.script]));
  const missingScripts = verifySteps.filter((step) => !scripts[step.script]).map((step) => step.id);

  if (configuredSteps.length === 0) {
    return buildFailureResult({
      ok: false,
      repoPath,
      command,
      packageManager,
      steps: verifySteps.map((step) => ({
        id: step.id,
        label: step.label,
        status: "not_run" as const,
        exitCode: null,
        outputTail: missingScriptReason(step.script)
      })),
      summary: "This repo does not expose any lint, build, typecheck, or test scripts.",
      errorCode: "missing_verify_script",
      hint: `Add at least one root script (${verifySteps.map((step) => step.script).join(", ")}) before running verify.`,
      startedAt
    });
  }

  const steps: CodebaseVerifyStepResult[] = [];
  let ok = true;
  const dependencyStatus = await assessProjectDependenciesInstalled(repoPath, packageManager);

  if (!dependencyStatus.installed) {
    ok = false;

    for (const step of verifySteps) {
      steps.push({
        id: step.id,
        label: step.label,
        status: "not_run",
        exitCode: null,
        outputTail: scripts[step.script] ? dependencyStatus.message : missingScriptReason(step.script)
      });
    }
  } else {
    for (const step of verifySteps) {
      if (!scripts[step.script]) {
        steps.push({
          id: step.id,
          label: step.label,
          status: "not_run",
          exitCode: null,
          outputTail: missingScriptReason(step.script)
        });
        continue;
      }

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
  const git = await readGitMetadata(repoPath);

  let summary = buildExecutedSummary(ok, steps, missingScripts);

  if (!dependencyStatus.installed) {
    summary = `Codebase verification failed: ${dependencyStatus.message}`;
  } else if (audit.status === "inconclusive") {
    summary = `${summary} Dependency audit inconclusive (not counted as pass).`;
  } else if (audit.status === "failure") {
    summary = `${summary} Dependency audit failed (${auditThreshold} threshold).`;
  }

  const hint = ok
    ? undefined
    : !dependencyStatus.installed
      ? dependencyStatus.message
      : "Fix the failing step output below, then run verify again from the connected repo root.";

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
    dependenciesInstalled: dependencyStatus.installed,
    summary,
    hint,
    ...(!dependencyStatus.installed ? { errorCode: "packages_not_installed" as const } : {})
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
