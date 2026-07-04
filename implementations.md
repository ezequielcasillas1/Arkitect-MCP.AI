# Implementations

Use concise implementation notes after review.

Template:
### [Date] - [Feature]
**Status:** [PENDING/PARTIAL/FAILURE]
**Files:** [file1, file2]
**Result:** [What changed and why]

### 2026-07-04 - MCP structuredContent Fix
**Status:** PENDING
**Files:** packages/mcp-server/src/mcp-result-mapper.ts, packages/mcp-server/src/stdio.ts, packages/mcp-server/src/mcp-server.test.ts, packages/mcp-server/src/mcp-result-mapper.test.ts
**Result:** `toMcpToolResult` now lifts each tool's `{type:"json"}` content into a spec-compliant `structuredContent` object; verified against all 10 tools' outputSchema in tests. Typecheck/lint/build/tests pass; live MCP server still needs a Cursor restart to load the rebuilt dist before it's confirmed end-to-end.

### 2026-07-04 - Marketing Site: Download Counter + Reviews
**Status:** PENDING
**Files:** apps/site/src/features/download-counter/*, apps/site/src/features/reviews/*, apps/site/src/lib/*, apps/site/src/components/*, apps/site/src/pages/*, apps/site/src/App.tsx, apps/site/src/main.tsx, apps/site/src/styles.css, apps/site/supabase/migrations/*, apps/site/wrangler.jsonc, apps/site/public/_redirects, instructions/request.md
**Result:** Extended `@arkitect/site` with two vertical slices (download-counter, reviews) reusing the existing dark-blue `@arkitect/design-system` theme; Supabase-backed via a dedicated new project (capped/dedup'd counter RPCs, moderation-friendly reviews RLS + rate-limit trigger), with mock-gateway fallback via Strategy pattern when unconfigured. Cloudflare Pages build/deploy files added; domain routing still blocked (no Cloudflare MCP connected). Typecheck, lint, and production build all pass; awaiting user confirmation before any success claim.

### 2026-07-03 - MCP Test Runner Tools
**Status:** PENDING
**Files:** packages/contracts/src/verification.ts, packages/core/src/test-runner.ts, packages/core/src/pnpm-runner.ts, packages/mcp-server/src/index.ts, package.json, turbo.json, apps/desktop/src/features/results-overview/ResultsOverviewSection.tsx
**Result:** Added run_tests and run_test_suite MCP tools, root test:unit/test:integration scripts, structured JSON results; stdio auto-exposes new tools; awaiting user verification.

**Status:** PENDING
**Files:** packages/contracts, packages/core, packages/mcp-server, packages/repo-analyzer, apps/desktop
**Result:** Encoded the architecture/remix/pattern library with scoring, MCP exposure, and desktop visibility; awaiting user review before any success claim.

### 2026-06-16 - MCP Stdio Transport Wiring
**Status:** PENDING
**Files:** packages/mcp-server/src/stdio.ts, packages/mcp-server/src/index.ts, packages/mcp-server/package.json, packages/mcp-server/tsconfig.json, packages/repo-analyzer/src/index.ts, .cursor/mcp.json
**Result:** Added MCP SDK stdio entrypoint, resource readers for five arkitect:// URIs, bin `arkitect-mcp`, and Cursor `.cursor/mcp.json` config; fixed repo-analyzer ESM export for Node runtime; build passes.

### 2026-06-16 - MCP Dogfood Smoke Test (Cursor)
**Status:** PENDING
**Files:** .cursor/mcp.json, packages/mcp-server/dist/stdio.js
**Result:** Built and smoke-tested stdio MCP locally; initialize/tools/resources all respond; catalog tools and resource reads work; diagnose_repository returns payload but uses MockRepositoryAnalyzer heuristics only (no real repo inspection yet).

**Works well for Cursor:**
- Relative `node packages/mcp-server/dist/stdio.js` in `.cursor/mcp.json` is correct for Windows when cwd is repo root; no path fix needed
- Six tools / five `arkitect://` resources match spec; MCP SDK stdio transport is stable
- `outputSchema` on tools and `cursorGuidance` in diagnosis payload are strong Cursor-facing affordances
- Resource reads return pretty-printed JSON with correct mimeType

**Gaps / friction:**
- `MockRepositoryAnalyzer` ignores filesystem; `repoPath` alone does not trigger real inspection—defaults/hardcoded intake drive detections
- Tool JSON results are stringified to text in stdio layer (`toMcpToolContent`), not native MCP structured content
- In-process `lastDiagnosis` state is session-local; no persistence across server restarts
- No env/config surface yet (e.g. real analyzer toggle, policy overrides)
- `get_last_diagnosis` auto-runs diagnosis if none exists—may surprise agents expecting empty state

### 2026-07-03 - Scope-Based Requirement Tag Suggestions
**Status:** PENDING
**Files:** packages/contracts/src/diagnosis.ts, packages/core/src/requirement-tag-suggestions.ts, packages/core/src/diagnosis-result.ts, packages/mcp-server/src/index.ts, apps/desktop/src/features/architecture-policy/ArchitecturePolicySection.tsx, apps/desktop/src/styles.css
**Result:** Added scope-based tag suggestion API from repo inspection and diagnosis signals; desktop UI shows apply-one/apply-all chips; MCP exposes `suggest_requirement_tags`; default tags now start empty until applied.
**Files:** packages/contracts/src/mcp.ts, packages/contracts/src/diagnosis.ts, packages/mcp-server/src/desktop-bridge-client.ts, packages/mcp-server/src/stdio.ts, apps/desktop/src/electron/mcp-*.ts, apps/desktop/src/features/mcp-connection/McpConnectionSection.tsx, apps/desktop/src/lib/mcp-bridge.ts, apps/desktop/src/App.tsx
**Result:** Added MCP Connection dashboard step, localhost bridge for external stdio registration, Electron MCP client for manual spawn/connect, shared connection contracts, and real-time IPC state updates; awaiting user confirmation before success log.

### 2026-06-16 - MCP Back to Manual Button
**Status:** PENDING
**Files:** apps/desktop/src/electron/mcp-connection-service.ts, apps/desktop/src/electron/main.ts, apps/desktop/src/electron/preload.ts, apps/desktop/src/renderer.d.ts, apps/desktop/src/lib/mcp-bridge.ts, apps/desktop/src/features/mcp-connection/McpConnectionSection.tsx
**Result:** Added "Back to manual connection" when external MCP is active; clears bridge session, sets preferManualMode to block auto re-registration, restores manual connect controls; fixed external disconnect path bug.

### 2026-06-16 - MCP Auto-Connect Visibility Fix
**Status:** PARTIAL
**Files:** apps/desktop/src/App.tsx, apps/desktop/src/electron/mcp-bridge-server.ts, packages/mcp-server/src/desktop-bridge-client.ts, apps/desktop/src/features/mcp-connection/McpConnectionSection.tsx
**Result:** Next flow now routes through MCP Connection step; bridge manifest writes after listen; stdio retries registration ~60s; empty-state copy clarifies desktop-first + manual-mode blockers.

### 2026-06-16 - Flow Sidebar Step Unlock UX
**Status:** PENDING
**Files:** apps/desktop/src/App.tsx, apps/desktop/src/features/shell/FlowSidebar.tsx, apps/desktop/src/styles.css
**Result:** Steps 2–4 were locked until repo inspect + sequential Next clicks; MCP stayed always unlocked. Relaxed navigation after inspect to unlock Detect Profile through AI / Execution; added lockReason tooltips and disabled styling on locked sidebar steps.

### 2026-06-16 - Cursor API Connection UX Fix
**Status:** PENDING
**Files:** apps/desktop/src/lib/desktop-bridge.ts, apps/desktop/src/features/ai-settings/AiSettingsSection.tsx, apps/desktop/src/App.tsx, apps/desktop/src/lib/library-persistence.ts, instructions/refresh.md, instructions/request.md
**Result:** Investigated Cursor API never showing connected — root causes: browser preview mocked live keys as connected, no Test connection click required, MCP step confused with AI key, keys lost on reload. Blocked live keys in browser, added Electron runtime banner + step checklist, sessionStorage for keys, disambiguated MCP vs Cursor API; awaiting user confirmation.

### 2026-06-16 - Cursor Chat + Arkitect MCP Target Vision
**Status:** PENDING
**Files:** instructions/request.md
**Result:** Documented target flow: Cursor chat → Arkitect MCP decisions → Cursor AI implementation; connection layer exists, full orchestration loop not wired.

### 2026-06-16 - Dual-Path UX Principle
**Status:** PENDING
**Files:** instructions/request.md
**Result:** Captured equivalent chat vs desktop wizard routes and flexible A→B→C routing in request.md item #8; supersedes chat-first / wizard-fallback framing.

### 2026-07-03 - GitHub OAuth Cloudflare Config
**Status:** PARTIAL
**Files:** apps/licensing-worker/wrangler.jsonc, apps/licensing-worker/src/index.ts, apps/licensing-worker/.dev.vars.example, apps/licensing-worker/.env.example, .gitignore
**Result:** Added GitHub OAuth vars, arkitect-mcp.com worker routes, and GET /oauth/github/config; Cloudflare API push blocked by VPN/proxy — deploy and secrets must be run locally off VPN.

### 2026-07-03 - Desktop GitHub OAuth + Repo Picker
**Status:** PENDING
**Files:** packages/contracts/src/github.ts, packages/github/src/oauth.ts, packages/github/src/index.ts, apps/desktop/src/electron/github-oauth-*.ts, apps/desktop/src/electron/main.ts, apps/desktop/src/features/repo-connection/RepoConnectionSection.tsx, apps/desktop/src/App.tsx, apps/desktop/github-oauth.config.example.json
**Result:** Device-flow OAuth in Electron, encrypted token storage, repo/branch pickers; requires github-oauth.config.json Client ID; restart with `cd C:\Dev\Arkitect-mcp.com` then `pnpm dev:desktop` from repo root.

### 2026-07-03 - Install in Cursor MCP button
**Status:** PENDING
**Files:** apps/desktop/src/electron/mcp-cursor-install.ts, apps/desktop/src/features/mcp-connection/McpConnectionSection.tsx, packages/contracts/src/mcp.ts
**Result:** Dual-path MCP screen adds Install in Cursor — writes `.cursor/mcp.json`, opens Cursor deeplink, copy-link fallback; awaiting user verification.

### 2026-07-03 - Test Override Service
**Status:** PENDING
**Files:** packages/contracts/src/verification.ts, packages/core/src/test-override.ts, apps/desktop/src/electron/test-override-service.ts, apps/desktop/src/features/review-run/ReviewRunSection.tsx, apps/desktop/src/features/results-overview/ResultsOverviewSection.tsx
**Result:** Desktop test override discovers package.json scripts and runs lint/build/typecheck/unit/integration/verify via IPC bridge; replaces Cursor AI test runs from Review & Run; Results tests tab shows output.

### 2026-07-03 - Cloudflare Pages deploy setup
**Status:** PARTIAL
**Files:** apps/site/package.json, package.json, apps/site/README.md
**Result:** Added deploy:production/pages:create scripts; build verified. Wrangler login/API blocked by VPN/proxy — user must auth off VPN, deploy, then attach arkitect-mcp.com in dashboard.

### 2026-07-03 - Saved Profile Name Suggestions
**Status:** PENDING
**Files:** packages/contracts/src/desktop.ts, packages/core/src/profile-name-suggestions.ts, packages/core/src/profile-name-suggestions.test.ts, packages/core/src/index.ts, packages/core/src/browser.ts, apps/desktop/src/features/repo-connection/RepoConnectionSection.tsx
**Result:** Heuristic preset name suggestions from repo label, route (local/GitHub branch), and inspection stack hints; clickable chips fill Preset name field; AI enrichment deferred per request.md.

### 2026-07-03 - Instructions page fix + Cloudflare Pages Git auto-deploy
**Status:** SUCCESS
**Files:** apps/site/src/pages/InstructionsPage.tsx, apps/site/src/features/instructions/*, apps/site/wrangler.jsonc
**Result:** Instructions guide renders correctly; Cloudflare Git integration deploys site on push; user confirmed successful.
