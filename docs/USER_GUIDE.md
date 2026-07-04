# Arkitect User Guide

A self-service tutorial manual for **arkitect-mcp.com** — the marketing site, optional Supabase-backed community features, and the **Arkitect MCP server** that Cursor and other AI clients call for diagnosis-first architecture guidance.

**How this guide works:** Every setup step is something **you** run locally or in **your** cloud accounts (Supabase, Cloudflare, Cursor). Arkitect ships open-source code, SQL migration files, and documentation. It does **not** provision infrastructure for you, log into your dashboards, or collect your Supabase credentials on any Arkitect-operated server.

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

**Purpose:** Understand what Arkitect is, which parts live in this repo, and how the marketing site differs from the MCP server.

**What you do:** Clone the repo, run builds locally, optionally deploy your own instance, and configure Cursor on your machine.

**What Arkitect does:** Provides the product code, catalogs, diagnosis logic, and this guide — no hosted setup service or remote account linking.

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

**Purpose:** Separate **MCP core** (what most users need) from **optional site slices** — and see one **reference** deployment, not the only valid setup.

**What you do:** Pick only the pieces you need. Many users need just the MCP server plus any MCP client. The marketing site, download counter, reviews, Cloudflare hosting, Supabase, and desktop app are optional — fork, swap, or omit them.

**What Arkitect does:** Ships modular packages. The MCP core runs as a local stdio process against repos on your disk. Site features use **your** backend (or mock gateways). No required Arkitect-operated cloud.

### Not one fixed stack

The diagram below shows **how this repo wires the official arkitect-mcp.com example** — not the only way to use Arkitect. Hosting, persistence, MCP client, and desktop bridge are all swappable.

| Layer | Required? | Reference in this repo | Common alternatives |
|-------|-----------|------------------------|---------------------|
| MCP diagnosis core | **Yes** (for MCP usage) | `@arkitect/mcp-server` via stdio | Same package; any MCP-capable host |
| MCP client | **Yes** (to invoke tools) | Cursor + `.cursor/mcp.json` | Claude Desktop, Windsurf, custom MCP host |
| Marketing site | Optional | `apps/site` (Vite/React SPA) | Omit; README only; your own site |
| Site persistence | Optional | Supabase (anon RPCs + RLS) | Postgres, Firebase, SQLite API, localStorage mock, none |
| Static hosting | Optional | Cloudflare Pages | Vercel, Netlify, S3, nginx, GitHub Pages, localhost |
| Desktop bridge | Optional | `apps/desktop` on `127.0.0.1` | Skip (`ARKITECT_SKIP_DESKTOP_BRIDGE=1`) or another shell |

**Mix and match:**

- **MCP only** — build `packages/mcp-server`, configure your client; skip site and database entirely.
- **Site without cloud** — run `apps/site` with no `VITE_SUPABASE_*` env; counter/reviews use mock gateways (localStorage).
- **Your stack** — host the SPA on Vercel, store data in your Postgres, still run the same MCP server locally.

```
┌─ CORE — required for MCP ───────────────────────────────────────┐
│  MCP client (Cursor / Claude Desktop / other)                   │
│       │  .cursor/mcp.json or equivalent                         │
│       │  stdio: node packages/mcp-server/dist/stdio.js          │
│       ▼                                                         │
│  @arkitect/mcp-server                                           │
│  Tools: diagnose_repository, list_*_catalog, verify_codebase…   │
│  Resources: arkitect://diagnosis/latest, arkitect://catalog/*   │
│  Reads your repo from disk — no Arkitect cloud in the path      │
└─────────────────────────────────────────────────────────────────┘

┌─ OPTIONAL — example site deployment (arkitect-mcp.com) ─────────┐
│  Static SPA — Cloudflare Pages in this repo                     │
│  Landing · Download Counter · Reviews · Install · Connect       │
│       │  VITE_SUPABASE_* (or mock mode — no backend)            │
│       ▼                                                         │
│  Your Supabase project (you create & own)                       │
│  Browser → Supabase direct (anon key); no Arkitect backend      │
│  RPCs: download counter · Table: reviews (RLS + rate limit)     │
│  Omit, swap DB, or reimplement each slice independently           │
└─────────────────────────────────────────────────────────────────┘

┌─ OPTIONAL — desktop bridge ───────────────────────────────────────┐
│  Arkitect Desktop (apps/desktop) — wizard, MCP install helper   │
│  Loopback HTTP only (`127.0.0.1`); MCP works without it         │
└─────────────────────────────────────────────────────────────────┘
```

### Vertical slice architecture (optional site)

**Purpose:** How `apps/site` organizes optional features so each slice owns its gateway and can swap live Supabase vs local mock without UI changes.

The marketing site follows **vertical slices** — each feature owns types, data-access gateway, hooks, and UI:

| Slice | Path | Responsibility |
|-------|------|----------------|
| Download counter | `apps/site/src/features/download-counter/` | Capped free-spot claims, progress bar, dedup by visitor |
| Reviews | `apps/site/src/features/reviews/` | Public submit + list, rate limiting, moderation-friendly RLS |

Components never call Supabase directly. Each slice exposes a narrow `*Gateway` interface in `data-access.ts` that swaps between **live Supabase** and **in-memory/localStorage mock** based on env configuration. You can drop a slice, replace its gateway, or copy the pattern for new features.

---

## Prerequisites

**Purpose:** Confirm your machine and accounts are ready before cloning and building.

**What you do:** Install Node.js and pnpm, clone the monorepo, and (optionally) create **your own** Supabase and Cloudflare accounts when you want live data or production hosting.

**What Arkitect does:** Documents minimum versions and optional services. It does not create accounts for you or verify them remotely.

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

**Purpose:** Install dependencies and verify the monorepo builds on your machine.

**What you do:** Run `pnpm install`, `pnpm build`, and `pnpm verify` from your local clone. Build the MCP server before Cursor can start it.

**What Arkitect does:** Ships the workspace scripts and packages. All commands execute locally — nothing is uploaded to Arkitect servers during install or build.

**Outcome:** A working local checkout with compiled MCP stdio entrypoint at `packages/mcp-server/dist/stdio.js`.

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

**Purpose:** Configure the site and MCP server with values that stay on **your** machine or **your** deployment platform.

**What you do:** Copy `.env.example` to `.env.local` (git-ignored) for local dev. For production, set the same `VITE_*` vars in **your** Cloudflare Pages project settings. Set MCP env vars in **your** `.cursor/mcp.json` or shell.

**What Arkitect does:** Reads env vars at build/runtime from the process environment. It never phones home with them — there is no Arkitect API that receives your Supabase URL, anon key, or repo paths.

**Privacy note:** Only the Supabase **anon/publishable** key belongs in the browser bundle. Never put the service role key in `VITE_*` variables or commit secrets to git.

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

**Self-service — your Supabase project, your keys, your data.** Arkitect does **not** create, access, or configure Supabase on your behalf. There is no remote provisioning, no Arkitect login to your Supabase dashboard, and no step where credentials are sent to Arkitect-operated servers. You sign up at [supabase.com](https://supabase.com), create a project under **your** organization, run the SQL migrations **yourself**, and paste the publishable URL and anon key into **your** `.env.local` or Cloudflare env. The site then talks **directly from the browser to your Supabase** — traffic does not proxy through Arkitect infrastructure.

| Responsibility | You | Arkitect (this repo) |
|----------------|-----|----------------------|
| Create Supabase account & project | Yes | No — docs + SQL files only |
| Apply migrations | Yes (SQL editor, CLI, or your MCP) | Ships `apps/site/supabase/migrations/*.sql` |
| Store service role / secret keys | You only (not required for the site) | Never collected or stored |
| Host download counter & reviews data | Your Supabase database | No backend access to your project |
| Moderate reviews | You (Supabase dashboard, service role) | No moderation UI on Arkitect servers |

**Outcome:** Live download counter and reviews on **your** database, or mock mode with zero Supabase if you skip env vars.

### Dedicated project

**What you do:** Create a **dedicated** Supabase project for this site (do not reuse unrelated production databases). Apply the migration files below in **your** project.

**What Arkitect does:** Provides versioned SQL you copy or run — it cannot execute DDL against your project unless **you** explicitly run it from your machine or tooling.

Use a **dedicated** Supabase project for Arkitect. Do not reuse unrelated projects.

Migrations live in:

```
apps/site/supabase/migrations/
  0001_arkitect_download_counter.sql
  0002_arkitect_reviews.sql
```

Apply them via **your** Supabase SQL editor, **your** Supabase CLI, or **your own** Supabase MCP tooling in Cursor — always under **your** credentials. Arkitect does not run migrations against your project remotely.

See `apps/site/supabase/README.md` for verification notes and reset commands.

### Getting keys

**What you do:** In **your** Supabase dashboard → **Project Settings → API**, copy the Project URL and **anon public** key into `apps/site/.env.local` (local) or Cloudflare Pages env (production).

**What Arkitect does:** Embeds those values at build time into the static SPA. They are publishable by design (RLS + RPCs enforce access). Arkitect never receives the service role key and does not need dashboard access.

1. Open your Supabase project dashboard.
2. Go to **Project Settings → API**.
3. Copy **Project URL** → `VITE_SUPABASE_URL`.
4. Copy **anon public** key → `VITE_SUPABASE_ANON_KEY`.

These values are publishable and safe for the browser bundle.

### Mock mode (no Supabase)

**What you do:** Omit `VITE_SUPABASE_*` env vars entirely.

**Outcome:** The site runs fully offline for UI work — no Supabase account, no database network calls, no credentials stored.

Without env vars:

- **Download counter** uses localStorage with a seeded count (~137) and in-memory dedup.
- **Reviews** uses localStorage with two seed reviews plus any you submit locally.

Ideal for UI development without a backend.

---

## Running the Website Locally

**Purpose:** Start the Vite dev server on your machine and confirm routes load.

**What you do:** Run `pnpm dev:site`, open `http://localhost:5173`, and iterate with hot reload.

**What Arkitect does:** Serves the SPA from your local process. Supabase calls (if configured) go from **your browser** to **your Supabase** — not through Arkitect.

**Outcome:** Working local preview of `/` and `/reviews` with mock or live data depending on env.

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

**Purpose:** Learn what each page and section does for visitors and how features behave with mock vs live Supabase.

**What you do:** Browse the site as an end user would — claim a download spot, submit reviews, copy MCP install steps.

**What Arkitect does:** Renders the UI and (when configured) calls your Supabase RPCs from the browser. Visitor IDs live in **your** browser localStorage; claims and reviews live in **your** Supabase tables when live mode is on.

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

**Purpose:** Anonymous free-spot claims (cap 1,000) — persisted in **your** Supabase when configured, or localStorage in mock mode.

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

**Purpose:** Public review submit and community list — stored in **your** Supabase with RLS and rate limits when live; localStorage when mock.

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

**Purpose:** On-page copy-paste steps to build the MCP server and add Cursor config — all actions run on **your** machine.

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

**Purpose:** Community support links (Reddit, X) — optional feedback channels, not a support portal that accesses your Supabase or repo.

**Location:** Bottom of Home and Reviews pages.

Links to Reddit (`u/Ok-Address3409`) and X (`@casiezeq`) for bugs, feature requests, and feedback.

---

## Deploying to Cloudflare Pages

**Purpose:** Publish the static site to **your** Cloudflare account with SPA routing and optional Supabase env vars.

**What you do:** Create a Cloudflare Pages project linked to **your** git repo or upload build artifacts, set build commands and `VITE_SUPABASE_*` in **your** dashboard, and attach **your** custom domain.

**What Arkitect does:** Provides `wrangler.jsonc`, `_redirects`, and build scripts. It does not host the site for you or store your Cloudflare or Supabase credentials.

**Outcome:** Public URL serving the same SPA you tested locally, talking to the Supabase project **you** configured in Cloudflare env.

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

**Purpose:** Understand the local MCP server that Cursor spawns — tools, resources, and optional desktop bridge.

**What you do:** Build and run `packages/mcp-server/dist/stdio.js` on your machine via Cursor's MCP config.

**What Arkitect does:** Exposes diagnosis and catalog tools over stdio. The process reads **your** repo from disk paths **you** provide. No repo contents or paths are sent to Arkitect cloud services (there is no such backend for MCP).

**Outcome:** Cursor agents can call Arkitect tools against workspaces on your machine.

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

**Purpose:** Wire Cursor to start the Arkitect MCP server locally so agents can use its tools.

**What you do:** Build the server, add `.cursor/mcp.json` in **your** project (or user-level MCP settings), set `ARKITECT_DEFAULT_REPO_PATH` to **your** repo, and restart MCP in Cursor.

**What Arkitect does:** Documents the JSON config shape. Cursor launches `node packages/mcp-server/dist/stdio.js` as a **local child process** — config stays on your machine.

**Outcome:** `arkitect-mcp` appears enabled in Cursor Settings → MCP with tools available in chat.

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

**Purpose:** Quick reference for every MCP tool — inputs, behavior, and example prompts.

**What you do:** Invoke tools from Cursor chat or agent sessions against repo paths on your machine.

**What Arkitect does:** Runs tool handlers inside the local stdio process. Analysis reads local files; `verify_codebase` runs **your** `pnpm` scripts in **your** repo — output stays in Cursor, not sent to Arkitect servers.

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

**Purpose:** Read-only JSON catalogs and policy payloads agents can fetch without calling a tool.

**What you do:** Ask Cursor to read a resource URI, or pick resources from the MCP resource list.

**What Arkitect does:** Serves static catalog JSON from the local MCP process. No network fetch to Arkitect-operated APIs.

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

**Purpose:** Optional localhost HTTP registration when Arkitect Desktop is running alongside the MCP server.

**What you do:** Start Arkitect Desktop locally, or set `ARKITECT_SKIP_DESKTOP_BRIDGE=1` to disable bridge attempts.

**What Arkitect does:** MCP server POSTs tool metadata to `127.0.0.1` only — a local loopback bridge written by the desktop app. Nothing leaves your machine unless you configure otherwise.

**Outcome:** Desktop UI can reflect live MCP tool availability; MCP still works standalone if desktop is off.

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

**Purpose:** Guided wizard for repo intake, diagnosis, and one-click MCP install — entirely local.

**What you do:** Run `pnpm dev:desktop` or the packaged installer, point at a local folder, walk through steps, optionally let desktop write `.cursor/mcp.json`.

**What Arkitect does:** Provides the Electron shell and shared catalog contracts. Repo files stay on disk; no upload to Arkitect cloud.

**Outcome:** Visual diagnosis flow parallel to MCP, with optional Cursor deeplink install.

The desktop shell (`apps/desktop`) provides a guided wizard:

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

**Purpose:** Reference for the SQL objects **you** deploy to **your** Supabase project when enabling live counter and reviews.

**What you do:** Apply migrations, inspect tables in **your** Supabase Table Editor, moderate reviews with service role access in **your** dashboard.

**What Arkitect does:** Defines RLS-safe RPCs and table shapes in migration files. Does not host or query your database except when **your** browser client calls Supabase directly.

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

**Purpose:** End-to-end walkthroughs with time estimates — from zero to mock site, live Supabase, MCP diagnosis, deploy, and verify.

**What you do:** Follow each tutorial sequentially on your machine. Every step uses **your** tools, accounts, and env files.

**What Arkitect does:** Documents expected results so you can confirm success locally.

### Tutorial A — Local site with mock data (5 minutes)

1. `pnpm install && pnpm dev:site`
2. Open `http://localhost:5173`
3. Scroll to the download counter → click **Claim your free spot**
4. Navigate to **Reviews** → submit a test review
5. Confirm seed/mock data appears in the list

No Supabase required.

---

### Tutorial B — Connect live Supabase (15 minutes)

**You own every step:** create **your** Supabase project, run migrations **yourself**, paste keys into **your** `.env.local` — Arkitect is not in the loop.

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

**Purpose:** Diagnose common self-service setup issues — env vars, migrations, MCP paths, and SPA routing.

**What you do:** Check **your** `.env.local`, Supabase dashboard, Cursor MCP logs, and Cloudflare settings.

**What Arkitect does:** Documents known failure modes from local-only architecture (no remote support dashboard that sees your config).

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

**Purpose:** Items Arkitect cannot automate — you must complete these in **your** accounts and on **your** machine.

**What you do:** Own Supabase project creation, migration apply, env configuration, domain DNS, MCP rebuilds after code changes.

**What Arkitect does:** Ships SQL files, examples, and docs only — no managed hosting or credential collection service.

These require your action outside the repo:

| Item | Status |
|------|--------|
| **Supabase keys & project** | **You** create the project, apply migrations, and set `.env.local` / Cloudflare env — Arkitect never receives credentials |
| **Migrations** | **You** run SQL files against **your** dedicated Supabase project |
| **Custom domain** | Attach `arkitect-mcp.com` in Cloudflare dashboard |
| **MCP rebuild after code changes** | Rebuild + restart Cursor MCP manually |
| **Repo analyzer** | Still mock — `diagnose_repository` uses simulated detections unless `ARKITECT_ANALYZER=real` when real mode is wired |
| **Licensing / Stripe worker** | Deferred — see `instructions/future-licensing-worker.md` |
| **Logo asset** | Site uses generated Three.js logo; custom brand asset noted as future item in `request.md` |

---

## Related Documentation

**Purpose:** Pointers to deeper repo docs — README, site deploy notes, and Supabase migration verification.

| Document | Purpose |
|----------|---------|
| [README.md](../README.md) | Monorepo overview and commands |
| [apps/site/README.md](../apps/site/README.md) | Site deployment quick reference |
| [apps/site/supabase/README.md](../apps/site/supabase/README.md) | Supabase migrations and verification |
| [instructions/request.md](../instructions/request.md) | Feature backlog (internal) |
| [instructions/future-licensing-worker.md](../instructions/future-licensing-worker.md) | Licensing worker deploy guide |

---

*Last updated: July 2026 — matches Arkitect site v0.1.0 and MCP server v0.1.0 scaffold.*
