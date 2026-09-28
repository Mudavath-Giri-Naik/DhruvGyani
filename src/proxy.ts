import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Layer 1 of 3 access checks (then server checks, then Postgres RLS).
 * Refreshes the Supabase session and redirects non-staff away from
 * /studio and /admin before any page code runs.
 */
const STAFF = ["curator", "reviewer", "admin"];

function deny(request: NextRequest, signedIn: boolean) {
  const url = request.nextUrl.clone();
  if (!signedIn) {
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(request.nextUrl.pathname)}`;
  } else {
    url.pathname = "/portal";
    url.search = "?denied=1";
  }
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const needsStaff = path.startsWith("/studio");
  const needsAdmin = path.startsWith("/admin");

  if (!isSupabaseConfigured()) {
    if (!needsStaff && !needsAdmin) return NextResponse.next();
    const role = request.cookies.get("dg_demo_role")?.value ?? "";
    if (needsAdmin && role !== "admin") return deny(request, Boolean(role));
    if (needsStaff && !STAFF.includes(role)) return deny(request, Boolean(role));
    return NextResponse.next();
  }

  const { response, claims, supabase } = await updateSession(request);
  if (!needsStaff && !needsAdmin) return response;
  if (!claims?.sub) return deny(request, false);

  const adminEmails = (process.env.ADMIN_BOOTSTRAP_EMAILS || "").toLowerCase().split(",").map((s) => s.trim());
  const email = String(claims.email ?? "").toLowerCase();
  let role = email && adminEmails.includes(email) ? "admin" : "";
  if (!role) {
    const { data } = await supabase.from("profiles").select("role").eq("id", claims.sub).maybeSingle();
    role = data?.role ?? "member";
  }
  if (needsAdmin && role !== "admin") return deny(request, true);
  if (needsStaff && !STAFF.includes(role)) return deny(request, true);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|samples/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|csv|pdf)$).*)"],
};
