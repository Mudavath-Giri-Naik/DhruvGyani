import { z } from "zod";
import { getRepo, guardApi } from "@/lib/auth";

const Body = z.object({ itemId: z.string().uuid() });

export async function POST(request: Request) {
  const { deny } = await guardApi((r) => r !== "visitor");
  if (deny) return deny;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const repo = await getRepo();
  if (!(await repo.getItem(parsed.data.itemId))) return Response.json({ error: "Not found" }, { status: 404 });
  const on = await repo.toggleFavourite(parsed.data.itemId);
  return Response.json({ on });
}
