import type { Chunk, Citation, GenerationClaim, GenerationOutput, Verdict } from "@/lib/types";
import { unmatchedNumbers } from "./numbers";

export interface DraftClaim {
  /** Stable key: "body.0.1" = body paragraph 0, sentence 1 */
  key: string;
  text: string;
  cites: string[]; // citation markers, e.g. ["c1"]
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?।])\s+(?=[^\s])/u)
    .map((s) => s.trim())
    .filter((s) => s.replace(/\[[^\]]*\]/g, "").trim().length > 0);
}

/** Pull markers written inline, e.g. "... six stations [c2]." */
export function inlineCites(s: string): string[] {
  return [...s.matchAll(/\[([^\]]+)\]/g)].flatMap((m) => [...m[1].matchAll(/\bc(\d+)\b/gi)].map((x) => `c${x[1]}`));
}

/** Split any generation output into checkable claims (sentence level). */
export function splitClaims(output: GenerationOutput): DraftClaim[] {
  const claims: DraftClaim[] = [];
  const add = (prefix: string, text: string, cites: string[]) => {
    splitSentences(text).forEach((s, i) => {
      const own = inlineCites(s);
      claims.push({ key: `${prefix}.${i}`, text: s, cites: own.length ? own : cites });
    });
  };
  if (output.channel === "website_article") {
    output.body.forEach((p, i) => add(`body.${i}`, p.text, p.cites));
    output.key_facts.forEach((f, i) => add(`fact.${i}`, f.text, f.cites));
  } else {
    add("text", output.text, output.cites);
  }
  return claims;
}

const STOP = new Set(
  "the a an and or of to in on at for with by from is are was were be been this that these those it its as into during between which who has have had not can will may their there than then also over under per each every all any our we they them".split(
    " ",
  ),
);

function contentTokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/\[[^\]]*\]/g, " ")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length > 2 && !STOP.has(t) && !/^\d+$/.test(t));
}

const isDevanagari = (s: string) => /[ऀ-ॿ]/.test(s);

/**
 * Offline heuristic verifier (used when no LLM key is configured, and as a
 * sanity floor): lexical support of the claim by its cited passages.
 */
export function heuristicVerdict(claim: string, sources: string[]): { verdict: Verdict; note: string } {
  if (!sources.length) return { verdict: "unsupported", note: "No source passage is cited for this sentence." };
  const joined = sources.join(" ");
  if (isDevanagari(claim) !== isDevanagari(joined)) {
    return { verdict: "weak", note: "Cross-language claim: numbers were checked automatically; wording needs a human check." };
  }
  const toks = contentTokens(claim);
  if (!toks.length) return { verdict: "supported", note: "No factual content words to check." };
  const src = new Set(contentTokens(joined));
  const stem = (t: string) => t.replace(/(ing|ed|es|s)$/, "");
  const srcStems = new Set([...src].map(stem));
  const hit = toks.filter((t) => src.has(t) || srcStems.has(stem(t))).length / toks.length;
  if (hit >= 0.5) return { verdict: "supported", note: `Wording matches the cited passage (${Math.round(hit * 100)}% overlap).` };
  if (hit >= 0.25) return { verdict: "weak", note: `Only partly matches the cited passage (${Math.round(hit * 100)}% overlap).` };
  return { verdict: "unsupported", note: `The cited passage does not support this sentence (${Math.round(hit * 100)}% overlap).` };
}

export function resolveSources(cites: string[], citations: Citation[], chunks: Chunk[]): { chunkIds: string[]; texts: string[] } {
  const byId = new Map(chunks.map((c) => [c.id, c]));
  const chunkIds: string[] = [];
  const texts: string[] = [];
  for (const m of cites) {
    const cit = citations.find((c) => c.marker === m);
    const ch = cit ? byId.get(cit.chunk_id) : undefined;
    if (cit && ch) {
      chunkIds.push(ch.id);
      texts.push(ch.content);
    }
  }
  return { chunkIds, texts };
}

/** Deterministic part of verification: numbers check + heuristic verdict. */
export function verifyClaimsOffline(
  generationId: string,
  output: GenerationOutput,
  citations: Citation[],
  chunks: Chunk[],
): GenerationClaim[] {
  return splitClaims(output).map((c, i) => {
    const { chunkIds, texts } = resolveSources(c.cites, citations, chunks);
    const misses = unmatchedNumbers(c.text, texts);
    const h = heuristicVerdict(c.text, texts);
    return {
      id: `${generationId}:${i}`,
      generation_id: generationId,
      claim_text: c.text,
      chunk_id: chunkIds[0] ?? null,
      verdict: h.verdict,
      note: misses.length ? `${h.note} Numbers not found in the source: ${misses.join(", ")}.` : h.note,
      number_misses: misses,
    };
  });
}

/** Approval gate, mirrored by the guard_generation_approval() trigger in SQL. */
export function approvalBlockers(claims: Pick<GenerationClaim, "verdict" | "number_misses">[]) {
  const unsupported = claims.filter((c) => c.verdict === "unsupported").length;
  const numbers = claims.filter((c) => c.number_misses.length > 0).length;
  return { unsupported, numbers, blocked: unsupported + numbers > 0 };
}
