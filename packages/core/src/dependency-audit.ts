import type { AuditFailThreshold, DependencyAuditCounts, DependencyAuditResult } from "@arkitect/contracts";
import { tailOutput } from "./process-output.js";

const emptyCounts = (): DependencyAuditCounts => ({
  info: 0,
  low: 0,
  moderate: 0,
  high: 0,
  critical: 0
});

function readCountsFromMetadata(metadata: unknown): DependencyAuditCounts | undefined {
  if (!metadata || typeof metadata !== "object") {
    return undefined;
  }

  const vulnerabilities = (metadata as { vulnerabilities?: Record<string, number> }).vulnerabilities;

  if (!vulnerabilities) {
    return undefined;
  }

  return {
    info: vulnerabilities.info ?? 0,
    low: vulnerabilities.low ?? 0,
    moderate: vulnerabilities.moderate ?? 0,
    high: vulnerabilities.high ?? 0,
    critical: vulnerabilities.critical ?? 0
  };
}

export function parseAuditJsonOutput(output: string): { counts: DependencyAuditCounts; parsed: boolean } {
  const trimmed = output.trim();

  if (!trimmed) {
    return { counts: emptyCounts(), parsed: false };
  }

  try {
    const parsed = JSON.parse(trimmed) as { metadata?: unknown };
    const counts = readCountsFromMetadata(parsed.metadata);

    if (counts) {
      return { counts, parsed: true };
    }
  } catch {
    // yarn/npm sometimes emit leading text — try last JSON object line
  }

  const lines = trimmed.split(/\r?\n/).reverse();

  for (const line of lines) {
    if (!line.trim().startsWith("{")) {
      continue;
    }

    try {
      const parsed = JSON.parse(line) as { metadata?: unknown; type?: string; data?: { severity?: string } };
      const counts = readCountsFromMetadata(parsed.metadata);

      if (counts) {
        return { counts, parsed: true };
      }

      if (parsed.type === "auditAdvisory" && parsed.data?.severity) {
        const next = emptyCounts();
        const severity = parsed.data.severity;

        if (severity in next) {
          next[severity as keyof DependencyAuditCounts] += 1;
        }

        return { counts: next, parsed: true };
      }
    } catch {
      continue;
    }
  }

  return { counts: emptyCounts(), parsed: false };
}

export function resolveAuditFailThreshold(input?: AuditFailThreshold): AuditFailThreshold {
  const fromEnv = process.env.ARKITECT_AUDIT_FAIL_THRESHOLD?.trim().toLowerCase();

  if (input) {
    return input;
  }

  if (fromEnv === "high" || fromEnv === "none" || fromEnv === "critical") {
    return fromEnv;
  }

  return "critical";
}

export function auditFailsThreshold(counts: DependencyAuditCounts, threshold: AuditFailThreshold): boolean {
  if (threshold === "none") {
    return false;
  }

  if (threshold === "critical") {
    return counts.critical > 0;
  }

  return counts.critical > 0 || counts.high > 0;
}

export function buildAuditResult(input: {
  command: string;
  exitCode: number;
  output: string;
  failThreshold: AuditFailThreshold;
  durationMs: number;
}): DependencyAuditResult {
  const { counts, parsed } = parseAuditJsonOutput(input.output);
  const fails = parsed ? auditFailsThreshold(counts, input.failThreshold) : false;

  if (!parsed) {
    return {
      status: "inconclusive",
      command: input.command,
      exitCode: input.exitCode,
      counts: emptyCounts(),
      failThreshold: input.failThreshold,
      outputTail: tailOutput(input.output),
      durationMs: input.durationMs
    };
  }

  return {
    status: fails ? "failure" : "success",
    command: input.command,
    exitCode: input.exitCode,
    counts,
    failThreshold: input.failThreshold,
    outputTail: tailOutput(input.output),
    durationMs: input.durationMs
  };
}

export function auditBlocksVerifyPass(audit: DependencyAuditResult | undefined): boolean {
  if (!audit) {
    return false;
  }

  return audit.status === "failure";
}
