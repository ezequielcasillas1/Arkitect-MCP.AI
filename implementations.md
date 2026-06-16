# Implementations

Use concise implementation notes after review.

Template:
### [Date] - [Feature]
**Status:** [PENDING/PARTIAL/FAILURE]
**Files:** [file1, file2]
**Result:** [What changed and why]

### 2026-06-14 - Arkitect Catalog Library
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

### 2026-06-16 - Dual MCP Connection Paths
**Status:** PENDING
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
