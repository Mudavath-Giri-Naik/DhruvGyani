import { z } from "zod";
import { explain } from "@/lib/ai/explain";
import { getRepo } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const Body = z.object({
  itemId: z.string().uuid(),
  level: z.enum(["school", "college", "expert"]),
  lang: z.enum(["en", "hi"]),
});

export async function POST(request: Request) {
  const limited = await rateLimit("explain", 20);
  if (limited) return limited;
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const repo = await getRepo();
  const item = await repo.getItem(body.data.itemId);
  if (!item) return Response.json({ error: "Not found" }, { status: 404 });
  try {
    const result = await explain(repo, item, body.data.level, body.data.lang);
    return Response.json(result);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: status === 429 ? (e as Error).message : "The explainer is unavailable right now. Please try again." }, { status });
  }
}
