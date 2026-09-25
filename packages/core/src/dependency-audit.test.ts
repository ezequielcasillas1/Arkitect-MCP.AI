import { describe, expect, it } from "vitest";
import { auditFailsThreshold, buildAuditResult, parseAuditJsonOutput } from "./dependency-audit.js";

describe("dependency audit parsing", () => {
  it("parses npm audit JSON severity counts", () => {
    const sample = JSON.stringify({
      metadata: {
        vulnerabilities: {
          info: 0,
          low: 1,
          moderate: 2,
          high: 0,
          critical: 3
        }
      }
    });

    const parsed = parseAuditJsonOutput(sample);

    expect(parsed.parsed).toBe(true);
    expect(parsed.counts.critical).toBe(3);
    expect(parsed.counts.low).toBe(1);
  });

  it("fails critical threshold when critical advisories exist", () => {
    expect(auditFailsThreshold({ info: 0, low: 0, moderate: 0, high: 0, critical: 1 }, "critical")).toBe(true);
    expect(auditFailsThreshold({ info: 0, low: 0, moderate: 0, high: 2, critical: 0 }, "critical")).toBe(false);
    expect(auditFailsThreshold({ info: 0, low: 0, moderate: 0, high: 2, critical: 0 }, "high")).toBe(true);
    expect(auditFailsThreshold({ info: 0, low: 0, moderate: 0, high: 2, critical: 0 }, "none")).toBe(false);
  });

  it("marks unparsed audit output as inconclusive", () => {
    const audit = buildAuditResult({
      command: "npm audit --json",
      exitCode: 1,
      output: "registry unreachable",
      failThreshold: "critical",
      durationMs: 12
    });

    expect(audit.status).toBe("inconclusive");
    expect(audit.counts.critical).toBe(0);
  });

  it("marks parsed critical counts as audit failure", () => {
    const audit = buildAuditResult({
      command: "npm audit --json",
      exitCode: 1,
      output: JSON.stringify({
        metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 1 } }
      }),
      failThreshold: "critical",
      durationMs: 5
    });

    expect(audit.status).toBe("failure");
  });
});
