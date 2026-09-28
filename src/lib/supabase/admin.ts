import "server-only";

import { createClient } from "@supabase/supabase-js";
import { publicEnv, serverEnv } from "@/lib/env";

/**
 * Service-role client. SERVER ONLY — bypasses RLS. Use solely for background
 * jobs (ingestion, embeddings) and bootstrap scripts, after doing an explicit
 * permission check in the calling handler.
 */
export function createAdminClient() {
  const key = serverEnv().supabaseSecretKey;
  if (!publicEnv.supabaseUrl || !key) throw new Error("Supabase secret key is not configured");
  return createClient(publicEnv.supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
