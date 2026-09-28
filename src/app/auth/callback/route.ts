import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, serverEnv } from "@/lib/env";

/**
 * OAuth PKCE callback: exchange the code for a session (cookies set by the
 * SSR client), bootstrap admins from ADMIN_BOOTSTRAP_EMAILS, then redirect.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const rawNext = url.searchParams.get("next") ?? "/portal";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/portal";

  if (!isSupabaseConfigured() || !code) {
    return NextResponse.redirect(new URL("/login?error=1", url.origin));
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(new URL("/login?error=1", url.origin));
  }

  const email = data.user.email?.toLowerCase();
  const env = serverEnv();
  if (email && env.adminEmails.includes(email) && env.supabaseSecretKey) {
    try {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const admin = createAdminClient();
      const { data: org } = await admin.from("organizations").select("id").eq("slug", "ncpor").maybeSingle();
      await admin.from("allowed_staff").upsert({ email, role: "admin", org_id: org?.id ?? null }, { onConflict: "email" });
      await admin.from("profiles").update({ role: "admin", org_id: org?.id ?? null }).eq("id", data.user.id);
    } catch {
      // Non-fatal: `npm run seed:admin` does the same thing.
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
