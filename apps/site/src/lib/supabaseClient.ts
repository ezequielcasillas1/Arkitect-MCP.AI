import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./env";

let cachedClient: SupabaseClient | null = null;

/**
 * Lazily creates the Supabase client only when the dedicated Arkitect
 * project is configured. Returns null when unconfigured so each slice's
 * data-access layer can fall back to its mock gateway (Strategy pattern).
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: { persistSession: false }
    });
  }

  return cachedClient;
}
