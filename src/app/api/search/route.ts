import { z } from "zod";
import { embedQuery } from "@/lib/ai/llm";
import { getRepo } from "@/lib/auth";
import { ITEM_TYPES, LANGS } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const Query = z.object({
  q: z.string().trim().min(1).max(200),
  types: z.string().optional(),
  expedition: z.string().uuid().optional(),
  station: z.string().uuid().optional(),
  year: z.coerce.number().int().min(1950).max(2100).optional(),
  discipline: z.string().max(60).optional(),
  language: z.enum(LANGS).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  log: z.enum(["0", "1"]).optional(),
});

/** Hybrid search (keyword + meaning). Used by /explore and the ⌘K palette. */
export async function GET(request: Request) {
  const limited = await rateLimit("search", 60);
  if (limited) return limited;
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = Query.safeParse(params);
  if (!parsed.success) return Response.json({ results: [] });
  const { q, types, limit = 24, log, ...f } = parsed.data;
  const repo = await getRepo();
  const typeList = (types?.split(",") ?? []).filter((t): t is (typeof ITEM_TYPES)[number] => (ITEM_TYPES as readonly string[]).includes(t));
  const embedding = await embedQuery(q);
  const results = await repo.search(q, { types: typeList, expeditionId: f.expedition, stationId: f.station, year: f.year, discipline: f.discipline, language: f.language }, embedding);
  if (log !== "0") await repo.logSearch(q, results.length).catch(() => {});
  return Response.json({
    mode: embedding ? "hybrid" : "keyword",
    results: results.slice(0, limit).map((r) => ({
      id: r.item.id,
      title: r.item.title,
      type: r.item.type,
      snippet: r.snippet,
      score: r.score,
      date: r.item.event_date,
      expedition: r.item.expedition_id,
      language: r.item.language,
      sample: r.item.is_sample,
    })),
  });
}
