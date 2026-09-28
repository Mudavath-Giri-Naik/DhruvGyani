/**
 * Environment access. Public values are inlined by Next at build time; server
 * values are read lazily so that a missing key never crashes the app — the
 * app falls back to demo mode instead (see DECISIONS.md, "Demo store").
 */

export const publicEnv = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
};

export function isSupabaseConfigured(): boolean {
  return Boolean(publicEnv.supabaseUrl && publicEnv.supabaseKey);
}

/** True when the app should run on the bundled in-memory demo store. */
export function isDemoStore(): boolean {
  return !isSupabaseConfigured();
}

export function serverEnv() {
  return {
    supabaseSecretKey: process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    dbUrl: process.env.SUPABASE_DB_URL || "",
    llmProvider: (process.env.LLM_PROVIDER || "gemini") as "gemini" | "none",
    geminiKey: process.env.GEMINI_API_KEY || "",
    llmModel: process.env.LLM_MODEL || "gemini-flash-latest",
    embeddingModel: process.env.EMBEDDING_MODEL || "gemini-embedding-2",
    embeddingDim: Number(process.env.EMBEDDING_DIM || 768),
    adminEmails: (process.env.ADMIN_BOOTSTRAP_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
    demoMode: process.env.DEMO_MODE === "true",
  };
}

export function isLlmConfigured(): boolean {
  const env = serverEnv();
  return env.llmProvider === "gemini" && Boolean(env.geminiKey) && !env.demoMode;
}
