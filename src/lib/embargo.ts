import "server-only";

import type { Repo } from "@/lib/data/repo";
import { runJob } from "@/lib/ingest/process";

/**
 * Release items whose embargo date has passed: clear `embargo_until`, write
 * the audit log and queue embedding so AI features can use them. Called by
 * /api/embargo/release (cron) and lazily when staff open the Studio.
 */
export async function releaseDueEmbargoes(repo: Repo): Promise<{ id: string; title: string }[]> {
  const now = Date.now();
  const due = (await repo.listItems({ includeNonPublic: true })).filter((i) => i.embargo_until && new Date(i.embargo_until).getTime() <= now);
  const released: { id: string; title: string }[] = [];
  for (const item of due) {
    await repo.updateItem(item.id, { embargo_until: null });
    await repo.audit("embargo.release", "item", item.id, { title: item.title, was: item.embargo_until });
    const job = await repo.enqueueJob({ type: "embed_item", payload: {}, item_id: item.id });
    await runJob(repo, job.id).catch(() => {});
    released.push({ id: item.id, title: item.title });
  }
  return released;
}
