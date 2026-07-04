import { getSupabaseClient } from "../../lib/supabaseClient";
import { isSupabaseConfigured } from "../../lib/env";
import type { ClaimDownloadSlotResult, DownloadCounterStats } from "./types";

const FALLBACK_STATS: DownloadCounterStats = { claimedCount: 0, spotLimit: 1000 };
const MOCK_STORAGE_KEY = "arkitect_mock_download_counter";
const MOCK_SEED_COUNT = 137;

/**
 * Repository contract for the download-counter slice (Repository/Adapter
 * pattern) — components never talk to Supabase directly, only through this
 * narrow, testable surface.
 */
export interface DownloadCounterGateway {
  getStats(): Promise<DownloadCounterStats>;
  claimSlot(visitorId: string): Promise<ClaimDownloadSlotResult>;
}

function readMockCount(): number {
  if (typeof window === "undefined") {
    return MOCK_SEED_COUNT;
  }

  const raw = window.localStorage.getItem(MOCK_STORAGE_KEY);
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : MOCK_SEED_COUNT;
}

function writeMockCount(count: number): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(MOCK_STORAGE_KEY, String(count));
}

function createMockDownloadCounterGateway(): DownloadCounterGateway {
  const claimedVisitors = new Set<string>();

  return {
    async getStats() {
      return { claimedCount: readMockCount(), spotLimit: FALLBACK_STATS.spotLimit };
    },
    async claimSlot(visitorId: string) {
      const spotLimit = FALLBACK_STATS.spotLimit;
      const current = readMockCount();

      if (claimedVisitors.has(visitorId)) {
        return { claimedCount: current, spotLimit, alreadyClaimed: true };
      }

      claimedVisitors.add(visitorId);

      if (current >= spotLimit) {
        return { claimedCount: current, spotLimit, alreadyClaimed: false };
      }

      const next = current + 1;
      writeMockCount(next);
      return { claimedCount: next, spotLimit, alreadyClaimed: true };
    }
  };
}

interface DownloadStatsRow {
  claimed_count: number;
  spot_limit: number;
}

interface ClaimSlotRow extends DownloadStatsRow {
  already_claimed: boolean;
}

function createSupabaseDownloadCounterGateway(): DownloadCounterGateway {
  return {
    async getStats() {
      const client = getSupabaseClient();
      if (!client) {
        return FALLBACK_STATS;
      }

      const { data, error } = await client.rpc("arkitect_get_download_stats").single();
      if (error || !data) {
        throw new Error(error?.message ?? "download_stats_unavailable");
      }

      const row = data as DownloadStatsRow;
      return { claimedCount: row.claimed_count, spotLimit: row.spot_limit };
    },
    async claimSlot(visitorId: string) {
      const client = getSupabaseClient();
      if (!client) {
        throw new Error("supabase_not_configured");
      }

      const { data, error } = await client
        .rpc("arkitect_claim_download_slot", { p_visitor_id: visitorId })
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? "claim_failed");
      }

      const row = data as ClaimSlotRow;
      return {
        claimedCount: row.claimed_count,
        spotLimit: row.spot_limit,
        alreadyClaimed: row.already_claimed
      };
    }
  };
}

/**
 * Strategy selection: pick the live Supabase-backed gateway when the
 * dedicated project is configured, otherwise fall back to the in-memory
 * mock so the UI keeps working standalone.
 */
export const downloadCounterGateway: DownloadCounterGateway = isSupabaseConfigured
  ? createSupabaseDownloadCounterGateway()
  : createMockDownloadCounterGateway();
