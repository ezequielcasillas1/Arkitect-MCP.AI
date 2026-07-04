# Bug Fixes

Use concise bug notes after review.

Template:
### [Date] - [Bug]
**Status:** [PENDING/PARTIAL/FAILURE]
**Files:** [file1, file2]
**Result:** [What failed, what changed, and why]

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
