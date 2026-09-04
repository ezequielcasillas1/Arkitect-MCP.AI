import type { InstallStep, McpJsonFactoryInput } from "./types";

const DEFAULT_CLIENT_REPO = "C:\\Dev\\YourRepo";
const DEFAULT_HOST_REPO = "C:\\path\\to\\Arkitect-mcp.com";

export function createClientRepoMcpJson(input: McpJsonFactoryInput = {}): string {
  return `${JSON.stringify(
    {
      mcpServers: {
        "arkitect-mcp": {
          command: "node",
          args: ["packages/mcp-server/dist/stdio.js"],
          env: {
            ARKITECT_DEFAULT_REPO_PATH: input.clientRepoPath ?? DEFAULT_CLIENT_REPO,
            ARKITECT_HOST_REPO_PATH: input.hostRepoPath ?? DEFAULT_HOST_REPO,
            ARKITECT_ANALYZER: input.analyzer ?? "mock"
          }
        }
      }
    },
    null,
    2
  )}\n`;
}

export const clientRepoMcpJson = createClientRepoMcpJson();

export const installSteps: InstallStep[] = [
  {
    title: "Reveal the mcp.json path",
    body: "Click See the path to install to show the Cursor config for your client repo."
  },
  {
    title: "Paste into Cursor",
    body: "Drop the JSON into your project .cursor/mcp.json, replace both paths, then restart MCP."
  },
  {
    title: "Restart MCP",
    body: "Reload the Arkitect server in Cursor so it picks up the new client and host paths."
  },
  {
    title: "Run your first diagnosis",
    body: "Ask your agent to scan repo structure, health, and intent before any refactor happens."
  }
];

export const installPathNotes = [
  "ARKITECT_DEFAULT_REPO_PATH is the repo Cursor should diagnose (your project).",
  "ARKITECT_HOST_REPO_PATH is the Arkitect-mcp.com product root so host architecture stays write-guarded.",
  "Replace both paths. Use double backslashes or forward slashes on Windows.",
  "Build packages/mcp-server so dist/stdio.js exists before Cursor launches it."
];
