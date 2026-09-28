import { after } from "next/server";
import { z } from "zod";
import { getRepo, guardApi, isStaff } from "@/lib/auth";
import { ITEM_TYPES } from "@/lib/constants";
import { runJob } from "@/lib/ingest/process";

export const runtime = "nodejs";

const Row = z.object({
  title: z.string().trim().min(3, "title too short").max(200),
  type: z.enum(ITEM_TYPES, { message: `type must be one of ${ITEM_TYPES.join(", ")}` }),
  expedition_code: z.string().trim().max(40).optional().default(""),
  date: z
    .string()
    .trim()
    .regex(/^(\d{4}-\d{2}-\d{2})?$/, "date must be YYYY-MM-DD")
    .optional()
    .default(""),
  source_url: z.string().trim().url("source_url must be a URL").refine((u) => /^https?:\/\//.test(u), "source_url must be http(s)"),
  tags: z.string().trim().max(300).optional().default(""),
});

const Body = z.object({
  rows: z.array(z.record(z.string(), z.string())).min(1).max(200),
  visibility: z.enum(["public", "internal"]),
  commit: z.boolean().default(false),
});

/**
 * Bulk import of link items. `commit: false` validates and previews only;
 * `commit: true` creates the valid rows as "in review" items.
 */
export async function POST(request: Request) {
  const { deny } = await guardApi(isStaff);
  if (deny) return deny;
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Send 1–200 rows" }, { status: 400 });
  const repo = await getRepo();
  const expeditions = await repo.expeditions();

  const results = body.data.rows.map((raw, index) => {
    const r = Row.safeParse(raw);
    if (!r.success) return { index, ok: false as const, errors: r.error.issues.map((i) => i.message) };
    const exp = r.data.expedition_code ? expeditions.find((e) => e.code.toLowerCase() === r.data.expedition_code.toLowerCase()) : null;
    if (r.data.expedition_code && !exp) return { index, ok: false as const, errors: [`unknown expedition_code "${r.data.expedition_code}"`] };
    return { index, ok: true as const, row: r.data, expeditionId: exp?.id ?? null };
  });

  if (!body.data.commit) return Response.json({ results: results.map(({ index, ok, ...rest }) => ({ index, ok, errors: "errors" in rest ? rest.errors : [] })) });

  let created = 0;
  for (const r of results) {
    if (!r.ok) continue;
    const item = await repo.createItem({
      type: r.row.type,
      title: r.row.title,
      description: `Imported link: ${new URL(r.row.source_url).hostname}`,
      expedition_id: r.expeditionId,
      station_id: null,
      discipline: [],
      tags: r.row.tags ? r.row.tags.split(/[;|]/).map((t) => t.trim()).filter(Boolean) : [],
      authors: [],
      event_date: r.row.date || null,
      language: "en",
      license: "See source site",
      source_url: r.row.source_url,
      external_url: r.row.source_url,
      status: "in_review",
      visibility: body.data.visibility,
      embargo_until: null,
      is_sample: false,
      media_url: null,
      alt_text: null,
    });
    const job = await repo.enqueueJob({ type: "embed_item", payload: {}, item_id: item.id });
    after(() => runJob(repo, job.id));
    created++;
  }
  await repo.audit("item.bulk_import", "item", null, { created });
  return Response.json({ created });
}
