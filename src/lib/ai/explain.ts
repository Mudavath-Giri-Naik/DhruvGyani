import "server-only";

import { z } from "zod";
import type { Repo } from "@/lib/data/repo";
import { assertAiAllowed, isAiAllowed } from "@/lib/policy";
import type { Chunk, Citation, Explainer, ExplainerLevel, Item, Lang } from "@/lib/types";
import { parseWithRetry } from "./json";
import { getLlm } from "./llm";

export const LEVEL_BRIEF: Record<ExplainerLevel, string> = {
  school: "a curious Class 6–8 student in India: short sentences, everyday words, one friendly comparison, no jargon (explain any term you must use)",
  college: "an undergraduate science student: clear, precise, some technical terms explained briefly",
  expert: "a polar scientist: concise, technical, precise units and methods",
};

const Out = z.object({ text: z.string().min(20).max(3000) });

export function toCitations(chunks: Chunk[], item: Pick<Item, "id" | "title">): Citation[] {
  return chunks.map((c, i) => ({
    marker: `c${i + 1}`,
    chunk_id: c.id,
    item_id: item.id,
    item_title: item.title,
    page_no: c.page_no,
    quote: c.content.replace(/^SAMPLE - not real data\.\s*/, "").slice(0, 200),
  }));
}

export function sourcesBlock(cits: Citation[], chunks: Chunk[]) {
  return cits.map((c, i) => `[${c.marker}] (${c.item_title}${c.page_no ? `, p.${c.page_no}` : ""})\n${chunks[i].content}`).join("\n\n");
}

export type ExplainResult = Explainer & { source: "cache" | "ai" | "offline" };

/**
 * 3-level explainer. Cached per (item, level, language). Generated only from
 * the item's own chunks, with citation markers, and only for items cleared
 * for public release. Offline fallback is extractive and labelled as such.
 */
export async function explain(repo: Repo, item: Item, level: ExplainerLevel, lang: Lang): Promise<ExplainResult> {
  const cached = await repo.explainer(item.id, level, lang);
  if (cached) return { ...cached, source: "cache" };

  const chunks = (await repo.chunksFor([item.id])).slice(0, 8);
  const citations = toCitations(chunks, item);
  const llm = getLlm();

  if (llm && isAiAllowed(item) && chunks.length) {
    assertAiAllowed([item]);
    const prompt = `Explain the source passages below for ${LEVEL_BRIEF[level]}.
Write in ${lang === "hi" ? "Hindi (Devanagari script, natural modern Hindi)" : "English"}, 80–160 words.
RULES: Use ONLY facts in the passages. After every sentence add its citation marker like [c1]. Copy every number exactly as written in the source. If the passages say the content is a sample, say so.
Return JSON: {"text": string}

SOURCES:
${sourcesBlock(citations, chunks)}`;
    const out = await parseWithRetry(Out, (_n, fb) => llm.generate(prompt + (fb ? `\n\n${fb}` : ""), { json: true, temperature: 0.2 }));
    const explainer: Explainer = { item_id: item.id, level, language: lang, text: out.text, citations };
    await repo.saveExplainer(explainer);
    return { ...explainer, source: "ai" };
  }

  // Offline fallback: an honest extractive summary with citations.
  const sentences = chunks.flatMap((c, i) =>
    c.content
      .replace(/^SAMPLE[^.]*\.\s*/, "")
      .split(/(?<=[.!?।])\s+/)
      .filter((s) => s.length > 25)
      .slice(0, level === "school" ? 1 : 2)
      .map((s) => `${s} [c${i + 1}]`),
  );
  const take = level === "school" ? 3 : level === "college" ? 4 : 6;
  const text =
    sentences.slice(0, take).join(" ") ||
    (lang === "hi" ? "इस सामग्री के लिए अभी कोई पाठ उपलब्ध नहीं है।" : "No text is available for this item yet.");
  return { item_id: item.id, level, language: lang, text, citations, source: "offline" };
}
