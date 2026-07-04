# Arkitect Site — Supabase Data Layer

**Status: ACTIVE.** Migrations are applied to the dedicated Arkitect Supabase project
(`https://asekzhygyqqkyytcbzyc.supabase.co`, MCP server `project-0-Arkitect-mcp.com-supabase-arkitect`).
The frontend talks to this project directly through `src/lib/supabaseClient.ts`.

An earlier pass in this workspace also had a `user-supabase` MCP connected, but that one belongs to
an unrelated existing product (table names like `clips`, `notes`, `clipboard_history`,
`pastecraft_devices`). It was never written to — only read-only inspection (`list_tables`,
`get_project_url`, `get_publishable_keys`, read-only `execute_sql` `SELECT`s) confirmed it was the
wrong project before any DDL ran. `user-supabase` must continue to be left alone for Arkitect work.

## What's here

- `migrations/0001_arkitect_download_counter.sql` — capped, dedup-safe "free spots claimed" counter
  (`download-counter` vertical slice). **Applied.**
- `migrations/0002_arkitect_reviews.sql` — visitor reviews/feedback table with moderation-friendly
  RLS and a per-visitor rate-limit trigger (`reviews` vertical slice). **Applied.**

## Runtime config

`apps/site/.env.local` (git-ignored) has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` populated
with the dedicated project's URL and anon/publishable key (not secret, safe for the browser bundle).
See `apps/site/.env.example` for the shape. If those vars are absent, each slice's `data-access.ts`
automatically falls back to an in-memory mock gateway so the UI still runs standalone.

## Verified end to end

Both RPCs and the reviews insert/rate-limit path were exercised directly against the live project
during this build (via the `project-0-Arkitect-mcp.com-supabase-arkitect` MCP server):

- `arkitect_get_download_stats()` — confirmed reachable over the same public REST path the browser
  client uses (anon/publishable key), returns `{claimed_count, spot_limit}`.
- `arkitect_claim_download_slot(text)` — **found and fixed a bug** during verification: the
  `RETURNS TABLE(claimed_count, spot_limit, ...)` signature creates implicit PL/pgSQL OUT
  parameters with the same names as the table's columns, which made the `UPDATE ... SET
  claimed_count = claimed_count + 1 ... WHERE claimed_count < spot_limit` statement ambiguous
  (Postgres error `42702`). Fixed by aliasing the table (`AS c`) and qualifying every column
  reference. Confirmed after the fix: first claim increments and persists; a repeat claim from the
  same visitor returns `already_claimed: true` without double-counting.
- `arkitect_reviews` insert — confirmed a row persists correctly, and the rate-limit trigger
  correctly rejects a 4th submission within an hour from the same visitor. All QA rows were deleted
  afterward; the one real counter claim from this verification pass was left in place (see below).

## Resetting demo data before a real launch

The counter will already show a small number after local verification (each dev/QA run of the
claim flow adds one real row). Before public launch, reset it from the SQL editor if a clean `0` is
wanted:

```sql
truncate table public.arkitect_download_claims;
update public.arkitect_download_counter set claimed_count = 0 where id = 1;
```
