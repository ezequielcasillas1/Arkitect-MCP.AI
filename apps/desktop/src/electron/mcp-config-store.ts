import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { app } from "electron";
import type { McpServerLaunchConfig } from "@arkitect/contracts";
import { createDefaultMcpLaunchConfig } from "@arkitect/contracts";

const storageFileName = "arkitect-mcp-launch.json";

function getStoragePath() {
  return join(app.getPath("userData"), storageFileName);
}

function ensureLaunchConfig(value: unknown): McpServerLaunchConfig {
  const fallback = createDefaultMcpLaunchConfig();

  if (!value || typeof value !== "object") {
    return fallback;
  }

  const parsed = value as Partial<McpServerLaunchConfig>;

  return {
    command: typeof parsed.command === "string" && parsed.command.trim() ? parsed.command.trim() : fallback.command,
    args: Array.isArray(parsed.args) ? parsed.args.map(String) : fallback.args,
    env:
      parsed.env && typeof parsed.env === "object"
        ? Object.fromEntries(
            Object.entries(parsed.env).filter(
              (entry): entry is [string, string] => typeof entry[0] === "string" && typeof entry[1] === "string"
            )
          )
        : fallback.env,
    cwd: typeof parsed.cwd === "string" ? parsed.cwd : fallback.cwd,
    useProjectMcpJson: Boolean(parsed.useProjectMcpJson),
    projectMcpJsonPath: typeof parsed.projectMcpJsonPath === "string" ? parsed.projectMcpJsonPath : fallback.projectMcpJsonPath
  };
}

export async function loadMcpLaunchConfig(): Promise<McpServerLaunchConfig> {
  try {
    const raw = await readFile(getStoragePath(), "utf8");
    return ensureLaunchConfig(JSON.parse(raw));
  } catch {
    return createDefaultMcpLaunchConfig();
  }
}

export async function saveMcpLaunchConfig(config: McpServerLaunchConfig): Promise<McpServerLaunchConfig> {
  const storagePath = getStoragePath();
  await mkdir(dirname(storagePath), { recursive: true });
  await writeFile(storagePath, JSON.stringify(config, null, 2), "utf8");
  return config;
}
