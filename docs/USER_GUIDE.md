# Arkitect MCP User Guide

How to orchestrate **Arkitect MCP** (`@arkitect/mcp-server`) through an agentic platform such as **Cursor AI** — and how the agent uses Arkitect tools and resources to drive diagnosis-first architecture guidance on your local repos.

The marketing site ([arkitect-mcp.com](https://arkitect-mcp.com/#download-counter-heading)) handles free-spot claims and the Windows installer; [instructions](https://arkitect-mcp.com/instructions) mirror this guide. This doc covers **only** the desktop MCP server and agent workflow.

---

## Table of Contents

1. [What Is Arkitect MCP?](#what-is-arkitect-mcp)
2. [How Orchestration Works](#how-orchestration-works)
3. [Prerequisites](#prerequisites)
4. [Install and Build](#install-and-build)
5. [Configure Cursor](#configure-cursor)
6. [Verify Connection](#verify-connection)
7. [Orchestration Patterns](#orchestration-patterns)
8. [MCP Tools Reference](#mcp-tools-reference)
9. [MCP Resources Reference](#mcp-resources-reference)
10. [Environment Variables](#environment-variables)
11. [Desktop Bridge (Optional)](#desktop-bridge-optional)
12. [Other MCP Hosts](#other-mcp-hosts)
13. [Tutorials](#tutorials)
14. [Troubleshooting](#troubleshooting)
15. [Known Limitations](#known-limitations)

---

## What Is Arkitect MCP?

**Purpose:** Understand what the local MCP server is and what an AI agent can do with it.

**Arkitect MCP** is a stdio MCP server (`packages/mcp-server`) that runs on your machine. Cursor (or another MCP host) spawns it as a child process. The agent calls **tools** to diagnose repos, browse architecture catalogs, suggest requirement tags, and run verification — and reads **resources** for policy and catalog JSON without invoking a tool.

**Core behavior:**

1. Diagnose the repo before suggesting structural changes.
2. Continue inside a healthy detected architecture when confidence is high.
3. Report drift or spaghetti structure — do not auto-refactor without explicit intent.
4. Return `cursorGuidance` strings the agent should follow when implementing changes.

| Item | Value |
|------|-------|
| Package | `@arkitect/mcp-server` |
| Entrypoint | `packages/mcp-server/dist/stdio.js` |
| Transport | Stdio (`@modelcontextprotocol/sdk`) |
| Server name | `arkitect-mcp` (v0.2.0) |
| Tools | 10 (diagnosis, catalogs, tags, verification, tests) |
| Resources | 5 (`arkitect://` URIs) |

Nothing in this path phones home — the server reads repo paths from disk that **you** provide. There is no Arkitect cloud backend for MCP.

---

## How Orchestration Works

**Purpose:** See the bidirectional flow between you, the agent, and Arkitect MCP.

```
┌──────────────┐     natural language      ┌─────────────────┐
│     You      │ ────────────────────────► │  Agent (Cursor) │
│  (steering)  │ ◄──────────────────────── │                 │
└──────────────┘   summaries, code edits    └────────┬────────┘
                                                     │
                              MCP tool calls         │  MCP resource reads
                              (diagnose, list_*,     │  (arkitect://catalog/*)
                               verify, run_tests)    │
                                                     ▼
                                          ┌─────────────────────┐
                                          │  arkitect-mcp       │
                                          │  (local stdio proc) │
                                          │  @arkitect/core     │
                                          └──────────┬──────────┘
                                                     │
                                                     ▼
                                          Your repo on disk
```

### User → Agent → MCP tools

You describe intent in chat. The agent selects Arkitect tools:

- *"Diagnose this workspace before we add a reviews feature."* → `diagnose_repository`
- *"Which remix profile fits an event-driven SaaS?"* → `list_remix_profiles`
- *"Run lint and tests before I merge."* → `verify_codebase` or `run_test_suite`

The tool result includes structured JSON plus `cursorGuidance` — explicit strings the agent should honor when writing code.

### Agent → MCP resources

Agents can fetch read-only catalog and policy payloads without a tool call:

- `arkitect://catalog/patterns` — design pattern library
- `arkitect://catalog/remixes` — composed architecture profiles
- `arkitect://diagnosis/latest` — last diagnosis payload from this MCP session

Use resources when the agent needs background context; use tools when it needs fresh analysis or execution.

### Steering the agent

You control orchestration through prompts:

| Goal | What to ask |
|------|-------------|
| Diagnosis first | *"Call diagnose_repository on this repo and follow cursorGuidance before changing structure."* |
| Pick a remix | *"Read arkitect://catalog/remixes, compare top 3 for our stack, recommend one."* |
| Scope tags | *"Use suggest_requirement_tags and apply the top tags to catalogPreferences."* |
| Guardrails | *"If repo health is unhealthy, report drift only — do not refactor unless I say so."* |
| Verify | *"After changes, run verify_codebase and fix any failing steps."* |

### Dual path (chat vs desktop)

Equivalent outcomes via two routes (see `instructions/request.md`):

- **Chat path:** You drive in Cursor; Arkitect MCP returns decisions; Cursor AI implements.
- **Desktop path:** Arkitect Desktop wizard (`apps/desktop`) for repo intake, then MCP config install — same catalogs and diagnosis contracts.

You can mix paths: connect MCP in desktop, decide in chat.

---

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| **Node.js** | LTS (18+) |
| **pnpm** | `11.6.0` (root `package.json`) |
| **Git** | Clone the monorepo |
| **Cursor** (or MCP host) | To spawn and expose tools to the agent |
| **Local repo** | A project folder on disk for diagnosis targets |

---

## Install and Build

**Purpose:** Get a compiled stdio entrypoint on your machine.

**Download options:**

| Option | Link |
|--------|------|
| Website (free spot + installer) | [arkitect-mcp.com](https://arkitect-mcp.com/#download-counter-heading) |
| GitHub Releases | [Releases](https://github.com/ezequielcasillas1/Arkitect-MCP.AI/releases) |
| Windows installer (v0.2.0) | [Arkitect-Setup.exe](https://github.com/ezequielcasillas1/Arkitect-MCP.AI/releases/download/v0.2.0/Arkitect-Setup.exe) |

**GitHub source (no clone):** On [Releases](https://github.com/ezequielcasillas1/Arkitect-MCP.AI/releases), download **Source code (zip)** for a tagged version, extract, then run the commands below from that folder.

From the monorepo root:

```powershell
cd C:\Dev\Arkitect-mcp.com
pnpm install
pnpm build
```

Build the MCP server (required before Cursor can start it):

```powershell
pnpm --filter @arkitect/mcp-server build
```

Confirm the entrypoint exists:

```
packages/mcp-server/dist/stdio.js
```

Optional full workspace check:

```powershell
pnpm verify
```

**Outcome:** Cursor can launch `node packages/mcp-server/dist/stdio.js` as a local child process.

---

## Configure Cursor

**Purpose:** Wire Cursor to spawn Arkitect MCP via `.cursor/mcp.json`.

### Step 1 — Build

```powershell
pnpm --filter @arkitect/mcp-server build
```

### Step 2 — Add MCP config

Create or edit `.cursor/mcp.json` at your **workspace root** (or user-level MCP settings):

```json
{
  "mcpServers": {
    "arkitect-mcp": {
      "command": "node",
      "args": ["packages/mcp-server/dist/stdio.js"],
      "env": {
        "ARKITECT_DEFAULT_REPO_PATH": "C:\\Dev\\YourRepo",
        "ARKITECT_ANALYZER": "mock"
      }
    }
  }
}
```

**Path notes:**

- Use double backslashes or forward slashes for Windows paths in JSON.
- `args` is relative to the folder Cursor opens. If you open a subfolder, use an absolute path to `stdio.js`.
- Set `ARKITECT_DEFAULT_REPO_PATH` to the repo the agent should diagnose by default.

### Step 3 — Restart MCP

1. Open **Cursor Settings → MCP**.
2. Confirm `arkitect-mcp` enables without errors.
3. After code changes, rebuild and **restart** the MCP server — stdio processes do not hot-reload.

### Desktop-assisted install

Arkitect Desktop can write `.cursor/mcp.json` and open a Cursor deeplink from the MCP Connection step. Run `pnpm dev:desktop` if you prefer the wizard over manual JSON.

---

## Verify Connection

**Purpose:** Confirm tools and resources are visible to the agent.

1. **Cursor Settings → MCP** — `arkitect-mcp` shows green/enabled.
2. In chat, ask: *"List available arkitect-mcp tools."* — expect 12 tools including `diagnose_repository`, `analyze_refactoring_opportunities`, `verify_codebase`.
3. Ask: *"Read resource arkitect://catalog/patterns and summarize families."* — expect JSON catalog content.
4. First diagnosis: *"Call diagnose_repository for this workspace and summarize cursorGuidance."*

If any step fails, see [Troubleshooting](#troubleshooting).

---

## Orchestration Patterns

**Purpose:** Example workflows showing agent-driven Arkitect orchestration.

### Pattern 1 — Diagnosis before feature work

**You:**

> Before adding a reviews feature, diagnose this repo with Arkitect. Summarize platform, architecture, repo health, recommended action, and cursorGuidance. Do not refactor structure unless diagnosis says unhealthy and I approve.

**Agent flow:**

1. `diagnose_repository` with `repoPath`, `requestedOutcome`
2. Summarize `cursorGuidance` and `decision.recommendedAction`
3. Implement only inside the recommended architecture path

### Pattern 2 — Catalog-driven remix selection

**You:**

> Read arkitect://catalog/remixes and list_remix_profiles. Recommend the best remix for a moderate-complexity SaaS with vertical slices. Explain rationale from the catalog metadata.

**Agent flow:**

1. Read resource or call `list_remix_profiles`
2. Optionally `list_architecture_catalog` and `list_design_patterns` for cross-check
3. Present ranked recommendation; wait for your confirmation before scaffolding

### Pattern 3 — Requirement tags from repo scope

**You:**

> Run suggest_requirement_tags on this workspace, show suggested tags with reasons, and ask which to apply before we continue.

**Agent flow:**

1. `suggest_requirement_tags` with repo context
2. Present `suggestions` array
3. On your approval, pass selected tags via `catalogPreferences.requirementTags` in a follow-up `diagnose_repository` call

### Pattern 4 — Drift report only (no refactor)

**You:**

> Diagnose the repo. If health is unhealthy or architecture drift is detected, report findings only — do not migrate or rewrite files unless I explicitly request a refactor.

**Agent flow:**

1. `diagnose_repository`
2. `list_diagnosis_strategies` for continuation guardrails
3. Report only; honor *"Do not auto-refactor spaghetti structure..."* from `cursorGuidance`

### Pattern 4b — Refactoring Guru orchestration

**You:**

> Analyze refactoring opportunities for this repo. Rank Refactoring Guru techniques and follow the orchestration plan — report only unless I explicitly request structural changes.

**Agent flow:**

1. `analyze_refactoring_opportunities` with `repoPath` and intake context
2. Read `orchestrationPlan` phases and `cursorGuidance`
3. Use `list_refactoring_techniques` or `arkitect://catalog/refactoring` for technique reference URLs
4. Apply techniques only when explicit refactor intent is confirmed; run `verify_codebase` after each batch

### Pattern 5 — Verify after implementation

**You:**

> After your edits, run verify_codebase on this repo and fix any failing lint, build, typecheck, or test steps.

**Agent flow:**

1. `verify_codebase` with correct `repoPath`
2. Parse `steps` for failures
3. Fix code and re-run until `ok: true`

### Pattern 6 — Agent pulls policy context

**You:**

> Read arkitect://policy/default and explain how Arkitect decides between continue-in-place vs report-drift for this repo.

**Agent flow:**

1. Read `arkitect://policy/default`
2. Cross-reference with latest `arkitect://diagnosis/latest` or fresh `diagnose_repository`

---

## MCP Tools Reference

**Purpose:** When the agent should call each tool.

| Tool | When to call | Purpose |
|------|--------------|---------|
| `diagnose_repository` | Start of architecture work, before structural changes | Analyze intake signals, apply policy, return diagnosis + `cursorGuidance` |
| `get_last_diagnosis` | Need prior result without re-running | Return cached diagnosis; runs fresh if none exists |
| `list_architecture_catalog` | Choosing or explaining architecture options | Full architecture library with metadata |
| `list_remix_profiles` | Composed stack recommendations | Remix profiles (architectures + patterns + rationale) |
| `list_design_patterns` | Pattern-level guidance | Design patterns grouped by family |
| `suggest_requirement_tags` | Scoping a feature or policy pass | Tags derived from repo inspection and diagnosis signals |
| `list_diagnosis_strategies` | Explaining continuation guardrails | Strategies for healthy continuation, deferral, reporting |
| `verify_codebase` | Pre-merge or CI parity check | Runs `pnpm lint`, `build`, `typecheck`, `test` at repo root |
| `run_tests` | Test-only pass | Runs `pnpm test` |
| `run_test_suite` | Targeted suite | `suite`: `unit` \| `integration` \| `all` |
| `list_refactoring_techniques` | Refactoring Guru catalog browse | Techniques grouped by category with reference URLs |
| `analyze_refactoring_opportunities` | Code smell analysis before refactors | Rank techniques, orchestration plan, `cursorGuidance` — report only |

**Common inputs for diagnosis tools:**

| Field | Description |
|-------|-------------|
| `repoPath` | Absolute path to project root (not system folders) |
| `repoName` | Display name for intake |
| `requestedOutcome` | What you are trying to accomplish |
| `catalogPreferences.selectedRemixId` | Optional remix override |
| `catalogPreferences.requirementTags` | Tags to apply on diagnosis |

**Example diagnosis prompt:**

> Use diagnose_repository on this workspace. Summarize platform, architecture, repo health, and recommended action. List every cursorGuidance line.

---

## MCP Resources Reference

**Purpose:** Read-only URIs for catalog and policy context.

| URI | Content | When to read |
|-----|---------|--------------|
| `arkitect://diagnosis/latest` | Latest diagnosis MCP payload | After a diagnosis tool call; session-local cache |
| `arkitect://policy/default` | Default architecture-first policy | Before explaining continue vs report-drift rules |
| `arkitect://catalog/architectures` | Architecture catalog JSON | Architecture comparison without tool overhead |
| `arkitect://catalog/remixes` | Remix profile catalog | Remix selection workflows |
| `arkitect://catalog/patterns` | Design pattern catalog | Pattern-fit discussions |
| `arkitect://catalog/refactoring` | Refactoring Guru technique catalog | Refactoring technique browse and agent orchestration |

Resources appear in Cursor under the MCP server's resource list. Prefer tools when fresh analysis or execution is required.

---

## Environment Variables

Set in `.cursor/mcp.json` `env` block or your shell:

| Variable | Default | Description |
|----------|---------|-------------|
| `ARKITECT_DEFAULT_REPO_PATH` | `process.cwd()` | Default repo root when tools omit `repoPath` |
| `ARKITECT_ANALYZER` | `mock` | Set to `real` when real filesystem analysis is wired |
| `ARKITECT_SKIP_DESKTOP_BRIDGE` | unset | Set to `1` to skip desktop bridge registration |
| `ARKITECT_DESKTOP_BRIDGE_URL` | loopback default | Override bridge base URL |
| `ARKITECT_DESKTOP_BRIDGE_MANIFEST` | platform default | Path to bridge manifest JSON |

**Bridge manifest defaults:**

- **Windows:** `%LOCALAPPDATA%\arkitect-desktop\mcp-bridge.json`
- **macOS/Linux:** `$XDG_CONFIG_HOME/arkitect-desktop/mcp-bridge.json` or `~/.config/arkitect-desktop/mcp-bridge.json`

---

## Desktop Bridge (Optional)

When **Arkitect Desktop** is running, the MCP server registers tool/resource metadata with a localhost HTTP bridge:

1. Desktop writes `mcp-bridge.json` (port + token).
2. MCP POSTs to `/register`; heartbeats every 15s.
3. Desktop UI reflects live MCP availability.

MCP works **without** desktop. If desktop is off, stderr may show:

```
[arkitect-mcp] Desktop bridge registration timed out. Start Arkitect Desktop first, then reload MCP tools.
```

To disable bridge attempts:

```json
"env": { "ARKITECT_SKIP_DESKTOP_BRIDGE": "1" }
```

---

## Other MCP Hosts

Claude Desktop, Windsurf, and other MCP-capable clients follow the same pattern: stdio command pointing at `packages/mcp-server/dist/stdio.js`, equivalent env vars, restart the server after rebuilds. Config file location and UI differ; the Arkitect surface (12 tools, 6 resources) is identical.

---

## Tutorials

### Tutorial 1 — Zero to first diagnosis (10 minutes)

1. Clone repo, `pnpm install`, `pnpm --filter @arkitect/mcp-server build`.
2. Add `.cursor/mcp.json` (see [Configure Cursor](#configure-cursor)).
3. Restart MCP in Cursor settings.
4. Chat: *"Call diagnose_repository for this workspace and summarize cursorGuidance."*
5. Optional: *"Read arkitect://catalog/remixes and suggest one aligned with the diagnosis."*

**Success:** Agent returns diagnosis JSON with platform, architecture, health, recommended action, and guidance strings.

### Tutorial 2 — Catalog exploration (5 minutes)

1. Ensure MCP is connected.
2. *"Call list_design_patterns and group results by family with one-line fit notes."*
3. *"Call list_remix_profiles and compare two profiles for a CRUD API with moderate complexity."*

### Tutorial 3 — Full orchestration loop (15 minutes)

1. *"Diagnose this repo before we add scope-based requirement tags."*
2. *"Run suggest_requirement_tags; show suggestions; I'll pick tags to apply."*
3. *"Re-run diagnose_repository with my chosen tags in catalogPreferences."*
4. *"Implement [feature] following cursorGuidance — stay inside the recommended architecture."*
5. *"Run verify_codebase and report results."*

### Tutorial 4 — Verify-only via MCP (5 minutes)

1. *"Use verify_codebase on C:\Dev\Arkitect-mcp.com and list any failing steps."*
2. *"Run run_test_suite with suite unit on this repo."*

---

## Troubleshooting

### MCP server not appearing in Cursor

**Cause:** Missing build, wrong path, or Node not on PATH.

**Fix:**

1. Verify `packages/mcp-server/dist/stdio.js` exists.
2. Run `pnpm --filter @arkitect/mcp-server build`.
3. Use absolute path in `args` if workspace root differs.
4. Check Cursor MCP logs for stderr.

### Tools fail or return empty diagnosis

**Cause:** Wrong `repoPath`, or analyzer still in mock mode.

**Fix:**

1. Point `repoPath` at a real project root — not `C:\Windows\System32`.
2. Set `ARKITECT_DEFAULT_REPO_PATH` in MCP env.
3. Mock analyzer uses heuristics, not deep filesystem scan — supply `repoName`, `requestedOutcome`, and `repoSummary` for better intake until `ARKITECT_ANALYZER=real` is wired.

### Structured content / output schema errors

**Cause:** Stale MCP process after code changes.

**Fix:** Rebuild MCP server, fully restart the stdio process in Cursor. See `bugfixes.md` for current status.

### Desktop bridge registration timeout

**Cause:** Desktop not running.

**Fix:** Start with `pnpm dev:desktop`, or set `ARKITECT_SKIP_DESKTOP_BRIDGE=1`. Tools work without the bridge.

### verify_codebase fails immediately

**Cause:** Target is not a pnpm monorepo root or scripts missing.

**Fix:** Ensure `repoPath` has `package.json` with expected scripts (`lint`, `build`, `typecheck`, `test`).

### Resource read returns error

**Cause:** Invalid URI or server not connected.

**Fix:** Use exact URIs from [MCP Resources Reference](#mcp-resources-reference). Restart MCP if session dropped.

---

## Known Limitations

| Item | Status |
|------|--------|
| **Repo analyzer** | Mock by default — `diagnose_repository` uses simulated detections unless real analyzer is wired |
| **Session diagnosis cache** | `get_last_diagnosis` / `arkitect://diagnosis/latest` are in-process; lost on MCP restart |
| **MCP rebuild** | Rebuild + restart Cursor MCP manually after pulling server changes |
| **Licensing worker** | Deferred — see `instructions/future-licensing-worker.md` |
| **Marketing site** | Separate from MCP; not covered in this guide |

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| [README.md](../README.md) | Monorepo overview and commands |
| [apps/desktop/README.md](../apps/desktop/README.md) | Desktop wizard and MCP install helper |
| [instructions/request.md](../instructions/request.md) | Product backlog (dual-path UX, chat orchestration) |

---

*Last updated: July 2026 — arkitect-mcp v0.2.0.*
