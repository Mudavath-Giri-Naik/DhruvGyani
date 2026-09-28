import { z } from "zod";
import { draftOne, verifyDraft } from "@/lib/ai/generate";
import { getRepo, guardApi, isStaff } from "@/lib/auth";
import { AUDIENCES, CHANNELS, LANGS, PROMPT_VERSION } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const Body = z.object({
  itemIds: z.array(z.string().uuid()).min(1).max(5),
  audience: z.enum(AUDIENCES),
  language: z.enum(LANGS),
  channels: z.array(z.enum(CHANNELS)).min(1).max(5),
});

/**
 * Content Studio generation. Streams NDJSON progress so long generations
 * show up as they finish: {type:"stage"} → {type:"generation"} per channel →
 * {type:"done"}. Every draft is saved as status "draft" — never published.
 */
export async function POST(request: Request) {
  const { deny } = await guardApi(isStaff);
  if (deny) return deny;
  const limited = await rateLimit("generate", 8);
  if (limited) return limited;
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Choose 1–5 sources and at least one channel." }, { status: 400 });
  const { itemIds, audience, language, channels } = body.data;
  const repo = await getRepo();
  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(enc.encode(JSON.stringify(obj) + "\n"));
      send({ type: "stage", stage: "retrieving" });
      for (const channel of channels) {
        send({ type: "stage", stage: "drafting", channel });
        try {
          const draft = await draftOne(repo, { itemIds, audience, language, channel });
          send({ type: "stage", stage: "verifying", channel });
          const gen = await repo.createGeneration({
            item_ids: itemIds,
            audience,
            language,
            channel,
            prompt_version: PROMPT_VERSION,
            model: draft.model,
            output: draft.output,
            citations: draft.citations,
            slug: null,
            status: "draft",
            reviewed_by: null,
            reviewed_at: null,
            published_at: null,
          });
          const claims = await repo.replaceClaims(gen.id, await verifyDraft(gen.id, draft.output, draft.citations, draft.chunks));
          await repo.audit("generation.create", "generation", gen.id, { channel, language, mode: draft.mode });
          send({ type: "generation", mode: draft.mode, generation: gen, claims, chunks: draft.chunks });
        } catch (e) {
          const status = (e as { status?: number }).status;
          send({ type: "error", channel, status, message: (e as Error).message });
        }
      }
      send({ type: "done" });
      controller.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
}
