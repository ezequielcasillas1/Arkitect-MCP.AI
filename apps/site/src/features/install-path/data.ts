import { GITHUB_REPO_URL } from "../../lib/arkitect-links";
import type { InstallStep, McpJsonFactoryInput } from "./types";

const DEFAULT_CLIENT_REPO = "C:\\Dev\\YourRepo";
const DEFAULT_HOST_REPO = "C:\\path\\to\\Arkitect-mcp.com";

export function hostStdioPath(hostRepoPath: string): string {
  return `${hostRepoPath.replace(/[\\/]+$/, "")}\\packages\\mcp-server\\dist\\stdio.js`;
}

export function createClientRepoMcpJson(input: McpJsonFactoryInput = {}): string {
  const hostRepoPath = input.hostRepoPath ?? DEFAULT_HOST_REPO;
  const stdioPath = input.stdioPath ?? hostStdioPath(hostRepoPath);

  return `${JSON.stringify(
    {
      mcpServers: {
        "arkitect-mcp": {
          command: "node",
          args: [stdioPath],
          env: {
            ARKITECT_DEFAULT_REPO_PATH: input.clientRepoPath ?? DEFAULT_CLIENT_REPO,
            ARKITECT_HOST_REPO_PATH: hostRepoPath,
            ARKITECT_ANALYZER: input.analyzer ?? "mock"
          }
        }
      }
    },
    null,
    2
  )}\n`;
}

export function createInstallBuildCommand(repoUrl = GITHUB_REPO_URL): string {
  return `git clone ${repoUrl}.git
cd Arkitect-MCP.AI
pnpm install
pnpm --filter @arkitect/mcp-server build`;
}

export const clientRepoMcpJson = createClientRepoMcpJson();
export const installBuildCommand = createInstallBuildCommand();

export const installSteps: InstallStep[] = [
  {
    title: "Install Node.js 18+",
    body: "Install Node.js LTS (18 or newer). Enable pnpm 11.6.0 with corepack enable pnpm, or npm i -g pnpm."
  },
  {
    title: "Clone and build Arkitect",
    body: "Clone the GitHub repo, install dependencies, and build the MCP server until packages/mcp-server/dist/stdio.js exists.",
    command: installBuildCommand
  },
  {
    title: "Paste the JSON into the AI builder",
    body: "Copy the block into Cursor Settings → MCP, or the project .cursor/mcp.json. The same mcpServers block works in Claude Desktop and other MCP hosts."
  },
  {
    title: "Replace the three paths",
    body: "Set args to your absolute stdio.js path, ARKITECT_DEFAULT_REPO_PATH to the project you want diagnosed, and ARKITECT_HOST_REPO_PATH to your Arkitect clone."
  },
  {
    title: "Restart MCP and diagnose",
    body: "Reload arkitect-mcp, then ask the agent to call diagnose_repository before any refactor."
  }
];

export const installPathNotes = [
  "JSON is the only settings paste. Cursor still needs Node plus a built local stdio.js — there is no Windows installer.",
  "args must be the absolute path to packages/mcp-server/dist/stdio.js on this machine.",
  "ARKITECT_DEFAULT_REPO_PATH is the repo Cursor should diagnose (your project).",
  "ARKITECT_HOST_REPO_PATH is the Arkitect-mcp.com clone so host architecture stays write-guarded.",
  "Use double backslashes or forward slashes on Windows."
];
