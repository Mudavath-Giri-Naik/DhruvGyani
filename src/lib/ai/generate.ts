import "server-only";

import { z } from "zod";
import { PROMPT_VERSION } from "@/lib/constants";
import type { Repo } from "@/lib/data/repo";
import { assertAiAllowed, isPubliclyVisible } from "@/lib/policy";
import { seedGenerations } from "@/lib/seed/packs";
import type { Audience, Channel, Chunk, Citation, GenerationClaim, GenerationOutput, Item, Lang } from "@/lib/types";
import { resolveSources, splitClaims, verifyClaimsOffline, heuristicVerdict } from "@/lib/trust/claims";
import { unmatchedNumbers } from "@/lib/trust/numbers";
import { sourcesBlock, toCitations } from "./explain";
import { parseWithRetry } from "./json";
import { cached, getLlm, LlmUnavailableError } from "./llm";

export const AUDIENCE_BRIEF: Record<Audience, string> = {
  school: "school students (Class 6–8): short sentences, everyday words, curious and friendly",
  college: "college students: clear and precise, brief explanations of technical terms",
  expert: "scientists and specialists: concise and technical",
  public: "the general public: warm, clear, no jargon",
};

const CHANNEL_BRIEF: Record<Channel, string> = {
  website_article:
    'A website article. JSON: {"headline": string (max 90 chars), "standfirst": string (1-2 sentences), "body": [{"text": string, "cites": ["c1"]}] (3-5 short paragraphs), "key_facts": [{"text": string, "cites": ["c1"]}] (2-4 items)}',
  x: 'An X (Twitter) post. JSON: {"text": string (MAX 240 characters excluding citation markers), "cites": ["c1"], "hashtags": [string] (max 3)}',
  facebook: 'A Facebook post, 60-120 words. JSON: {"text": string, "cites": ["c1"], "hashtags": [string] (max 4)}',
  instagram:
    'An Instagram caption, max 120 words, friendly. JSON: {"text": string, "cites": ["c1"], "hashtags": [string] (max 8), "alt_text": string (describe a suitable image), "image_suggestion": string (which archive image to use)}',
  linkedin: 'A LinkedIn post, 80-150 words, professional. JSON: {"text": string, "cites": ["c1"], "hashtags": [string] (max 4)}',
};

const Para = z.object({ text: z.string().min(1).max(1200), cites: z.array(z.string().regex(/^c\d+$/)).default([]) });
const ArticleSchema = z.object({
  headline: z.string().min(5).max(140),
  standfirst: z.string().min(10).max(400),
  body: z.array(Para).min(1).max(8),
  key_facts: z.array(Para).max(6).default([]),
});
const SocialSchema = z.object({
  text: z.string().min(10).max(1500),
  cites: z.array(z.string().regex(/^c\d+$/)).default([]),
  hashtags: z.array(z.string().max(40)).max(10).default([]),
  alt_text: z.string().max(400).optional(),
  image_suggestion: z.string().max(300).optional(),
});

export const stripMarkers = (s: string) => s.replace(/\s*\[\s*c\d+(?:\s*,\s*c\d+)*\s*\]/g, "").trim();

/** Plain-text export (markers removed, hashtags and sources appended). */
export function exportText(output: GenerationOutput, citations: Citation[]): string {
  const sources = citations.map((c) => `[${c.marker.slice(1)}] ${c.item_title}${c.page_no ? `, p.${c.page_no}` : ""}`).join("\n");
  if (output.channel === "website_article") {
    return [output.headline, "", output.standfirst, "", ...output.body.map((p) => stripMarkers(p.text)), "", "Key facts:", ...output.key_facts.map((f) => `• ${stripMarkers(f.text)}`), "", "Sources:", sources].join("\n");
  }
  return [stripMarkers(output.text), output.hashtags?.length ? `\n${output.hashtags.join(" ")}` : ""].join("");
}

export interface DraftInput {
  itemIds: string[];
  audience: Audience;
  language: Lang;
  channel: Channel;
}

export interface Draft {
  output: GenerationOutput;
  citations: Citation[];
  chunks: Chunk[];
  model: string;
  mode: "ai" | "demo-pack" | "offline-template";
}

/** Load and check the selected sources. Server-enforced: public, released, AI-allowed only. */
export async function loadSources(repo: Repo, itemIds: string[]): Promise<{ items: Item[]; chunks: Chunk[]; citations: Citation[] }> {
  const items = await repo.getItems(itemIds);
  if (items.length !== itemIds.length) throw Object.assign(new Error("Some sources were not found."), { status: 404 });
  const notPublic = items.filter((i) => !isPubliclyVisible(i));
  if (notPublic.length) throw Object.assign(new Error("Only published, public, non-embargoed items can be used as Studio sources."), { status: 403 });
  assertAiAllowed(items);
  const all = await repo.chunksFor(itemIds);
  // keep reading order, cap to what fits the prompt
  const chunks = itemIds.flatMap((id) => all.filter((c) => c.item_id === id)).slice(0, 14);
  if (!chunks.length) throw Object.assign(new Error("The selected items have no text yet (still processing?)."), { status: 422 });
  const citations = chunks.map((c, i) => ({ ...toCitations([c], items.find((x) => x.id === c.item_id)!)[0], marker: `c${i + 1}` }));
  return { items, chunks, citations };
}

function fromPack(input: DraftInput, chunks: Chunk[]): Draft | null {
  const key = [...input.itemIds].sort().join(",");
  const pack = seedGenerations.find((g) => [...g.item_ids].sort().join(",") === key && g.language === input.language && g.channel === input.channel);
  if (!pack) return null;
  // Deliberately keep the pack's own citations (they point at the same seed chunks).
  return { output: structuredClone(pack.output), citations: pack.citations, chunks, model: "pre-generated demo", mode: "demo-pack" };
}

/** Offline template: verbatim, cited source sentences arranged in the channel's shape. */
function offlineTemplate(input: DraftInput, items: Item[], chunks: Chunk[], citations: Citation[]): Draft {
  if (input.language === "hi") throw new LlmUnavailableError("AI unavailable: Hindi drafts need the AI service (no pre-generated Hindi pack for these sources).");
  const sentences = chunks.flatMap((c, i) =>
    c.content
      .replace(/^SAMPLE[^.]*\.\s*/, "")
      .split(/(?<=[.!?])\s+/)
      .filter((s) => s.length > 30 && s.split(/\s+/).length >= 7)
      .map((s) => ({ s, cite: `c${i + 1}` })),
  );
  const tags = [...new Set(items.flatMap((i) => i.tags))].slice(0, 4).map((t) => `#${t.replace(/[^\p{L}\p{N}]+/gu, "")}`);
  const withCite = (x: { s: string; cite: string }) => `${x.s} [${x.cite}]`;
  let output: GenerationOutput;
  if (input.channel === "website_article") {
    const byChunk = chunks.map((_, i) => sentences.filter((x) => x.cite === `c${i + 1}`).slice(0, 2)).filter((g) => g.length);
    output = {
      channel: "website_article",
      headline: items[0].title,
      standfirst: items[0].description,
      body: byChunk.slice(0, 4).map((g) => ({ text: g.map(withCite).join(" "), cites: [...new Set(g.map((x) => x.cite))] })),
      key_facts: sentences.filter((x) => /\d/.test(x.s)).slice(0, 3).map((x) => ({ text: withCite(x), cites: [x.cite] })),
    };
  } else {
    const limit = input.channel === "x" ? 240 : input.channel === "instagram" ? 600 : 800;
    const picked: typeof sentences = [];
    for (const x of sentences) {
      if (stripMarkers(picked.map((p) => p.s).join(" ") + " " + x.s).length > limit) break;
      picked.push(x);
      if (picked.length >= (input.channel === "x" ? 2 : 4)) break;
    }
    output = {
      channel: input.channel,
      text: picked.map(withCite).join(" "),
      cites: [...new Set(picked.map((p) => p.cite))],
      hashtags: input.channel === "x" ? tags.slice(0, 2) : tags,
      ...(input.channel === "instagram" ? { alt_text: items.find((i) => i.alt_text)?.alt_text ?? "Illustration related to the source item.", image_suggestion: `Use an illustration linked to ${items[0].title}.` } : {}),
    } as GenerationOutput;
  }
  return { output, citations, chunks, model: "offline template (no AI)", mode: "offline-template" };
}

export async function draftOne(repo: Repo, input: DraftInput): Promise<Draft> {
  const { items, chunks, citations } = await loadSources(repo, input.itemIds);
  const llm = getLlm();
  if (!llm) return fromPack(input, chunks) ?? offlineTemplate(input, items, chunks, citations);

  const key = `gen:${PROMPT_VERSION}:${[...input.itemIds].sort().join(",")}:${input.audience}:${input.language}:${input.channel}`;
  return cached(key, async () => {
    const prompt = `Write for ${AUDIENCE_BRIEF[input.audience]}.
Language: ${input.language === "hi" ? "Hindi (Devanagari script, natural modern Hindi; keep numbers as digits exactly as in the sources)" : "English (Indian English spelling)"}.
Format: ${CHANNEL_BRIEF[input.channel]}

STRICT RULES
1. Use ONLY facts stated in the SOURCES. Do not add any fact, number, date, name or claim that is not in them.
2. After EVERY sentence put the marker(s) of the source(s) that support it, like [c2] or [c1, c3], and list them in "cites".
3. Copy every number, unit and date exactly as written in the sources.
4. If a source says it is a SAMPLE or fictional, say the content is a sample.
5. Return JSON only.

SOURCES:
${sourcesBlock(citations, chunks)}`;
    const system = "You are a careful science communicator for India's National Centre for Polar and Ocean Research. Accuracy beats style.";
    let output: GenerationOutput;
    if (input.channel === "website_article") {
      const a = await parseWithRetry(ArticleSchema, (_n, fb) => llm.generate(prompt + (fb ? `\n\n${fb}` : ""), { system, json: true }));
      output = { channel: "website_article", ...a };
    } else {
      const s = await parseWithRetry(
        SocialSchema.refine((v) => input.channel !== "x" || stripMarkers(v.text).length + (v.hashtags.join(" ").length ? v.hashtags.join(" ").length + 1 : 0) <= 280, {
          message: "X post must be at most 280 characters including hashtags (citation markers excluded)",
        }),
        (_n, fb) => llm.generate(prompt + (fb ? `\n\n${fb}` : ""), { system, json: true }),
      );
      output = { channel: input.channel, ...s } as GenerationOutput;
    }
    return { output, citations, chunks, model: llm.model, mode: "ai" as const };
  });
}

const VerifySchema = z.object({
  results: z.array(z.object({ index: z.number().int().min(0), verdict: z.enum(["supported", "weak", "unsupported"]), note: z.string().max(300) })),
});

/**
 * Trust Panel verification. Numbers check is always deterministic (code).
 * Wording support uses the LLM when available, else the offline heuristic.
 */
export async function verifyDraft(generationId: string, output: GenerationOutput, citations: Citation[], chunks: Chunk[]): Promise<Omit<GenerationClaim, "id">[]> {
  const offline = verifyClaimsOffline(generationId, output, citations, chunks).map(({ id: _id, ...rest }) => {
    void _id;
    return rest;
  });
  const llm = getLlm();
  if (!llm || !offline.length) return offline;
  const claims = splitClaims(output);
  const prompt = `For each numbered CLAIM, decide if its cited SOURCE text supports it.
verdict: "supported" (fully stated in the source), "weak" (partly supported or needs a caveat), "unsupported" (not in the source or contradicts it).
Claims may be in Hindi while sources are in English; judge meaning, not language.
Return JSON: {"results": [{"index": number, "verdict": "...", "note": "short reason"}]}

${claims
  .map((c, i) => {
    const { texts } = resolveSources(c.cites, citations, chunks);
    return `CLAIM ${i}: ${stripMarkers(c.text)}\nSOURCE ${i}: ${texts.join(" / ") || "(no citation)"}`;
  })
  .join("\n\n")}`;
  try {
    const res = await parseWithRetry(VerifySchema, (_n, fb) => llm.generate(prompt + (fb ? `\n\n${fb}` : ""), { json: true, temperature: 0 }));
    return offline.map((c, i) => {
      const r = res.results.find((x) => x.index === i);
      const verdict = !c.chunk_id ? "unsupported" : (r?.verdict ?? heuristicVerdict(c.claim_text, []).verdict);
      const note = [r?.note ?? c.note, c.number_misses.length ? `Numbers not found in the source: ${c.number_misses.join(", ")}.` : ""].filter(Boolean).join(" ");
      return { generation_id: generationId, claim_text: c.claim_text, chunk_id: c.chunk_id, verdict, note, number_misses: unmatchedNumbers(c.claim_text, resolveSources(claims[i].cites, citations, chunks).texts) };
    });
  } catch {
    return offline;
  }
}
