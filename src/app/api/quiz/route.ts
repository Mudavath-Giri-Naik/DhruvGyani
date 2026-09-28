import { z } from "zod";
import { getRepo, guardApi } from "@/lib/auth";

const Body = z.object({ itemId: z.string().uuid(), score: z.number().int().min(0).max(20) });

/** Members' quiz attempts (owner-only in RLS). */
export async function POST(request: Request) {
  const { deny } = await guardApi((r) => r !== "visitor");
  if (deny) return deny;
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Invalid" }, { status: 400 });
  const repo = await getRepo();
  await repo.addQuizAttempt(body.data.itemId, body.data.score);
  return Response.json({ ok: true });
}
