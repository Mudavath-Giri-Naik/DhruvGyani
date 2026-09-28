import { getRepo, guardApi, isStaff } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const { deny } = await guardApi(isStaff);
  if (deny) return deny;
  const repo = await getRepo();
  const queue = await repo.listGenerations({ status: ["in_review"] });
  return Response.json({ count: queue.length }, { headers: { "Cache-Control": "no-store" } });
}
