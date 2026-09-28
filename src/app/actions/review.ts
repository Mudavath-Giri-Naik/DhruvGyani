"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRepo, isAdmin, isReviewer, isStaff, requireRole } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { approvalBlockers } from "@/lib/trust/claims";
import type { GenStatus } from "@/lib/types";

const Action = z.enum(["submit", "approve", "reject", "publish", "return"]);
type Result = { ok: true; status: GenStatus; slug?: string | null } | { ok: false; error: string };

/**
 * Review workflow: draft → in_review → approved → published (or rejected).
 * Rules (also enforced by RLS + DB trigger): only reviewers approve/publish,
 * never their own work (admins may), and flagged claims block approval.
 */
export async function transitionGeneration(id: string, action: z.infer<typeof Action>): Promise<Result> {
  const viewer = await requireRole(isStaff);
  const act = Action.parse(action);
  const repo = await getRepo();
  const gen = await repo.getGeneration(id);
  if (!gen) return { ok: false, error: "Not found" };

  const needsReviewer = act === "approve" || act === "reject" || act === "publish";
  if (needsReviewer && !isReviewer(viewer.role)) return { ok: false, error: "Only reviewers can do this." };
  if (act === "approve" && gen.created_by === viewer.id && !isAdmin(viewer.role)) {
    return { ok: false, error: "You created this draft, so another reviewer must approve it." };
  }

  const from: Record<typeof act, GenStatus[]> = {
    submit: ["draft", "rejected"],
    approve: ["in_review"],
    reject: ["in_review", "approved"],
    publish: ["approved"],
    return: ["in_review", "approved", "rejected"],
  };
  if (!from[act].includes(gen.status)) return { ok: false, error: `Can't ${act} from “${gen.status.replace("_", " ")}”.` };

  if (act === "approve" || act === "publish") {
    const b = approvalBlockers(await repo.claims(gen.id));
    if (b.blocked) return { ok: false, error: `Approval blocked: ${b.unsupported} unsupported sentence(s) and ${b.numbers} unmatched number(s). Fix them in the Trust Panel.` };
  }

  const to: Record<typeof act, GenStatus> = { submit: "in_review", approve: "approved", reject: "rejected", publish: "published", return: "draft" };
  const now = new Date().toISOString();
  const patch: Parameters<typeof repo.updateGeneration>[1] = { status: to[act] };
  if (act === "approve") Object.assign(patch, { reviewed_by: viewer.id, reviewed_by_name: viewer.name, reviewed_at: now });
  if (act === "publish") {
    Object.assign(patch, { published_at: now });
    if (gen.output.channel === "website_article" && !gen.slug) patch.slug = slugify(gen.output.headline, gen.id);
  }
  try {
    const updated = await repo.updateGeneration(gen.id, patch);
    await repo.audit(`generation.${act}`, "generation", gen.id, { channel: gen.channel, language: gen.language, from: gen.status, to: updated.status, slug: updated.slug });
    revalidatePath("/studio/review");
    revalidatePath("/stories");
    return { ok: true, status: updated.status, slug: updated.slug };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function addReviewComment(id: string, body: string) {
  await requireRole(isStaff);
  const text = z.string().trim().min(1).max(1000).parse(body);
  const repo = await getRepo();
  await repo.addComment(id, text);
  await repo.audit("generation.comment", "generation", id, {});
  revalidatePath("/studio/review");
  return { ok: true };
}
