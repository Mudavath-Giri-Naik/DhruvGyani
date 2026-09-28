"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRepo, isAdmin, requireRole } from "@/lib/auth";

const Staff = z.object({ email: z.string().trim().toLowerCase().email(), role: z.enum(["member", "curator", "reviewer", "admin"]) });

/** Invite or change a staff member (allow-list). Role changes are audited. */
export async function setStaffRole(input: z.infer<typeof Staff>) {
  const viewer = await requireRole(isAdmin, "/admin/team");
  const parsed = Staff.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Enter a valid email and role." };
  if (parsed.data.email === viewer.email?.toLowerCase() && parsed.data.role !== "admin") {
    return { ok: false as const, error: "You can't remove your own admin role." };
  }
  const repo = await getRepo();
  await repo.setStaff(parsed.data.email, parsed.data.role === "member" ? null : parsed.data.role);
  await repo.audit("role.change", "profile", null, { email: parsed.data.email, role: parsed.data.role });
  revalidatePath("/admin/team");
  return { ok: true as const };
}

const Settings = z.object({
  displayName: z.string().trim().min(2).max(80),
  tagline: z.string().trim().max(160),
  languages: z.object({ en: z.boolean(), hi: z.boolean() }),
  hashtags: z.array(z.string().trim().regex(/^#?[\p{L}\p{N}_]{2,40}$/u)).max(8),
  xLimit: z.number().int().min(100).max(280),
  defaultAudience: z.enum(["school", "college", "expert", "public"]),
  defaultRelease: z.enum(["public", "internal", "embargo"]),
  defaultEmbargoDays: z.number().int().min(1).max(730),
});

export async function saveSettings(input: z.infer<typeof Settings>) {
  await requireRole(isAdmin, "/admin/settings");
  const parsed = Settings.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid settings" };
  if (!parsed.data.languages.en && !parsed.data.languages.hi) return { ok: false as const, error: "Keep at least one language enabled." };
  const repo = await getRepo();
  await repo.saveSettings({ ...parsed.data, hashtags: parsed.data.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)) });
  await repo.audit("settings.update", "organization", null, {});
  revalidatePath("/admin/settings");
  return { ok: true as const };
}
