# Arkitect Monorepo Foundation

Arkitect is now scaffolded as a real pnpm + turbo + TypeScript monorepo while preserving the original product-spec markdown files at the repo root.

## Workspace layout

- `apps/desktop`: Electron + React desktop-first Windows 11 shell for repo intake, detections, policy review, AI settings, permissions, and results.
- `apps/site`: React marketing/download/membership surface aligned to the desktop-first product direction.
- `apps/licensing-worker`: Cloudflare Worker scaffold for Stripe webhook intake plus entitlement/license validation routes.
- `packages/contracts`: shared diagnosis, catalog, AI, licensing, and MCP result contracts.
- `packages/core`: encoded architecture/remix/pattern library plus architecture-first decision logic and recommendation scoring.
- `packages/design-system`: shared dark Arkitect theme tokens for desktop and site surfaces.
- `packages/ai`: provider-agnostic AI catalog with Composer 2.5 as the recommended default.
- `packages/repo-analyzer`: mock repo analyzer showing how platform, workload, architecture, health, and intent detections flow.
- `packages/mcp-server`: scaffolded MCP-facing diagnosis payload and tool definitions for clients like Cursor.
- `packages/github`: placeholder local-first GitHub health bridge for later enrichment.

## Product behavior encoded in the scaffold

1. Arkitect scans the repo first and surfaces auto-detected signals for platform, workload, architecture, repo health, and likely intent.
2. The desktop dashboard keeps auto-detected values visible while allowing user hints, confirmations, and overrides.
3. Healthy existing architecture continues automatically when the detection is strong enough.
4. Unhealthy or spaghetti structure is reported first and is not auto-refactored without explicit structural intent and permission.
5. MCP payloads expose the diagnosis context, decision, and Cursor guidance using the same result shape shown in the desktop shell.

## Tooling

- Package manager: `pnpm`
- Task runner: `turbo`
- Frontend apps: `Vite + React`
- Desktop shell: `Electron`
- Worker runtime: `Cloudflare Workers`
- Shared language/tooling: `TypeScript + ESLint`

## Commands

- `pnpm install`
- `pnpm build`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm verify`
- `pnpm dev:desktop`
- `pnpm start:desktop`
- `pnpm dev:site`
- `pnpm dev:worker`

## Current scaffold status

- The monorepo structure and workspace packages exist with minimal real code.
- The shared architecture, remix, and design-pattern catalog is now encoded in `packages/contracts`, `packages/core`, `packages/mcp-server`, and `apps/desktop`.
- The desktop app now has an interactive Phase 2 workbench: step navigation, local repo testing flow, preset CRUD, tabbed results, and local JSON persistence.
- AI settings now describe the default credential as a `Cursor API Key`, with `composer-2.5` as the recommended Composer-family model/build.
- The repo analyzer is still a mock analyzer and does not yet scan the filesystem deeply.
- The licensing worker uses placeholder route behavior and does not yet verify Stripe signatures or persist entitlements.
- The MCP server exports diagnosis structures and tool scaffolding, but it is not yet wired to the official MCP SDK transport layer.

## Encoded Catalog Library

- `packages/contracts`: catalog types, scoring contracts, and diagnosis result shapes.
- `packages/core`: concrete architecture catalog, remix profiles, design patterns, and recommendation engine.
- `packages/mcp-server`: MCP-facing list tools/resources for architectures, remixes, patterns, and diagnosis payloads.
- `apps/desktop`: visible catalog, remix selection, and pattern DNA surfaced in the diagnosis flow.

## Next implementation steps

1. Replace mock repo analysis with filesystem and repo-metadata scanning.
2. Add persisted licensing and membership storage for Cloudflare worker routes.
3. Connect the desktop shell to deeper background analysis jobs and real execution pipelines.
4. Add transport/runtime wiring for the MCP server so external clients can call it directly.

## Desktop local testing

1. Run `pnpm dev:desktop` for the live Electron + Vite dev flow.
2. In the app, use `Connect Repo` to browse to another local folder or paste a Windows path manually.
3. Click `Inspect path`, move through the diagnosis steps, then run the results flow locally.
4. After `pnpm build`, run `pnpm start:desktop` to open the built desktop app without any Windows Store packaging.
