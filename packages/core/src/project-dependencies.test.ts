import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { assessProjectDependenciesInstalled } from "./project-dependencies.js";

describe("assessProjectDependenciesInstalled", () => {
  it("requires node_modules for npm projects with devDependencies", async () => {
    const repoPath = await mkdtemp(join(tmpdir(), "arkitect-deps-npm-"));
    await writeFile(
      join(repoPath, "package.json"),
      JSON.stringify({ devDependencies: { eslint: "^9.0.0" } })
    );
    await writeFile(join(repoPath, "package-lock.json"), "{}");

    const status = await assessProjectDependenciesInstalled(repoPath, "npm");

    expect(status.installed).toBe(false);
    expect(status.message).toBe("packages not installed; run npm install");
  });

  it("treats yarn PnP layout as installed without node_modules", async () => {
    const repoPath = await mkdtemp(join(tmpdir(), "arkitect-deps-pnp-"));
    await writeFile(
      join(repoPath, "package.json"),
      JSON.stringify({ dependencies: { react: "^19.0.0" } })
    );
    await writeFile(join(repoPath, ".pnp.cjs"), "module.exports = {};\n");

    const status = await assessProjectDependenciesInstalled(repoPath, "yarn");

    expect(status.installed).toBe(true);
  });

  it("accepts pnpm node_modules/.pnpm layout", async () => {
    const repoPath = await mkdtemp(join(tmpdir(), "arkitect-deps-pnpm-"));
    await writeFile(
      join(repoPath, "package.json"),
      JSON.stringify({ devDependencies: { typescript: "^5.0.0" } })
    );
    await writeFile(join(repoPath, "pnpm-lock.yaml"), "lockfileVersion: 9\n");
    await mkdir(join(repoPath, "node_modules", ".pnpm"), { recursive: true });
    await writeFile(join(repoPath, "node_modules", ".pnpm", "placeholder"), "");

    const status = await assessProjectDependenciesInstalled(repoPath, "pnpm");

    expect(status.installed).toBe(true);
  });
});
