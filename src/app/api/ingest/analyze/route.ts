import { z } from "zod";
import { parseWithRetry } from "@/lib/ai/json";
import { getLlm } from "@/lib/ai/llm";
import { getRepo, guardApi, isStaff } from "@/lib/auth";
import { profileCsv } from "@/lib/datasets/profile";
import { extractPdfPages } from "@/lib/ingest/process";
import { ALT_TEXT_PROMPT, AUTOFILL_PROMPT, Suggestion, heuristicAutofill } from "@/lib/ingest/autofill";
import { hamming, validateUpload } from "@/lib/ingest/validate";
import { isAiAllowed } from "@/lib/policy";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const Release = z.object({
  visibility: z.enum(["public", "internal"]),
  embargo_until: z.string().nullable(),
});

/**
 * Step 2 of the upload flow: read the file WITHOUT storing it and propose
 * metadata. AI autofill runs only when the release answer allows AI
 * (public and not embargoed); otherwise a heuristic suggestion is returned.
 */
export async function POST(request: Request) {
  const { deny } = await guardApi(isStaff);
  if (deny) return deny;
  const limited = await rateLimit("analyze", 20);
  if (limited) return limited;

  const form = await request.formData();
  const file = form.get("file");
  const release = Release.safeParse(JSON.parse(String(form.get("release") ?? "{}")));
  if (!(file instanceof File) || !release.success) return Response.json({ error: "Missing file or release answer" }, { status: 400 });
  const phash = typeof form.get("phash") === "string" ? String(form.get("phash")) : null;

  const v = await validateUpload(file);
  if ("error" in v) return Response.json({ error: v.error }, { status: 415 });

  const repo = await getRepo();
  const expeditions = await repo.expeditions();
  const codes = expeditions.map((e) => e.code);
  const aiAllowed = isAiAllowed({ visibility: release.data.visibility, embargo_until: release.data.embargo_until });

  let text = "";
  let pages = 0;
  const extra: Record<string, unknown> = {};

  if (v.kind === "pdf") {
    try {
      const p = await extractPdfPages(v.bytes);
      pages = p.length;
      text = p.map((x) => x.text).join("\n");
      if (!text.trim()) extra.warning = "No text layer found — this may be a scanned PDF. It will be indexed by title and description only.";
    } catch {
      extra.warning = "Could not read text from this PDF.";
    }
  } else if (v.kind === "csv") {
    const csv = new TextDecoder().decode(v.bytes);
    const { rows: _rows, ...profile } = profileCsv(csv);
    void _rows;
    extra.csv = { columns: profile.columns, row_count: profile.row_count, time_range: profile.time_range, sample_rows: profile.sample_rows };
    text = `${file.name} ${profile.columns.map((c) => c.name).join(" ")}`;
  } else if (v.kind === "image") {
    try {
      const exifr = (await import("exifr")).default;
      const exif = await exifr.parse(Buffer.from(v.bytes), ["DateTimeOriginal", "CreateDate"]).catch(() => null);
      const date: Date | undefined = exif?.DateTimeOriginal ?? exif?.CreateDate;
      if (date) {
        const iso = new Date(date).toISOString().slice(0, 10);
        extra.exifDate = iso;
        const match = expeditions.find((e) => e.start_date && e.start_date <= iso && (!e.end_date || iso <= e.end_date));
        if (match) extra.suggestedExpedition = match.code;
      }
    } catch {
      /* no EXIF */
    }
    if (phash) {
      const hashes = await repo.photoHashes();
      const dupes = hashes.filter((h) => hamming(h.phash, phash) <= 6).map((h) => h.item_id);
      if (dupes.length) extra.duplicates = (await repo.getItems(dupes)).map((i) => ({ id: i.id, title: i.title }));
    }
  }

  let suggestion = heuristicAutofill({ filename: file.name, text, knownCodes: codes });
  if (!suggestion.expedition_code && typeof extra.suggestedExpedition === "string") suggestion.expedition_code = extra.suggestedExpedition;
  let source: "ai" | "heuristic" = "heuristic";
  const llm = getLlm();

  // Server-enforced: only material cleared for public release is ever sent to the AI.
  if (aiAllowed && llm) {
    try {
      if (v.kind === "image" && v.bytes.byteLength < 6 * 1024 * 1024) {
        const out = await parseWithRetry(z.object({ alt_text: z.string().max(400), title: z.string().max(200) }), () =>
          llm.describeImage(ALT_TEXT_PROMPT, Buffer.from(v.bytes).toString("base64"), file.type, { json: true }),
        );
        suggestion = { ...suggestion, alt_text: out.alt_text, title: out.title || suggestion.title };
        source = "ai";
      } else if (text.trim()) {
        const ai = await parseWithRetry(Suggestion, (_n, fb) => llm.generate(AUTOFILL_PROMPT(text, codes) + (fb ? `\n\n${fb}` : ""), { json: true }));
        suggestion = { ...suggestion, ...ai, alt_text: suggestion.alt_text };
        source = "ai";
      }
    } catch {
      // fall back to heuristic suggestion
    }
  }

  return Response.json({
    kind: v.kind,
    pages,
    textPreview: text.replace(/\s+/g, " ").slice(0, 600),
    suggestion,
    source,
    aiAllowed,
    aiAvailable: Boolean(llm),
    ...extra,
  });
}
