import { describe, expect, it } from "vitest";
import { validateGitHubTokenFormat } from "./index.js";

describe("validateGitHubTokenFormat", () => {
  it("rejects empty tokens", () => {
    const result = validateGitHubTokenFormat("   ");

    expect(result.valid).toBe(false);
    expect(result.reason).toContain("required");
  });

  it("accepts standard GitHub PAT prefixes", () => {
    const result = validateGitHubTokenFormat("ghp_0123456789012345678901234567890");

    expect(result.valid).toBe(true);
    expect(result.normalizedToken.startsWith("ghp_")).toBe(true);
  });

  it("rejects obviously short tokens", () => {
    const result = validateGitHubTokenFormat("short-token");

    expect(result.valid).toBe(false);
  });
});
