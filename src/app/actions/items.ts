"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRepo, isReviewer, isStaff, requireRole } from "@/lib/auth";
import { isAiAllowed } from "@/lib/policy";
import { runJob } from "@/lib/ingest/process";

const Release = z.object({
  itemId: z.string().uuid(),
  status: z.enum(["draft", "in_review", "published"]),
  visibility: z.enum(["internal", "public"]),
  embargo_until: z.string().datetime().nullable(),
});

/** Staff panel: change status / release settings. Reviewers publish; curators cannot. */
export async function updateItemRelease(input: z.infer<typeof Release>) {
  const viewer = await requireRole(isStaff);
  const data = Release.parse(input);
  if (data.status === "published" && !isReviewer(viewer.role)) {
    return { ok: false as const, error: "Only reviewers can publish." };
  }
  const repo = await getRepo();
  const before = await repo.getItem(data.itemId);
  if (!before) return { ok: false as const, error: "Not found" };
  const after = await repo.updateItem(data.itemId, {
    status: data.status,
    visibility: data.visibility,
    embargo_until: data.embargo_until,
  });
  await repo.audit(
    before.status !== after.status ? `item.${after.status === "published" ? "publish" : "status"}` : "item.release",
    "item",
    after.id,
    { title: after.title, status: after.status, visibility: after.visibility, embargo_until: after.embargo_until },
  );
  // Newly cleared for AI: queue embeddings so semantic search and the Studio can use it.
  if (!isAiAllowed(before) && isAiAllowed(after)) {
    const job = await repo.enqueueJob({ type: "embed_item", payload: {}, item_id: after.id });
    await runJob(repo, job.id).catch(() => {});
  }
  revalidatePath(`/items/${after.id}`);
  return { ok: true as const };
}
