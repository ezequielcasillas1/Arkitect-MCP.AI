# @arkitect/mcp-server

Stdio MCP server for Arkitect — diagnosis-first architecture guidance, catalogs, verification, and test tools for local repos.

## Download

| Option | Link |
|--------|------|
| **Website** | [arkitect-mcp.com](https://arkitect-mcp.com/#download-counter-heading) |
| **GitHub Releases** | [Releases](https://github.com/ezequielcasillas1/Arkitect-MCP.AI/releases) |
| **Windows installer** (v0.1.0) | [Arkitect-Setup.exe](https://github.com/ezequielcasillas1/Arkitect-MCP.AI/releases/download/v0.1.0/Arkitect-Setup.exe) |

## Install from source

Clone the repo or download **Source code (zip)** from [Releases](https://github.com/ezequielcasillas1/Arkitect-MCP.AI/releases), then from the monorepo root:

```powershell
pnpm install
pnpm --filter @arkitect/mcp-server build
```

Requires **Node.js 18+**. Confirm `packages/mcp-server/dist/stdio.js` exists before connecting Cursor.

## Cursor MCP config

```json
{
  "mcpServers": {
    "arkitect-mcp": {
      "command": "node",
      "args": ["packages/mcp-server/dist/stdio.js"],
      "env": {
        "ARKITECT_DEFAULT_REPO_PATH": "C:\\Dev\\YourRepo"
      }
    }
  }
}
```

See [docs/USER_GUIDE.md](../../docs/USER_GUIDE.md) for tools, resources, and troubleshooting.
