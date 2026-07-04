# @arkitect/mcp-server

Stdio MCP server for Arkitect — diagnosis-first architecture guidance, catalogs, verification, and test tools for local repos.

## Download

| Option | Link |
|--------|------|
| **Website** | [arkitect-mcp.com](https://arkitect-mcp.com/#download-counter-heading) |
| **GitHub Releases** | [Releases](https://github.com/ezequielcasillas1/Arkitect-MCP.AI/releases) |
| **Windows installer** (v0.2.0) | [Arkitect-Setup.exe](https://github.com/ezequielcasillas1/Arkitect-MCP.AI/releases/download/v0.2.0/Arkitect-Setup.exe) |

The desktop app can also check GitHub Releases from the sidebar (**Check for updates**) and open the latest installer download.

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

## Catalog coverage

MCP tools `list_architecture_catalog`, `list_design_patterns`, and `list_remix_profiles` expose the full Arkitect catalog, including distributed patterns (saga, circuit breaker, API gateway, BFF, strangler fig), DDD tactical patterns (unit of work, anti-corruption layer), and foundation styles (onion, monolithic, SOA). Mission correspondence flows through `suggest_requirement_tags` → `requirementTags` → diagnosis recommendation scoring.
