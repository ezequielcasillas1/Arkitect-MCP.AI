import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { detectPackageManager } from "./package-manager.js";

describe("detectPackageManager", () => {
  it("detects npm from package-lock.json", async () => {
    const repoPath = await mkdtemp(join(tmpdir(), "arkitect-pm-npm-"));
    await writeFile(join(repoPath, "package.json"), JSON.stringify({ name: "demo" }));
    await writeFile(join(repoPath, "package-lock.json"), "{}");

    const detected = await detectPackageManager(repoPath);

    expect(detected.id).toBe("npm");
    expect(detected.source).toBe("lockfile");
  });

  it("detects pnpm from pnpm-lock.yaml", async () => {
    const repoPath = await mkdtemp(join(tmpdir(), "arkitect-pm-pnpm-"));
    await writeFile(join(repoPath, "package.json"), JSON.stringify({ name: "demo" }));
    await writeFile(join(repoPath, "pnpm-lock.yaml"), "lockfileVersion: 9\n");

    const detected = await detectPackageManager(repoPath);

    expect(detected.id).toBe("pnpm");
  });

  it("detects yarn from yarn.lock", async () => {
    const repoPath = await mkdtemp(join(tmpdir(), "arkitect-pm-yarn-"));
    await writeFile(join(repoPath, "package.json"), JSON.stringify({ name: "demo" }));
    await writeFile(join(repoPath, "yarn.lock"), "# yarn lockfile v1\n");

    const detected = await detectPackageManager(repoPath);

    expect(detected.id).toBe("yarn");
  });

  it("detects bun from bun.lock", async () => {
    const repoPath = await mkdtemp(join(tmpdir(), "arkitect-pm-bun-"));
    await writeFile(join(repoPath, "package.json"), JSON.stringify({ name: "demo" }));
    await writeFile(join(repoPath, "bun.lock"), "{}");

    const detected = await detectPackageManager(repoPath);

    expect(detected.id).toBe("bun");
  });

  it("honors packageManager field over lockfiles", async () => {
    const repoPath = await mkdtemp(join(tmpdir(), "arkitect-pm-field-"));
    await writeFile(
      join(repoPath, "package.json"),
      JSON.stringify({ name: "demo", packageManager: "pnpm@9.0.0" })
    );
    await writeFile(join(repoPath, "package-lock.json"), "{}");

    const detected = await detectPackageManager(repoPath);

    expect(detected.id).toBe("pnpm");
    expect(detected.source).toBe("packageManager-field");
  });
});
