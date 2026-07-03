import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { shell } from "electron";
import type { McpCursorInstallResult } from "@arkitect/contracts";

const serverName = "arkitect-mcp";
const electronDir = dirname(fileURLToPath(import.meta.url));

interface CursorMcpJson {
  mcpServers?: Record<
    string,
    {
      command?: string;
      args?: string[];
      env?: Record<string, string>;
      cwd?: string;
    }
  >;
}

interface CursorInstallTransportConfig {
  type: "stdio";
  command: string;
  args: string[];
  env: Record<string, string>;
}

function resolveRepoRoot() {
  const candidates = [process.cwd(), join(electronDir, "../../.."), join(electronDir, "../../../..")];

  return candidates.find((candidate) => existsSync(join(candidate, "packages/mcp-server"))) ?? process.cwd();
}

function resolveStdioPath() {
  const candidates = [
    join(electronDir, "../../../packages/mcp-server/dist/stdio.js"),
    join(process.cwd(), "packages/mcp-server/dist/stdio.js"),
    join(resolveRepoRoot(), "packages/mcp-server/dist/stdio.js")
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}

function toBase64Url(value: unknown) {
  return Buffer.from(JSON.stringify(value), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function buildCursorInstallDeeplink(name: string, config: CursorInstallTransportConfig) {
  return `cursor://anysphere.cursor-deeplink/mcp/install?name=${encodeURIComponent(name)}&config=${toBase64Url(config)}`;
}

function buildServerEntry(stdioPath: string, repoPath: string, env: Record<string, string>) {
  return {
    command: "node",
    args: [stdioPath],
    env: {
      ARKITECT_ANALYZER: env.ARKITECT_ANALYZER === "real" ? "real" : "mock",
      ...(repoPath ? { ARKITECT_DEFAULT_REPO_PATH: repoPath } : {}),
      ...Object.fromEntries(Object.entries(env).filter(([key]) => key !== "ARKITECT_ANALYZER" && key !== "ARKITECT_DEFAULT_REPO_PATH"))
    }
  };
}

async function writeProjectMcpJson(repoPath: string, serverEntry: ReturnType<typeof buildServerEntry>) {
  const configPath = join(repoPath, ".cursor", "mcp.json");
  let existing: CursorMcpJson;

  try {
    existing = JSON.parse(await readFile(configPath, "utf8")) as CursorMcpJson;
  } catch {
    existing = { mcpServers: {} };
  }

  existing.mcpServers = existing.mcpServers ?? {};
  existing.mcpServers[serverName] = serverEntry;

  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, `${JSON.stringify(existing, null, 2)}\n`, "utf8");

  return configPath;
}

export async function installMcpInCursor(input: {
  repoPath?: string;
  env?: Record<string, string>;
}): Promise<McpCursorInstallResult> {
  const stdioPath = resolve(resolveStdioPath());
  const stdioBuilt = existsSync(stdioPath);
  const repoPath = resolve(input.repoPath?.trim() || resolveRepoRoot());
  const env = input.env ?? {};
  const serverEntry = buildServerEntry(stdioPath, repoPath, env);
  const transportConfig: CursorInstallTransportConfig = {
    type: "stdio",
    command: serverEntry.command,
    args: serverEntry.args,
    env: serverEntry.env
  };
  const deeplink = buildCursorInstallDeeplink(serverName, transportConfig);

  if (!stdioBuilt) {
    return {
      ok: false,
      deeplink,
      stdioPath,
      stdioBuilt: false,
      deeplinkOpened: false,
      mcpJsonWritten: false,
      message: "Build the MCP server first: pnpm --filter @arkitect/mcp-server build"
    };
  }

  let mcpJsonPath: string;

  try {
    mcpJsonPath = await writeProjectMcpJson(repoPath, serverEntry);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to write .cursor/mcp.json";

    return {
      ok: false,
      deeplink,
      stdioPath,
      stdioBuilt,
      deeplinkOpened: false,
      mcpJsonWritten: false,
      message
    };
  }

  let deeplinkOpened = false;

  try {
    await shell.openExternal(deeplink);
    deeplinkOpened = true;
  } catch {
    // Keep false when Cursor cannot open the deeplink.
  }

  if (deeplinkOpened) {
    return {
      ok: true,
      deeplink,
      mcpJsonPath,
      stdioPath,
      stdioBuilt,
      deeplinkOpened: true,
      mcpJsonWritten: true,
      message: `Wrote ${mcpJsonPath}. Opened Cursor install prompt — accept it, keep Arkitect Desktop open, then reload MCP tools in Cursor.`
    };
  }

  return {
    ok: true,
    deeplink,
    mcpJsonPath,
    stdioPath,
    stdioBuilt,
    deeplinkOpened: false,
    mcpJsonWritten: true,
    message: `Wrote ${mcpJsonPath}. Cursor deeplink did not open — use Win+R and paste the link below, or reload MCP in Cursor (Settings → MCP).`
  };
}
