import { getRepo, guardApi, isReviewer } from "@/lib/auth";
import { releaseDueEmbargoes } from "@/lib/embargo";

export const runtime = "nodejs";

/** Release items whose embargo has passed. Reviewers/admins (or a scheduled job calling as one). */
export async function POST() {
  const { deny } = await guardApi(isReviewer);
  if (deny) return deny;
  const released = await releaseDueEmbargoes(await getRepo());
  return Response.json({ released });
}
