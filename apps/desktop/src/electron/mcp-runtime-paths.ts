import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { app } from "electron";

const electronDir = dirname(fileURLToPath(import.meta.url));

export function isPackagedApp(): boolean {
  return app.isPackaged;
}

export function resolveDevRepoRoot(): string {
  const candidates = [process.cwd(), join(electronDir, "../../.."), join(electronDir, "../../../..")];

  return candidates.find((candidate) => existsSync(join(candidate, "packages/mcp-server"))) ?? process.cwd();
}

function resolvePackagedStdioPath(): string | undefined {
  const candidates = [
    join(process.resourcesPath, "app.asar.unpacked", "node_modules", "@arkitect", "mcp-server", "dist", "stdio.js"),
    join(process.resourcesPath, "arkitect-mcp", "stdio.js")
  ];

  return candidates.find((candidate) => existsSync(candidate));
}

export function resolveMcpStdioPath(): string {
  if (app.isPackaged) {
    const packaged = resolvePackagedStdioPath();

    if (packaged) {
      return packaged;
    }
  }

  const candidates = [
    join(electronDir, "../../../packages/mcp-server/dist/stdio.js"),
    join(process.cwd(), "packages/mcp-server/dist/stdio.js"),
    join(resolveDevRepoRoot(), "packages/mcp-server/dist/stdio.js")
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}

export function resolveMcpNodeCommand(): string {
  return app.isPackaged ? process.execPath : "node";
}

export function withMcpNodeSpawnEnv(env: Record<string, string> = {}): Record<string, string> {
  if (!app.isPackaged) {
    return env;
  }

  return {
    ...env,
    ELECTRON_RUN_AS_NODE: "1"
  };
}
