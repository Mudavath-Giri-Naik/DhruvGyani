import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { isDemoStore, serverEnv } from "@/lib/env";
import { demoProfiles } from "@/lib/seed/data";
import type { AppRole, Role, Viewer } from "@/lib/types";
import type { Repo } from "@/lib/data/repo";

export const DEMO_ROLE_COOKIE = "dg_demo_role";

const VISITOR: Viewer = { id: null, name: null, email: null, avatar: null, role: "visitor", orgId: null, demo: false };

export const isStaff = (r: Role) => r === "curator" || r === "reviewer" || r === "admin";
export const isReviewer = (r: Role) => r === "reviewer" || r === "admin";
export const isAdmin = (r: Role) => r === "admin";

/** The current viewer, resolved once per request. */
export const getViewer = cache(async (): Promise<Viewer> => {
  if (isDemoStore()) {
    const role = (await cookies()).get(DEMO_ROLE_COOKIE)?.value as AppRole | undefined;
    const p = demoProfiles.find((x) => x.role === role);
    if (!p) return { ...VISITOR, demo: true };
    return { id: p.id, name: p.full_name, email: p.email ?? null, avatar: null, role: p.role, orgId: p.org_id, demo: true };
  }
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return VISITOR;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", claims.sub).maybeSingle();
  const meta = (claims.user_metadata ?? {}) as Record<string, string>;
  const email = (claims.email as string | undefined) ?? profile?.email ?? null;
  let role: Role = (profile?.role as AppRole | undefined) ?? "member";
  // Bootstrap admins are honoured even before `npm run seed:admin` has run.
  if (email && serverEnv().adminEmails.includes(email.toLowerCase())) role = "admin";
  return {
    id: claims.sub,
    name: profile?.full_name ?? meta.full_name ?? meta.name ?? email,
    email,
    avatar: profile?.avatar_url ?? meta.avatar_url ?? null,
    role,
    orgId: profile?.org_id ?? null,
    demo: false,
  };
});

/** Repository bound to the current viewer (demo store or Supabase with RLS). */
export const getRepo = cache(async (): Promise<Repo> => {
  const viewer = await getViewer();
  if (isDemoStore()) {
    const { DemoRepo } = await import("@/lib/data/demo");
    return new DemoRepo(viewer);
  }
  const [{ SupabaseRepo }, { createClient }] = await Promise.all([import("@/lib/data/supabase"), import("@/lib/supabase/server")]);
  return new SupabaseRepo(viewer, await createClient());
});

/** Server-side guard for pages and actions (the second of three layers). */
export async function requireRole(check: (r: Role) => boolean, next = "/portal"): Promise<Viewer> {
  const viewer = await getViewer();
  if (!check(viewer.role)) {
    redirect(viewer.role === "visitor" ? `/login?next=${encodeURIComponent(next)}` : "/portal?denied=1");
  }
  return viewer;
}

/** Route-handler guard: returns a Response to send back, or null when allowed. */
export async function guardApi(check: (r: Role) => boolean): Promise<{ viewer: Viewer; deny: Response | null }> {
  const viewer = await getViewer();
  if (check(viewer.role)) return { viewer, deny: null };
  return {
    viewer,
    deny: Response.json({ error: viewer.role === "visitor" ? "Sign in required" : "Not allowed for your role" }, { status: viewer.role === "visitor" ? 401 : 403 }),
  };
}
