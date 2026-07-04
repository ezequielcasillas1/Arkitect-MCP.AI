export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const downloadUrl = import.meta.env.VITE_DOWNLOAD_URL?.trim() ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const isDownloadUrlConfigured = Boolean(downloadUrl);
