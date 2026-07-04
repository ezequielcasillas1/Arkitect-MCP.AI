# @arkitect/mcp-server

Stdio MCP server for Arkitect — diagnosis-first architecture guidance, catalogs, verification, and test tools for local repos.

## Install

```bash
npm install -g @arkitect/mcp-server
# or run without global install:
npx -y @arkitect/mcp-server
```

Requires **Node.js 18+**.

## Cursor MCP config

```json
{
  "mcpServers": {
    "arkitect-mcp": {
      "command": "npx",
      "args": ["-y", "@arkitect/mcp-server"],
      "env": {
        "ARKITECT_DEFAULT_REPO_PATH": "C:\\Dev\\YourRepo"
      }
    }
  }
}
```

See [docs/USER_GUIDE.md](../../docs/USER_GUIDE.md) for tools, resources, and troubleshooting.

## Publish to npm (maintainers)

Requires npm login and access to the `@arkitect` scope (create at [npmjs.com/org/create](https://www.npmjs.com/org/create) if needed).

```bash
pnpm install
npm login
pnpm publish:mcp
```

Publishes `@arkitect/contracts`, `@arkitect/ai`, `@arkitect/core`, `@arkitect/repo-analyzer`, and `@arkitect/mcp-server` in dependency order.

Dry run:

```bash
pnpm --filter @arkitect/mcp-server... publish --access public --dry-run
```

## GitHub release artifacts (maintainers)

```bash
pnpm pack:mcp
gh release create v0.1.0 dist-release/* --title "Arkitect v0.1.0" --notes "Desktop installer + MCP server npm tarball and portable zip."
```

Or push a `v*` tag — CI (`.github/workflows/release-desktop.yml`) uploads `Arkitect-Setup.exe`, `arkitect-mcp-server-<version>.tgz`, and the portable zip to the same release.
