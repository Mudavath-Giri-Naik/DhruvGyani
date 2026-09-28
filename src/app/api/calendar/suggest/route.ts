import { z } from "zod";
import { draftOne, verifyDraft } from "@/lib/ai/generate";
import { getRepo, guardApi, isStaff } from "@/lib/auth";
import { occasionTags, suggestItems } from "@/lib/calendar";
import { PROMPT_VERSION } from "@/lib/constants";
import { isPubliclyVisible } from "@/lib/policy";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 120;

/** GET: fresh suggestions of published items for each calendar occasion. */
export async function GET() {
  const { deny } = await guardApi(isStaff);
  if (deny) return deny;
  const repo = await getRepo();
  const [calendar, items] = await Promise.all([repo.calendar(), repo.listItems()]);
  const pub = items.filter((i) => isPubliclyVisible(i));
  return Response.json({
    entries: calendar.map((c) => ({ ...c, suggested_item_ids: suggestItems(occasionTags(c.occasion), pub) })),
  });
}

const Body = z.object({ from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), days: z.number().int().min(1).max(60).default(7) });

/**
 * POST: "Build this week's pack" — for each occasion in the window, draft an
 * Instagram + X post from its top suggested item and send them to review.
 * Nothing is published without a reviewer.
 */
export async function POST(request: Request) {
  const { deny } = await guardApi(isStaff);
  if (deny) return deny;
  const limited = await rateLimit("calendar-pack", 3);
  if (limited) return limited;
  const body = Body.parse(await request.json().catch(() => ({})));
  const repo = await getRepo();
  const from = body.from ?? new Date().toISOString().slice(0, 10);
  const to = new Date(new Date(from).getTime() + body.days * 86400000).toISOString().slice(0, 10);
  let window = (await repo.calendar()).filter((c) => c.date >= from && c.date <= to);
  // Quiet week? Prepare for the next occasion instead of doing nothing.
  if (!window.length) window = (await repo.calendar()).filter((c) => c.date >= from).slice(0, 1);

  const created: { occasion: string; channel: string; id: string }[] = [];
  const skipped: string[] = [];
  for (const occ of window) {
    const itemId = occ.suggested_item_ids[0];
    if (!itemId) {
      skipped.push(`${occ.occasion}: no matching published items (content gap)`);
      continue;
    }
    for (const channel of ["instagram", "x"] as const) {
      try {
        const d = await draftOne(repo, { itemIds: [itemId], audience: "public", language: "en", channel });
        const gen = await repo.createGeneration({
          item_ids: [itemId],
          audience: "public",
          language: "en",
          channel,
          prompt_version: PROMPT_VERSION,
          model: d.model,
          output: d.output,
          citations: d.citations,
          slug: null,
          status: "in_review",
          reviewed_by: null,
          reviewed_at: null,
          published_at: null,
        });
        await repo.replaceClaims(gen.id, await verifyDraft(gen.id, d.output, d.citations, d.chunks));
        created.push({ occasion: occ.occasion, channel, id: gen.id });
      } catch (e) {
        skipped.push(`${occ.occasion} (${channel}): ${(e as Error).message}`);
      }
    }
    await repo.updateCalendar(occ.id, { status: "planned" }).catch(() => {});
  }
  await repo.audit("calendar.pack", "calendar", null, { created: created.length, window: `${from}..${to}` });
  return Response.json({ created, skipped });
}
