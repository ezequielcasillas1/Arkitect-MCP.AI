# Arkitect User Guide

A detailed tutorial manual for **arkitect-mcp.com** — the marketing site, Supabase-backed community features, and the **Arkitect MCP server** that Cursor and other AI clients can call for diagnosis-first architecture guidance.

---

## Table of Contents

1. [What Is Arkitect?](#what-is-arkitect)
2. [System Overview](#system-overview)
3. [Prerequisites](#prerequisites)
4. [Initial Setup](#initial-setup)
5. [Environment Variables](#environment-variables)
6. [Supabase Setup](#supabase-setup)
7. [Running the Website Locally](#running-the-website-locally)
8. [Using the Website](#using-the-website)
9. [Deploying to Cloudflare Pages](#deploying-to-cloudflare-pages)
10. [MCP Server Overview](#mcp-server-overview)
11. [Configuring the MCP Server in Cursor](#configuring-the-mcp-server-in-cursor)
12. [MCP Tools Reference](#mcp-tools-reference)
13. [MCP Resources Reference](#mcp-resources-reference)
14. [Desktop Bridge Integration](#desktop-bridge-integration)
15. [Desktop App (Optional)](#desktop-app-optional)
16. [Database Schema Overview](#database-schema-overview)
17. [Step-by-Step Tutorials](#step-by-step-tutorials)
18. [Troubleshooting](#troubleshooting)
19. [Known Limitations & Manual Steps](#known-limitations--manual-steps)

---

## What Is Arkitect?

**Arkitect** is a diagnosis-first architecture reasoning product. It scans a repository, surfaces detected platform, workload, architecture, health, and intent signals, and recommends how to continue — without forcing rewrites when the existing structure is healthy.

This repository delivers two primary surfaces:

| Surface | Location | Purpose |
|---------|----------|---------|
| **Marketing site** | `apps/site` | Landing page, free-download counter, visitor reviews, install instructions |
| **MCP server** | `packages/mcp-server` | Stdio MCP server exposing diagnosis tools, catalogs, and verification helpers for Cursor |

Additional monorepo packages (`apps/desktop`, `packages/core`, `packages/contracts`, etc.) support the desktop workbench and shared catalog logic. The site and MCP server share the same product philosophy but are deployed independently.

**Core product rules encoded in the scaffold:**

1. Diagnose the repo before suggesting structural changes.
2. Continue inside a healthy detected architecture automatically when confidence is high.
3. Report drift or spaghetti structure clearly — do not auto-refactor without explicit intent.
4. Expose the same diagnosis context to MCP clients (Cursor) and the desktop shell.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        arkitect-mcp.com                         │
│  (Cloudflare Pages — static Vite/React SPA)                     │
│                                                                 │
│  Landing · Download Counter · Reviews · Install · Connect       │
└───────────────────────────┬─────────────────────────────────────┘
                            │ VITE_SUPABASE_URL / ANON_KEY
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              Dedicated Supabase project (Arkitect)              │
│  RPC: arkitect_get_download_stats, arkitect_claim_download_slot │
│  Table: arkitect_reviews (RLS + rate-limit trigger)             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     Cursor / AI MCP client                      │
│                         .cursor/mcp.json                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │ stdio (node packages/mcp-server/dist/stdio.js)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   @arkitect/mcp-server                          │
│  Tools: diagnose_repository, list_*_catalog, verify_codebase…   │
│  Resources: arkitect://diagnosis/latest, arkitect://catalog/*   │
└───────────────────────────┬─────────────────────────────────────┘
                            │ optional HTTP bridge
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              Arkitect Desktop (apps/desktop)                    │
│  Local repo intake, wizard, MCP bridge manifest                 │
└─────────────────────────────────────────────────────────────────┘
```

### Vertical slice architecture (site)

The marketing site follows **vertical slices** — each feature owns its types, data-access gateway, hooks, and UI:

| Slice | Path | Responsibility |
|-------|------|----------------|
| Download counter | `apps/site/src/features/download-counter/` | Capped free-spot claims, progress bar, dedup by visitor |
| Reviews | `apps/site/src/features/reviews/` | Public submit + list, rate limiting, moderation-friendly RLS |

Components never call Supabase directly. Each slice exposes a narrow `*Gateway` interface in `data-access.ts` that swaps between **live Supabase** and **in-memory/localStorage mock** based on env configuration.

---

## Prerequisites

| Requirement | Version / notes |
|-------------|-----------------|
| **Node.js** | LTS recommended (18+) |
| **pnpm** | `11.6.0` (declared in root `package.json`) |
| **Git** | Clone and work in the monorepo |
| **Supabase project** | Dedicated Arkitect project (optional for local UI; required for live counter/reviews) |
| **Cursor** (or MCP-capable client) | For MCP server usage |
| **Cloudflare account** | For production site deployment (optional for local dev) |

---

## Initial Setup

From the monorepo root (example: `C:\Dev\Arkitect-mcp.com`):

```powershell
cd C:\Dev\Arkitect-mcp.com
pnpm install
pnpm build
```

Verify the full workspace:

```powershell
pnpm verify
```

This runs lint, build, typecheck, and tests across packages.

**Build the MCP server specifically** (required before Cursor can start it):

```powershell
pnpm --filter @arkitect/mcp-server build
```

Confirm the stdio entrypoint exists:

```
packages/mcp-server/dist/stdio.js
```

---

## Environment Variables

### Site (`apps/site`)

Create `apps/site/.env.local` (git-ignored) from the example:

```powershell
copy apps\site\.env.example apps\site\.env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | For live data | Supabase project URL (publishable, safe in browser bundle) |
| `VITE_SUPABASE_ANON_KEY` | For live data | Supabase anon/publishable key |

If either variable is missing, the site **automatically uses mock gateways** — the UI still works with seeded/localStorage data.

### MCP server (`packages/mcp-server`)

Set these in `.cursor/mcp.json` under the server's `env` block, or in your shell when running manually:

| Variable | Default | Description |
|----------|---------|-------------|
| `ARKITECT_DEFAULT_REPO_PATH` | `process.cwd()` | Default repo root for tools that accept `repoPath` |
| `ARKITECT_ANALYZER` | `mock` | Set to `real` when real filesystem analysis is wired |
| `ARKITECT_SKIP_DESKTOP_BRIDGE` | unset | Set to `1` to skip desktop bridge registration |
| `ARKITECT_DESKTOP_BRIDGE_URL` | `http://127.0.0.1:<port>` | Override bridge base URL |
| `ARKITECT_DESKTOP_BRIDGE_MANIFEST` | platform default | Path to bridge manifest JSON |

**Bridge manifest default locations:**

- **Windows:** `%LOCALAPPDATA%\arkitect-desktop\mcp-bridge.json`
- **macOS/Linux:** `$XDG_CONFIG_HOME/arkitect-desktop/mcp-bridge.json` or `~/.config/arkitect-desktop/mcp-bridge.json`

---

## Supabase Setup

### Dedicated project

Use a **dedicated** Supabase project for Arkitect. Do not reuse unrelated projects.

Migrations live in:

```
apps/site/supabase/migrations/
  0001_arkitect_download_counter.sql
  0002_arkitect_reviews.sql
```

Apply them via the Supabase SQL editor, Supabase CLI, or the project's Supabase MCP integration.

See `apps/site/supabase/README.md` for verification notes and reset commands.

### Getting keys

1. Open your Supabase project dashboard.
2. Go to **Project Settings → API**.
3. Copy **Project URL** → `VITE_SUPABASE_URL`.
4. Copy **anon public** key → `VITE_SUPABASE_ANON_KEY`.

These values are publishable and safe for the browser bundle.

### Mock mode (no Supabase)

Without env vars:

- **Download counter** uses localStorage with a seeded count (~137) and in-memory dedup.
- **Reviews** uses localStorage with two seed reviews plus any you submit locally.

Ideal for UI development without a backend.

---

## Running the Website Locally

```powershell
pnpm dev:site
```

Vite serves the app (default `http://localhost:5173`). Hot reload is enabled.

**Routes:**

| Path | Page |
|------|------|
| `/` | Landing page |
| `/reviews` | Reviews form + community list |

Build for production:

```powershell
pnpm --filter @arkitect/site build
```

Output: `apps/site/dist/`

---

## Using the Website

### Navigation

The top **NavBar** links to **Home** (`/`) and **Reviews** (`/reviews`). The brand logo returns to the landing page.

### Landing page sections

Scroll order on `/`:

1. **Hero** — Headline, value proposition, Three.js **Arkitect logo** (lazy-loaded), and CTAs:
   - *Get the free download* → scrolls to download counter
   - *See install steps* → scrolls to install section
   - *See what people are saying* → navigates to `/reviews`

2. **Download counter** — Live (or mock) claim count for the first 1,000 free users.

3. **Install section** — Four-step guide with Lucide icons and copy-paste MCP config.

4. **Why Arkitect** — Three pillars: diagnose first, continue what's healthy, report before refactor.

5. **Pricing** — Free for first 1,000; membership pricing planned afterward.

6. **AI Defaults** — Provider-agnostic catalog; Composer 2.5 recommended default.

7. **Connect** — Reddit and X links for support and feedback.

**Motion & UX:** Sections use scroll-reveal animations (`RevealSection`). The hero has an entrance animation. The 3D logo falls back to a placeholder while loading.

### Download counter

**Location:** Landing page, `#download-counter-heading`

**What it does:**

- Shows `claimed / 1,000` with a progress bar and milestone markers every 100 spots.
- **Claim your free spot** — one claim per browser (anonymous `visitor_id` in localStorage).
- No credit card required.
- When all spots are taken, the button disables for new visitors.
- Returning visitors who already claimed see **You're on the list**.

**Behind the scenes:**

- Visitor ID: `apps/site/src/lib/visitor-id.ts` → `localStorage` key `arkitect_visitor_id`.
- Claim flag: `arkitect_download_claimed` in localStorage.
- Live path: Supabase RPC `arkitect_claim_download_slot(p_visitor_id)`.
- Dedup is enforced server-side; repeat claims return `already_claimed: true` without double-counting.

### Reviews page

**Location:** `/reviews`

**Leave a review:**

1. Enter name (1–80 characters).
2. Select rating (1–5 stars).
3. Write message (1–1,000 characters).
4. Submit.

**Rate limits (live Supabase):** Max 3 submissions per visitor per hour (database trigger).

**Moderation:** Reviews can be hidden via `is_visible = false` in Supabase dashboard (service role). Anon users cannot edit or delete reviews after posting.

**Spam protection:** Hidden honeypot field on the form.

**Community list:** Shows up to 100 visible reviews, newest first.

### Install section

**Location:** Landing page, `#install-heading`

Four steps:

| Step | Icon | Action |
|------|------|--------|
| 1 | Download | Claim your free spot on the counter |
| 2 | Terminal | Build the MCP server (`pnpm --filter @arkitect/mcp-server build`) |
| 3 | Plug | Add MCP config to Cursor |
| 4 | ScanSearch | Run your first diagnosis in chat |

The section includes a ready-to-copy **Cursor MCP config** block (see [Configuring the MCP Server](#configuring-the-mcp-server-in-cursor)).

### Connect section

**Location:** Bottom of Home and Reviews pages.

Links to Reddit (`u/Ok-Address3409`) and X (`@casiezeq`) for bugs, feature requests, and feedback.

---

## Deploying to Cloudflare Pages

The site is a static Vite SPA prepared for Cloudflare Pages.

**Build output:** `apps/site/dist`

**SPA routing:** `apps/site/public/_redirects` contains:

```
/*  /index.html  200
```

**Wrangler config:** `apps/site/wrangler.jsonc`

### CLI deploy

```powershell
pnpm --filter @arkitect/site build
pnpm --filter @arkitect/site deploy
```

### Dashboard (Git integration)

| Setting | Value |
|---------|-------|
| Root directory | `apps/site` |
| Build command | `pnpm install --frozen-lockfile && pnpm --filter @arkitect/site build` (from repo root) |
| Output directory | `dist` |
| Environment variables | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |

### Domain note

`apps/licensing-worker` reserves Worker routes on `arkitect-mcp.com` for `/oauth/*`, `/webhooks/*`, `/licenses/*`, and `/entitlements/*`. The Pages project should serve the site root; those paths route to the licensing worker when both are attached.

Custom domain DNS attachment must be done in your Cloudflare dashboard — it is not automated from this repo.

---

## MCP Server Overview

**Package:** `@arkitect/mcp-server`  
**Binary:** `arkitect-mcp` → `dist/stdio.js`  
**Transport:** Stdio via `@modelcontextprotocol/sdk`  
**Server name:** `arkitect-mcp` (v0.1.0)

The server exposes:

- **10 tools** — diagnosis, catalogs, requirement tags, verification, tests
- **5 resources** — latest diagnosis, default policy, architecture/remix/pattern catalogs

It uses `@arkitect/core` for catalog and diagnosis logic and `@arkitect/repo-analyzer` (currently mock) for repo signals.

On startup, it optionally registers with the **Arkitect Desktop bridge** if the desktop app is running.

---

## Configuring the MCP Server in Cursor

### Step 1 — Build the server

```powershell
pnpm --filter @arkitect/mcp-server build
```

### Step 2 — Add project MCP config

Create or edit `.cursor/mcp.json` at your **project root** (or user-level MCP settings):

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

**Windows paths:** Use double backslashes in JSON or forward slashes.

**Monorepo note:** The `args` path is relative to the workspace root where Cursor opens the project. If you open a subfolder, adjust the path or use an absolute path to `stdio.js`.

### Step 3 — Restart MCP in Cursor

1. Open **Cursor Settings → MCP**.
2. Confirm `arkitect-mcp` appears and enables successfully.
3. If you changed code, rebuild and **restart** the MCP server (stdio processes do not hot-reload).

### Step 4 — Verify tools load

In Cursor chat, the agent should see tools such as `diagnose_repository`, `list_architecture_catalog`, and `verify_codebase`.

### Alternative: Desktop-assisted install

The Arkitect Desktop app (`apps/desktop`) can write `.cursor/mcp.json` and open a Cursor deeplink for one-click MCP install. Run `pnpm dev:desktop` and use the MCP Connection step in the wizard.

---

## MCP Tools Reference

| Tool | Input | Purpose |
|------|-------|---------|
| `diagnose_repository` | `repoPath`, `repoName`, `repoSummary`, `requestedOutcome`, `catalogPreferences` | Analyze intake signals, apply policy, return MCP-friendly diagnosis payload |
| `get_last_diagnosis` | — | Return the most recent diagnosis (runs fresh if none cached) |
| `list_architecture_catalog` | — | Full architecture library with metadata |
| `list_remix_profiles` | — | Remix profiles (composed architectures + patterns) |
| `list_design_patterns` | — | Design pattern catalog by family |
| `suggest_requirement_tags` | Same as `diagnose_repository` | Suggest requirement tags from repo scope and signals |
| `list_diagnosis_strategies` | — | Strategies for healthy continuation, guardrails, deferral |
| `verify_codebase` | `repoPath` | Run lint, build, typecheck, and test from repo root |
| `run_tests` | `repoPath` | Run all tests (`pnpm test`) |
| `run_test_suite` | `repoPath`, `suite` (`unit` \| `integration` \| `all`) | Run a specific test suite |

### Example: First diagnosis

Ask Cursor:

> Use the `diagnose_repository` tool on this workspace. Summarize platform, architecture, repo health, and recommended action.

Optional arguments:

```json
{
  "repoPath": "C:\\Dev\\MyProject",
  "repoName": "MyProject",
  "requestedOutcome": "Add a new reviews feature without breaking vertical slices"
}
```

### Example: Browse catalogs

> Call `list_remix_profiles` and recommend one for an event-driven SaaS with moderate complexity.

### Example: Verify before merge

> Run `verify_codebase` on this repo and report any failing steps.

**Important:** Point `repoPath` at a real project root — not system folders like `C:\Windows\System32`.

---

## MCP Resources Reference

Resources are read-only JSON payloads addressable by URI:

| URI | Content |
|-----|---------|
| `arkitect://diagnosis/latest` | Latest diagnosis MCP payload |
| `arkitect://policy/default` | Default architecture-first policy |
| `arkitect://catalog/architectures` | Architecture catalog |
| `arkitect://catalog/remixes` | Remix profile catalog |
| `arkitect://catalog/patterns` | Design pattern catalog |

In Cursor, resources appear under the MCP server's resource list. Agents can read them for context without invoking a tool.

---

## Desktop Bridge Integration

When **Arkitect Desktop** is running, the MCP stdio server attempts to register with a local HTTP bridge:

1. Desktop writes `mcp-bridge.json` (port + token).
2. MCP server POSTs to `/register` with tool/resource metadata.
3. Heartbeats every 15 seconds keep the session alive.

If desktop is not running, the server still works standalone — you will see a stderr message:

```
[arkitect-mcp] Desktop bridge registration timed out. Start Arkitect Desktop first, then reload MCP tools.
```

To disable bridge registration:

```json
"env": { "ARKITECT_SKIP_DESKTOP_BRIDGE": "1" }
```

---

## Desktop App (Optional)

The desktop shell (`apps/desktop`) provides a guided wizard: repo intake → profile → policy → AI/MCP → review → results.

```powershell
pnpm dev:desktop
```

After build:

```powershell
pnpm start:desktop
```

Use **Connect Repo** to point at a local folder, then walk through diagnosis steps. The desktop shares the same catalog and diagnosis contracts as the MCP server.

See root `README.md` → **Desktop local testing** for the full flow.

---

## Database Schema Overview

### Download counter (`0001_arkitect_download_counter.sql`)

**Tables:**

| Table | Purpose |
|-------|---------|
| `arkitect_download_counter` | Singleton row (`id = 1`) with `claimed_count` and `spot_limit` (default 1000) |
| `arkitect_download_claims` | One row per unique `visitor_id`; dedup key |

**Security:**

- RLS enabled; no direct table policies for anon/authenticated.
- All access through `SECURITY DEFINER` RPCs.
- Direct table grants revoked from anon/authenticated.

**RPCs:**

| Function | Access | Behavior |
|----------|--------|----------|
| `arkitect_get_download_stats()` | anon | Returns `{ claimed_count, spot_limit }` |
| `arkitect_claim_download_slot(text)` | anon | Dedup insert + atomic capped increment; returns `{ claimed_count, spot_limit, already_claimed }` |

### Reviews (`0002_arkitect_reviews.sql`)

**Table:** `arkitect_reviews`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `visitor_id` | text | 8–128 chars; rate-limit key |
| `name` | text | 1–80 chars |
| `rating` | smallint | 1–5 |
| `message` | text | 1–1000 chars |
| `is_visible` | boolean | Default `true`; set `false` to moderate |
| `created_at` | timestamptz | Ordering |

**RLS policies:**

- `SELECT` — visible rows only (`is_visible = true`)
- `INSERT` — validated field lengths and rating
- No `UPDATE`/`DELETE` for anon (moderation via dashboard/service role)

**Trigger:** `arkitect_enforce_review_rate_limit` — max 3 inserts per `visitor_id` per hour.

### Reset counter before launch

```sql
truncate table public.arkitect_download_claims;
update public.arkitect_download_counter set claimed_count = 0 where id = 1;
```

---

## Step-by-Step Tutorials

### Tutorial A — Local site with mock data (5 minutes)

1. `pnpm install && pnpm dev:site`
2. Open `http://localhost:5173`
3. Scroll to the download counter → click **Claim your free spot**
4. Navigate to **Reviews** → submit a test review
5. Confirm seed/mock data appears in the list

No Supabase required.

---

### Tutorial B — Connect live Supabase (15 minutes)

1. Create or open the dedicated Arkitect Supabase project.
2. Apply migrations from `apps/site/supabase/migrations/`.
3. Copy URL and anon key into `apps/site/.env.local`.
4. Restart `pnpm dev:site`.
5. Claim a spot — count should persist across browser refresh.
6. Submit a review — row should appear in Supabase Table Editor.
7. Try submitting 4 reviews in one hour — fourth should fail with rate-limit message.

---

### Tutorial C — First MCP diagnosis in Cursor (10 minutes)

1. `pnpm --filter @arkitect/mcp-server build`
2. Add `.cursor/mcp.json` (see [Configuring the MCP Server](#configuring-the-mcp-server-in-cursor)).
3. Restart MCP in Cursor settings.
4. In chat: *"Call diagnose_repository for this workspace and summarize cursorGuidance."*
5. Optionally read resource `arkitect://catalog/remixes` for remix options.

---

### Tutorial D — Deploy site to Cloudflare Pages (20 minutes)

1. Complete Tutorial B (live Supabase recommended for production).
2. `pnpm --filter @arkitect/site build`
3. Create Cloudflare Pages project pointing at this repo.
4. Set build settings and env vars (see [Deploying](#deploying-to-cloudflare-pages)).
5. Deploy and verify `/` and `/reviews` routes (SPA fallback).
6. Attach custom domain `arkitect-mcp.com` in Cloudflare dashboard if desired.

---

### Tutorial E — Full verify pipeline via MCP

1. Ensure MCP server is running in Cursor.
2. Ask: *"Use verify_codebase on C:\Dev\Arkitect-mcp.com and list any failing steps."*
3. For tests only: *"Run run_test_suite with suite unit on this repo."*

The tool executes `pnpm lint`, `build`, `typecheck`, and `test` (or subsets) from the target repo root.

---

## Troubleshooting

### Site shows mock counter (~137) instead of live count

**Cause:** `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` missing or wrong.

**Fix:**

1. Confirm `apps/site/.env.local` exists with both vars.
2. Restart Vite dev server (env is read at startup).
3. Check browser network tab for failed Supabase RPC calls.

---

### "Could not load the live claim count"

**Cause:** Supabase RPC unreachable, migration not applied, or network error.

**Fix:**

1. Apply `0001_arkitect_download_counter.sql`.
2. Test RPC in Supabase SQL editor: `select * from arkitect_get_download_stats();`
3. Confirm anon key has `EXECUTE` on the functions (grants are in migration).

---

### Claim button works but count does not increment

**Cause:** Counter at limit, or concurrent claim edge case.

**Fix:**

1. Check `claimed_count` vs `spot_limit` in Supabase.
2. Reset demo data if needed (see [Reset counter](#reset-counter-before-launch)).

---

### Reviews submit fails with rate-limit message

**Cause:** More than 3 reviews from same browser within one hour.

**Fix:** Wait one hour or test from a different browser/incognito (new `visitor_id`).

---

### MCP server not appearing in Cursor

**Cause:** Missing build, wrong path, or Node not on PATH.

**Fix:**

1. Verify `packages/mcp-server/dist/stdio.js` exists.
2. Run `pnpm --filter @arkitect/mcp-server build`.
3. Use absolute path in `args` if workspace root differs.
4. Check Cursor MCP logs for stderr output.

---

### MCP tools error on "structured content" / output schema

**Cause:** Known gap — some tool results may not return MCP `structuredContent` matching declared `outputSchema`.

**Fix:** Rebuild MCP server after pulling latest `mcp-result-mapper` fixes, then **fully restart** the stdio MCP process in Cursor. See `bugfixes.md` and `instructions/refresh.md` for current status.

---

### Desktop bridge registration timeout

**Cause:** Arkitect Desktop not running.

**Fix:** Start desktop with `pnpm dev:desktop`, or set `ARKITECT_SKIP_DESKTOP_BRIDGE=1`. MCP tools work without the bridge.

---

### `/reviews` 404 on production

**Cause:** SPA fallback not configured.

**Fix:** Ensure `_redirects` is deployed (`/* /index.html 200`) or equivalent Cloudflare Pages SPA setting.

---

### Three.js logo blank or slow

**Cause:** WebGL unavailable or lazy load in progress.

**Fix:** The hero shows a placeholder until `ArkitectLogo3D` loads. Try a WebGL-capable browser; check console for Three.js errors.

---

## Known Limitations & Manual Steps

These require your action outside the repo:

| Item | Status |
|------|--------|
| **Supabase keys** | You must create `.env.local` and Cloudflare env vars |
| **Migrations** | Apply SQL files to your dedicated Supabase project |
| **Custom domain** | Attach `arkitect-mcp.com` in Cloudflare dashboard |
| **MCP rebuild after code changes** | Rebuild + restart Cursor MCP manually |
| **Repo analyzer** | Still mock — `diagnose_repository` uses simulated detections unless `ARKITECT_ANALYZER=real` when real mode is wired |
| **Licensing / Stripe worker** | Deferred — see `instructions/future-licensing-worker.md` |
| **Logo asset** | Site uses generated Three.js logo; custom brand asset noted as future item in `request.md` |

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| [README.md](../README.md) | Monorepo overview and commands |
| [apps/site/README.md](../apps/site/README.md) | Site deployment quick reference |
| [apps/site/supabase/README.md](../apps/site/supabase/README.md) | Supabase migrations and verification |
| [instructions/request.md](../instructions/request.md) | Feature backlog (internal) |
| [instructions/future-licensing-worker.md](../instructions/future-licensing-worker.md) | Licensing worker deploy guide |

---

*Last updated: July 2026 — matches Arkitect site v0.1.0 and MCP server v0.1.0 scaffold.*
