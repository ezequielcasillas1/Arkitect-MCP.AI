import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { CodebaseVerifyResult } from "@arkitect/contracts";
import { spawn } from "node:child_process";

function formatTimestampWithOffset(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const hours = pad(Math.floor(abs / 60));
  const minutes = pad(abs % 60);

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${sign}${hours}:${minutes}`;
}

async function readGitField(repoPath: string, args: string[]): Promise<string | undefined> {
  return new Promise((resolvePromise) => {
    const child = spawn("git", args, { cwd: repoPath });

    let output = "";

    child.stdout.on("data", (chunk: Buffer | string) => {
      output += chunk.toString();
    });

    child.on("error", () => resolvePromise(undefined));
    child.on("close", (code) => {
      if (code !== 0) {
        resolvePromise(undefined);
        return;
      }

      resolvePromise(output.trim() || undefined);
    });
  });
}

export async function readGitMetadata(repoPath: string): Promise<{ commit?: string; branch?: string }> {
  const [commit, branch] = await Promise.all([
    readGitField(repoPath, ["rev-parse", "HEAD"]),
    readGitField(repoPath, ["rev-parse", "--abbrev-ref", "HEAD"])
  ]);

  return { commit, branch };
}

export function resolveVerifyReportDir(repoPath: string, override?: string): string {
  const fromEnv = process.env.ARKITECT_REPORT_DIR?.trim();
  const base = override?.trim() || fromEnv || join(repoPath, ".arkitect", "reports");
  return base;
}

function shouldWriteReport(input?: boolean): boolean {
  if (input === false) {
    return false;
  }

  const fromEnv = process.env.ARKITECT_WRITE_VERIFY_REPORT?.trim().toLowerCase();

  if (fromEnv === "0" || fromEnv === "false" || fromEnv === "no") {
    return false;
  }

  return true;
}

function renderMarkdownReport(result: CodebaseVerifyResult): string {
  const lines: string[] = [
    "# Arkitect verify report",
    "",
    `- **Timestamp:** ${result.startedAt}`,
    `- **Repo:** ${result.repoPath}`,
    `- **Git commit:** ${result.gitCommit ?? "n/a"}`,
    `- **Git branch:** ${result.gitBranch ?? "n/a"}`,
    `- **Package manager:** ${result.packageManager ?? "unknown"}`,
    `- **Overall:** ${result.ok ? "PASS" : "FAIL"}`,
    `- **Summary:** ${result.summary}`,
    "",
    "## Steps",
    ""
  ];

  for (const step of result.steps) {
    lines.push(
      `### ${step.label} (${step.id})`,
      `- Command: \`${step.command ?? "n/a"}\``,
      `- Status: ${step.status}`,
      `- Exit code: ${step.exitCode ?? "n/a"}`,
      `- Duration ms: ${step.durationMs ?? "n/a"}`,
      ""
    );
  }

  if (result.audit) {
    lines.push(
      "## Dependency audit",
      "",
      `- Command: \`${result.audit.command}\``,
      `- Status: ${result.audit.status}`,
      `- Threshold: ${result.audit.failThreshold}`,
      `- Critical: ${result.audit.counts.critical}`,
      `- High: ${result.audit.counts.high}`,
      `- Moderate: ${result.audit.counts.moderate}`,
      `- Low: ${result.audit.counts.low}`,
      `- Info: ${result.audit.counts.info}`,
      ""
    );
  }

  return lines.join("\n");
}

export async function writeVerifyReport(
  result: CodebaseVerifyResult,
  options?: { reportDir?: string; writeReport?: boolean }
): Promise<{ reportPath?: string; reportJsonPath?: string }> {
  if (!shouldWriteReport(options?.writeReport)) {
    return {};
  }

  const reportDir = resolveVerifyReportDir(result.repoPath, options?.reportDir);
  await mkdir(reportDir, { recursive: true });

  const stamp = formatTimestampWithOffset(new Date(result.startedAt));
  const safeStamp = stamp.replace(/:/g, "-");
  const baseName = `verify-${safeStamp}`;
  const reportPath = join(reportDir, `${baseName}.md`);
  const reportJsonPath = join(reportDir, `${baseName}.json`);

  const gitignorePath = join(result.repoPath, ".arkitect", ".gitignore");
  try {
    await mkdir(join(result.repoPath, ".arkitect"), { recursive: true });
    await writeFile(gitignorePath, "reports/\n", { flag: "wx" });
  } catch {
    // ignore if exists
  }

  await writeFile(reportPath, renderMarkdownReport(result), "utf8");
  await writeFile(reportJsonPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

  return { reportPath, reportJsonPath };
}
