import { z } from "zod";
import { verifyDraft } from "@/lib/ai/generate";
import { getRepo, guardApi, isStaff } from "@/lib/auth";
import { applyClaimEdit } from "@/lib/trust/claims";

export const runtime = "nodejs";

const Body = z.object({
  generationId: z.string().uuid(),
  edit: z.object({ index: z.number().int().min(0), text: z.string().max(1200) }).optional(),
});

/** Re-run the Trust Panel, optionally after editing or removing one sentence. */
export async function POST(request: Request) {
  const { deny } = await guardApi(isStaff);
  if (deny) return deny;
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const repo = await getRepo();
  const gen = await repo.getGeneration(body.data.generationId);
  if (!gen) return Response.json({ error: "Not found" }, { status: 404 });
  if (!["draft", "in_review"].includes(gen.status)) return Response.json({ error: "Approved or published content can't be edited." }, { status: 409 });

  const output = body.data.edit ? applyClaimEdit(gen.output, body.data.edit.index, body.data.edit.text) : gen.output;
  const itemIds = [...new Set(gen.citations.map((c) => c.item_id))];
  const chunks = await repo.chunksFor(itemIds);
  const fresh = await verifyDraft(gen.id, output, gen.citations, chunks);
  const updated = body.data.edit ? await repo.updateGeneration(gen.id, { output }) : gen;
  const claims = await repo.replaceClaims(gen.id, fresh);
  if (body.data.edit) await repo.audit("generation.edit", "generation", gen.id, { index: body.data.edit.index, removed: !body.data.edit.text.trim() });
  return Response.json({ generation: updated, claims, chunks });
}
