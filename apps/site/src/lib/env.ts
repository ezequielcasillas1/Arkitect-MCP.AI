import { GITHUB_INSTALLER_URL } from "./arkitect-links";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export type DownloadUrlState = "configured" | "missing" | "invalid";

function parseDownloadUrl(raw: string | undefined): { url: string; state: DownloadUrlState } {
  const trimmed = raw?.trim() ?? "";

  if (!trimmed) {
    return { url: "", state: "missing" };
  }

  try {
    const parsed = new URL(trimmed);

    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return { url: parsed.href, state: "configured" };
    }
  } catch {
    // fall through to invalid
  }

  return { url: "", state: "invalid" };
}

const downloadUrlConfig = parseDownloadUrl(import.meta.env.VITE_DOWNLOAD_URL);

export const downloadUrl = downloadUrlConfig.url;
export const downloadUrlState = downloadUrlConfig.state;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const isDownloadUrlConfigured = downloadUrlState === "configured";

/** VITE_DOWNLOAD_URL when set; otherwise latest GitHub release installer. */
export function resolveDownloadUrl(): string {
  return isDownloadUrlConfigured ? downloadUrl : GITHUB_INSTALLER_URL;
}
