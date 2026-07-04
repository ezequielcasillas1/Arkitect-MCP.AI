# Bug Fixes

Use concise bug notes after review.

Template:
### [Date] - [Bug]
**Status:** [PENDING/PARTIAL/FAILURE]
**Files:** [file1, file2]
**Result:** [What failed, what changed, and why]

### 2026-07-04 - Favicon Not Showing in Production
**Status:** PENDING
**Files:** apps/site/public/_redirects, apps/site/public/favicon.svg, apps/site/public/favicon.ico, apps/site/index.html, apps/site/scripts/generate-favicon.mjs
**Result:** SPA catch-all `/* /index.html 200` in `_redirects` rewrote `/favicon.svg` and `/favicon.ico` to HTML on Cloudflare Pages. Added explicit static-asset rules before catch-all, fixed invalid control char in favicon.svg, added favicon.ico (16/32px from logo colors), and expanded index.html link tags.

### 2026-07-04 - Favicon STILL Not Showing After Fix (Debug Pass)
**Status:** PENDING
**Files:** apps/site/index.html, apps/site/public/_redirects, apps/site/public/favicon-16.png, apps/site/public/favicon-32.png, apps/site/scripts/generate-favicon.mjs
**Result:** Verified deployment is fully live — prod `/favicon.ico` MD5 == local MD5 (`367DCAD...`), `/favicon.svg` MD5 matches, all 3 icon URLs return 200 with correct MIME types, and prod `index.html` contains the correct `<link rel="icon">` tags. ICO structure is valid: magic `00 00 01 00`, 2 PNG entries (16×16 601 B + 32×32 1140 B), both starting with `89 50 4E 47`. No React runtime code touches the icons. Root cause is Chrome's per-domain favicon cache holding a "no favicon" entry — Ctrl+Shift+R does not evict it. Mitigations applied: (1) added `?v=3` cache-buster to every icon `<link>` in `index.html`, (2) emitted standalone `favicon-16.png` / `favicon-32.png` next to the ICO with explicit `sizes="16x16"` / `sizes="32x32"` `rel="icon"` links so Chrome resolves a plain PNG for the tab, (3) added static passthrough rules for the PNGs in `_redirects`, (4) `generate-favicon.mjs` now preserves the PNGs instead of deleting them. Not committed — awaits user redeploy + Chrome favicon cache clear (or incognito test).

### 2026-07-04 - No Download Link After Free Spot Claim
**Status:** PENDING
**Files:** apps/site/src/features/download-counter/DownloadCounterSection.tsx, apps/site/src/lib/env.ts, apps/site/.env.example
**Result:** Claim flow only disabled the button to "You're on the list" with no post-claim download CTA. Added env-backed `VITE_DOWNLOAD_URL` and a success block with download link after claim; install-steps fallback when URL unset.

### 2026-07-04 - Claim Hook Marks Full Counter as Claimed
**Status:** PENDING
**Files:** apps/site/src/features/download-counter/useDownloadCounter.ts
**Result:** When all 1,000 spots were taken, `claim()` still set `hasClaimed` and localStorage even though RPC/mock returned `alreadyClaimed: false`. Hook now only marks claimed when `alreadyClaimed` is true; otherwise shows "All free spots have been claimed."

### 2026-07-04 - Ambiguous Column in Download Claim RPC
**Status:** PENDING
**Files:** apps/site/supabase/migrations/0001_arkitect_download_counter.sql
**Result:** `arkitect_claim_download_slot` failed with Postgres 42702 ("column reference claimed_count is ambiguous") because `RETURNS TABLE(claimed_count, spot_limit, ...)` creates OUT params with the same names as the table columns. Fixed by aliasing the table (`AS c`) in the UPDATE; verified increment, dedup, and cap behavior afterward.

### 2026-07-04 - Arkitect-mcp Dogfooding: MCP Tools Fail Output Schema Check
**Status:** PENDING
**Files:** packages/mcp-server/src/stdio.ts
**Result:** All six arkitect-mcp tools (diagnose_repository, list_diagnosis_strategies, list_design_patterns, list_remix_profiles, list_architecture_catalog, get_last_diagnosis) declare an `outputSchema` but `toMcpToolResult`/`toMcpToolContent` only ever return text `content`, never `structuredContent`. Every call from this session errored with "has an output schema but did not return structured content" (reproduced twice, in two separate calling sessions). Matches a gap already flagged in implementations.md on 2026-06-16; still unresolved. Not fixed here (out of scope for the site build) — flagging for a follow-up fix.
