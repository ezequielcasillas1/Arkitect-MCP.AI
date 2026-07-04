import { getSupabaseClient } from "../../lib/supabaseClient";
import { getOrCreateVisitorId } from "../../lib/visitor-id";
import { isSupabaseConfigured } from "../../lib/env";
import { TRACKED_DOWNLOAD_FILES } from "./files";
import type { DownloadFileKey, FileDownloadStats, RecordDownloadResult } from "./types";

const MOCK_STORAGE_KEY = "arkitect_mock_download_tracking";

interface MockDownloadCounts {
  totals: Record<DownloadFileKey, { totalCount: number; uniqueCount: number }>;
  visitors: Record<DownloadFileKey, string[]>;
}

function emptyMockCounts(): MockDownloadCounts {
  return {
    totals: {
      "arkitect-setup": { totalCount: 0, uniqueCount: 0 },
      "user-guide": { totalCount: 0, uniqueCount: 0 }
    },
    visitors: {
      "arkitect-setup": [],
      "user-guide": []
    }
  };
}

function readMockCounts(): MockDownloadCounts {
  if (typeof window === "undefined") {
    return emptyMockCounts();
  }

  const raw = window.localStorage.getItem(MOCK_STORAGE_KEY);
  if (!raw) {
    return emptyMockCounts();
  }

  try {
    const parsed = JSON.parse(raw) as MockDownloadCounts;
    if (!parsed?.totals || !parsed?.visitors) {
      return emptyMockCounts();
    }
    return parsed;
  } catch {
    return emptyMockCounts();
  }
}

function writeMockCounts(counts: MockDownloadCounts): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(counts));
}

export interface DownloadTrackingGateway {
  recordDownload(fileKey: DownloadFileKey, visitorId: string): Promise<RecordDownloadResult>;
  getStats(): Promise<FileDownloadStats[]>;
}

function createMockDownloadTrackingGateway(): DownloadTrackingGateway {
  return {
    async recordDownload(fileKey, visitorId) {
      const counts = readMockCounts();
      const visitors = counts.visitors[fileKey];
      const isNewVisitor = !visitors.includes(visitorId);

      if (isNewVisitor) {
        visitors.push(visitorId);
      }

      counts.totals[fileKey].totalCount += 1;
      if (isNewVisitor) {
        counts.totals[fileKey].uniqueCount += 1;
      }

      writeMockCounts(counts);

      return {
        fileKey,
        totalCount: counts.totals[fileKey].totalCount,
        uniqueCount: counts.totals[fileKey].uniqueCount
      };
    },
    async getStats() {
      const counts = readMockCounts();
      return TRACKED_DOWNLOAD_FILES.map((file) => ({
        fileKey: file.key,
        label: file.label,
        totalCount: counts.totals[file.key].totalCount,
        uniqueCount: counts.totals[file.key].uniqueCount
      }));
    }
  };
}

interface DownloadStatsRow {
  file_key: string;
  total_count: number;
  unique_count: number;
}

function createSupabaseDownloadTrackingGateway(): DownloadTrackingGateway {
  return {
    async recordDownload(fileKey, visitorId) {
      const client = getSupabaseClient();
      if (!client) {
        throw new Error("supabase_not_configured");
      }

      const { data, error } = await client
        .rpc("arkitect_record_file_download", {
          p_file_key: fileKey,
          p_visitor_id: visitorId
        })
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? "record_download_failed");
      }

      const row = data as DownloadStatsRow;
      return {
        fileKey,
        totalCount: row.total_count,
        uniqueCount: row.unique_count
      };
    },
    async getStats() {
      const client = getSupabaseClient();
      if (!client) {
        return TRACKED_DOWNLOAD_FILES.map((file) => ({
          fileKey: file.key,
          label: file.label,
          totalCount: 0,
          uniqueCount: 0
        }));
      }

      const { data, error } = await client.rpc("arkitect_get_file_download_stats");
      if (error) {
        throw new Error(error.message);
      }

      const rows = (data ?? []) as DownloadStatsRow[];
      const byKey = new Map(rows.map((row) => [row.file_key, row]));

      return TRACKED_DOWNLOAD_FILES.map((file) => {
        const row = byKey.get(file.key);
        return {
          fileKey: file.key,
          label: file.label,
          totalCount: row?.total_count ?? 0,
          uniqueCount: row?.unique_count ?? 0
        };
      });
    }
  };
}

export const downloadTrackingGateway: DownloadTrackingGateway = isSupabaseConfigured
  ? createSupabaseDownloadTrackingGateway()
  : createMockDownloadTrackingGateway();

export async function recordTrackedDownload(fileKey: DownloadFileKey): Promise<void> {
  try {
    const visitorId = getOrCreateVisitorId();
    await downloadTrackingGateway.recordDownload(fileKey, visitorId);
  } catch {
    // Tracking must never block the actual download.
  }
}

