import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveRequiredRepoPath } from "./required-repo-path.js";

describe("resolveRequiredRepoPath", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("refuses when repoPath and env default are missing", () => {
    const result = resolveRequiredRepoPath({});

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.errorCode).toBe("missing_repo_path");
      expect(result.hint).toContain("ARKITECT_DEFAULT_REPO_PATH");
      expect(result.hint).toContain("process.cwd()");
    }
  });

  it("uses ARKITECT_DEFAULT_REPO_PATH when repoPath is omitted", () => {
    vi.stubEnv("ARKITECT_DEFAULT_REPO_PATH", "/tmp/client-repo");
    const result = resolveRequiredRepoPath({});

    expect(result).toEqual({ ok: true, repoPath: "/tmp/client-repo" });
  });

  it("prefers explicit repoPath over env default", () => {
    vi.stubEnv("ARKITECT_DEFAULT_REPO_PATH", "/tmp/default");
    const result = resolveRequiredRepoPath({ repoPath: "/tmp/explicit" });

    expect(result).toEqual({ ok: true, repoPath: "/tmp/explicit" });
  });

  it("trims whitespace repo paths", async () => {
    const dir = await mkdtemp(join(tmpdir(), "arkitect-required-"));
    const result = resolveRequiredRepoPath({ repoPath: `  ${dir}  ` });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.repoPath).toBe(dir);
    }
  });
});
