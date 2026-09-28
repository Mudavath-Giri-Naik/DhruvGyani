import "server-only";

import { z } from "zod";
import type { Repo } from "@/lib/data/repo";
import { isPubliclyVisible } from "@/lib/policy";
import type { Chunk, Citation } from "@/lib/types";
import { parseWithRetry } from "./json";
import { embedQuery, getLlm } from "./llm";

export interface AskResult {
  found: boolean;
  answer: string;
  citations: (Citation & { href: string })[];
  mode: "ai" | "offline";
}

const STOP = new Set("what which who whom whose when where why how is are was were the a an of to in on for and or do does did can could about tell me please any this that there".split(" "));
const tokens = (s: string) =>
  s
    .toLowerCase()
    .split(/[^\p{L}\p{M}\p{N}]+/u)
    .filter((t) => t.length > 2 && !STOP.has(t));

const Out = z.object({ found: z.boolean(), answer: z.string().max(2000) });

/**
 * Answer from PUBLISHED, PUBLIC, non-embargoed content only (filtered here
 * even for staff, whose RLS would otherwise allow internal chunks).
 * Low retrieval confidence → "not in the archive" instead of guessing.
 */
export async function ask(repo: Repo, question: string, lang: "en" | "hi"): Promise<AskResult> {
  const q = question.trim();
  const qt = tokens(q);
  const embedding = await embedQuery(q);
  const raw = await repo.retrieve(q, null, embedding, 12);
  const items = await repo.getItems([...new Set(raw.map((c) => c.item_id))]);
  const allowed = new Set(items.filter((i) => isPubliclyVisible(i)).map((i) => i.id));
  const withScore = raw
    .filter((c) => allowed.has(c.item_id))
    .map((c) => ({ c, s: qt.filter((t) => c.content.toLowerCase().includes(t)).length / Math.max(1, qt.length), sim: (c as Chunk & { similarity?: number }).similarity }));

  // Glossary entries are published portal content too.
  // Prefer whole-term matches ("sea ice"); otherwise require every word of the term.
  const allTerms = await repo.glossary();
  const ql = q.toLowerCase();
  const phrase = allTerms.filter((g) => ql.includes(g.term.toLowerCase()) || (g.term_hi && q.includes(g.term_hi)));
  const glossary = phrase.length ? phrase.sort((a, b) => b.term.length - a.term.length) : allTerms.filter((g) => g.term.toLowerCase().split(/\s+/).every((w) => qt.includes(w)));
  const glossChunks = glossary.slice(0, 2).map((g) => ({
    c: { id: `glossary:${g.id}`, item_id: "", page_no: null, chunk_index: 0, content: `${g.term}: ${g.meaning_en} (${g.term_hi}: ${g.meaning_hi})` } as Chunk,
    s: 1,
    sim: undefined as number | undefined,
    gloss: g.term,
  }));

  const ranked = [...glossChunks, ...withScore.map((x) => ({ ...x, gloss: undefined as string | undefined }))]
    .filter((x) => (x.sim !== undefined ? x.sim >= 0.55 : x.s >= 0.34))
    .sort((a, b) => (b.sim ?? b.s) - (a.sim ?? a.s))
    .slice(0, 6);

  const notFound: AskResult = {
    found: false,
    answer: lang === "hi" ? "मुझे यह संग्रह में नहीं मिला।" : "I could not find this in the archive.",
    citations: [],
    mode: "offline",
  };
  if (!ranked.length) return notFound;

  const titleOf = (x: (typeof ranked)[number]) => (x.gloss ? `DhruvGyani glossary: ${x.gloss}` : (items.find((i) => i.id === x.c.item_id)?.title ?? "Archive item"));
  const citations = ranked.map((x, i) => ({
    marker: `c${i + 1}`,
    chunk_id: x.c.id,
    item_id: x.c.item_id,
    item_title: titleOf(x),
    page_no: x.c.page_no,
    quote: x.c.content.replace(/^SAMPLE[^.]*\.\s*/, "").slice(0, 200),
    href: x.gloss ? `/learn/glossary#${encodeURIComponent(x.gloss)}` : `/items/${x.c.item_id}`,
  }));

  const llm = getLlm();
  if (llm) {
    const prompt = `Answer the QUESTION using ONLY the SOURCES. Answer in ${lang === "hi" ? "Hindi (Devanagari)" : "English"}, 2–5 sentences, for a general audience.
Put citation markers like [c1] after every sentence. Copy numbers exactly. If a source is a SAMPLE, say so.
If the sources do not answer the question, return {"found": false, "answer": ""}.
Return JSON: {"found": boolean, "answer": string}

QUESTION: ${q}

SOURCES:
${ranked.map((x, i) => `[c${i + 1}] (${titleOf(x)})\n${x.c.content}`).join("\n\n")}`;
    try {
      const out = await parseWithRetry(Out, (_n, fb) => llm.generate(prompt + (fb ? `\n\n${fb}` : ""), { json: true, temperature: 0.1 }));
      if (!out.found || !out.answer.trim()) return { ...notFound, mode: "ai" };
      return { found: true, answer: out.answer, citations, mode: "ai" };
    } catch {
      // fall through to the offline extract
    }
  }

  // Offline: the most relevant source sentences, verbatim and cited.
  const sentences = ranked.flatMap((x, i) =>
    x.c.content
      .replace(/^SAMPLE[^.]*\.\s*/, "")
      .split(/(?<=[.!?।])\s+/)
      .map((s) => ({ s, cite: `c${i + 1}`, score: qt.filter((t) => s.toLowerCase().includes(t)).length + (x.gloss ? 1 : 0) })),
  );
  const best = sentences
    .filter((x) => x.score > 0 && x.s.length > 20 && x.s.split(/\s+/).length >= 6)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  if (!best.length) return notFound;
  const used = [...new Set(best.map((b) => b.cite))];
  return {
    found: true,
    answer: best.map((b) => `${b.s} [${b.cite}]`).join(" "),
    citations: citations.filter((c) => used.includes(c.marker)),
    mode: "offline",
  };
}
