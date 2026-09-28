import { z } from "zod";
import { ask } from "@/lib/ai/ask";
import { getRepo } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const Body = z.object({ question: z.string().trim().min(3).max(300), lang: z.enum(["en", "hi"]).default("en") });

/** Ask NCPOR: cited answers from published, public archive content only. */
export async function POST(request: Request) {
  const limited = await rateLimit("ask", 15);
  if (limited) return limited;
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Please ask a question (3–300 characters)." }, { status: 400 });
  const repo = await getRepo();
  try {
    const result = await ask(repo, body.data.question, body.data.lang);
    await repo.logSearch(`ask: ${body.data.question}`, result.found ? result.citations.length : 0).catch(() => {});
    return Response.json(result);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    return Response.json({ error: status === 429 ? (e as Error).message : "Ask NCPOR is unavailable right now." }, { status });
  }
}
