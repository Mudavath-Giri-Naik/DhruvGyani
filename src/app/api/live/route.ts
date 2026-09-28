import { z } from "zod";
import { parseWithRetry } from "@/lib/ai/json";
import { getLlm } from "@/lib/ai/llm";
import { getRepo, guardApi, isStaff } from "@/lib/auth";
import { PROMPT_VERSION } from "@/lib/constants";
import { safeName, validateUpload } from "@/lib/ingest/validate";
import { isAiAllowed } from "@/lib/policy";
import type { Citation } from "@/lib/types";

export const runtime = "nodejs";

const Meta = z.object({
  expedition_id: z.string().uuid(),
  day: z.number().int().min(1).max(400),
  note: z.string().trim().min(10).max(1500),
  visibility: z.enum(["public", "internal"]),
});

/**
 * Live Expedition Mode: a field team sends a photo + note. We store the photo
 * as an item (in review), keep the note as its source text, and draft a
 * "Day N" update into the Review Queue. AI polishing happens only when the
 * material is marked public; otherwise the note is used verbatim.
 */
export async function POST(request: Request) {
  const { deny } = await guardApi(isStaff);
  if (deny) return deny;
  const form = await request.formData();
  const meta = Meta.safeParse({ ...JSON.parse(String(form.get("meta") ?? "{}")) });
  if (!meta.success) return Response.json({ error: "Add the expedition, day number and a note of at least 10 characters." }, { status: 422 });
  const { expedition_id, day, note, visibility } = meta.data;
  const repo = await getRepo();
  const exp = (await repo.expeditions()).find((e) => e.id === expedition_id);
  if (!exp) return Response.json({ error: "Unknown expedition" }, { status: 404 });

  let mediaUrl: string | null = null;
  const file = form.get("photo");
  let stored: { path: string; size: number; mime: string } | null = null;
  if (file instanceof File && file.size > 0) {
    const v = await validateUpload(file);
    if ("error" in v || v.kind !== "image") return Response.json({ error: "error" in v ? v.error : "Please attach a photo (JPG, PNG or WebP)." }, { status: 415 });
    const path = `live/${exp.code}/${Date.now()}-${safeName(file.name)}`;
    mediaUrl = await repo.putFile("private-uploads", path, v.bytes, file.type);
    stored = { path, size: file.size, mime: file.type };
  }

  const today = new Date().toISOString().slice(0, 10);
  const item = await repo.createItem({
    type: "photo",
    title: `${exp.code} · Day ${day} field update`,
    description: note,
    expedition_id,
    station_id: exp.station_id,
    discipline: ["Field update"],
    tags: ["live", exp.code],
    authors: ["Field team"],
    event_date: today,
    language: /[ऀ-ॿ]/.test(note) ? "hi" : "en",
    license: null,
    source_url: null,
    external_url: null,
    status: "in_review",
    visibility,
    embargo_until: null,
    is_sample: false,
    media_url: mediaUrl,
    alt_text: null,
  });
  if (stored) await repo.addItemFile({ item_id: item.id, storage_bucket: "private-uploads", storage_path: stored.path, mime: stored.mime, size: stored.size, checksum: null });
  await repo.replaceChunks(item.id, [{ page_no: null, chunk_index: 0, content: note }]);
  const [chunk] = await repo.chunksFor([item.id]);

  const citations: Citation[] = [{ marker: "c1", chunk_id: chunk?.id ?? item.id, item_id: item.id, item_title: item.title, page_no: null, quote: note.slice(0, 200) }];
  let text = `Day ${day} on ${exp.code}: ${note} [c1]`;
  let model = "field note (verbatim)";
  const llm = getLlm();
  if (llm && isAiAllowed(item)) {
    try {
      const out = await parseWithRetry(z.object({ text: z.string().min(10).max(900) }), () =>
        llm.generate(
          `Turn this expedition field note into a short, friendly "Day ${day}" social update (max 90 words) for ${exp.title}. Use ONLY facts in the note; copy numbers exactly; end every sentence with [c1]. Return JSON {"text": string}.\n\nNOTE [c1]: ${note}`,
          { json: true },
        ),
      );
      text = out.text;
      model = llm.model;
    } catch {
      /* keep verbatim */
    }
  }

  const gen = await repo.createGeneration({
    item_ids: [item.id],
    audience: "public",
    language: item.language,
    channel: "instagram",
    prompt_version: `${PROMPT_VERSION}-live`,
    model,
    output: { channel: "instagram", text, cites: ["c1"], hashtags: [`#${exp.code.replace(/-/g, "")}`, "#PolarScience", "#DhruvGyani"], alt_text: "", image_suggestion: "Use the attached field photo." },
    citations,
    slug: null,
    status: "in_review",
    reviewed_by: null,
    reviewed_at: null,
    published_at: null,
  });
  const { verifyClaimsOffline } = await import("@/lib/trust/claims");
  await repo.replaceClaims(
    gen.id,
    verifyClaimsOffline(gen.id, gen.output, citations, chunk ? [chunk] : []).map(({ id: _id, ...c }) => {
      void _id;
      return c;
    }),
  );
  await repo.audit("live.update", "generation", gen.id, { title: item.title, day });
  return Response.json({ ok: true, itemId: item.id, generationId: gen.id });
}
