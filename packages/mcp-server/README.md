# @arkitect/mcp-server

Stdio MCP server for Arkitect — diagnosis-first architecture guidance, catalogs, verification, and test tools for local repos.

## Install

Clone [the GitHub repo](https://github.com/ezequielcasillas1/Arkitect-MCP.AI), build this package, then paste the Cursor `mcp.json` from [arkitect-mcp.com](https://arkitect-mcp.com/#install-path). No Windows installer.

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
      "args": ["C:\\path\\to\\Arkitect-mcp.com\\packages\\mcp-server\\dist\\stdio.js"],
      "env": {
        "ARKITECT_DEFAULT_REPO_PATH": "C:\\Dev\\YourRepo",
        "ARKITECT_HOST_REPO_PATH": "C:\\path\\to\\Arkitect-mcp.com",
        "ARKITECT_ANALYZER": "mock"
      }
    }
  }
}
```

`ARKITECT_DEFAULT_REPO_PATH` is the repo to diagnose. `ARKITECT_HOST_REPO_PATH` is the Arkitect-mcp.com product root so host architecture stays write-guarded.

Optional verify/report env:

| Variable | Purpose |
|----------|---------|
| `ARKITECT_AUDIT_FAIL_THRESHOLD` | `critical` (default), `high`, or `none` — fail verify when audit counts exceed the threshold |
| `ARKITECT_REPORT_DIR` | Override report output directory (default: `<repo>/.arkitect/reports/`) |
| `ARKITECT_WRITE_VERIFY_REPORT` | Set to `0`/`false` to skip writing markdown/JSON reports |

`verify_codebase` requires `repoPath` (or `ARKITECT_DEFAULT_REPO_PATH`). It detects npm/pnpm/yarn/bun from lockfiles, runs each configured lint/build/typecheck/test script, skips missing scripts with `not_run`, always runs the dependency audit for Node repos, and uses a static/PHP syntax path when no `package.json` exists. `diagnose_repository` and `suggest_requirement_tags` inspect the connected repo filesystem before applying mock analyzer heuristics. If neither `repoPath` nor `ARKITECT_DEFAULT_REPO_PATH` is set, repo-scoped tools refuse with a clear error instead of using the MCP server working directory.

See [docs/USER_GUIDE.md](../../docs/USER_GUIDE.md) for tools, resources, and troubleshooting.

## Catalog coverage

MCP tools `list_architecture_catalog`, `list_design_patterns`, and `list_remix_profiles` expose the full Arkitect catalog, including distributed patterns (saga, circuit breaker, API gateway, BFF, strangler fig), DDD tactical patterns (unit of work, anti-corruption layer), and foundation styles (onion, monolithic, SOA). Mission correspondence flows through `suggest_requirement_tags` → `requirementTags` → diagnosis recommendation scoring.
