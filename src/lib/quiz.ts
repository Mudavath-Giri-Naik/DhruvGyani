import type { QuizQuestion } from "@/lib/types";

/**
 * Build fill-in-the-blank quiz questions from cited text. The correct answer
 * is always a number that appears in the source sentence; distractors are
 * nearby values. Deterministic (no AI), so every answer is checkable.
 */
export function buildQuiz(passages: { text: string; cite: string }[], max = 5): QuizQuestion[] {
  const out: QuizQuestion[] = [];
  const seen = new Set<string>();
  for (const p of passages) {
    const sentences = p.text
      .replace(/^SAMPLE[^.]*\.\s*/, "")
      .replace(/\s*\[\s*c\d+(?:\s*,\s*c\d+)*\s*\]/g, "")
      .split(/(?<=[.!?।])\s+/);
    for (const s of sentences) {
      // whole numbers that aren't years, e.g. "12 snow pits", "6 automatic weather stations"
      const m = s.match(/(^|\s)(\d{1,3})(?=\s+[\p{L}])/u);
      if (!m) continue;
      const n = Number(m[2]);
      if (n < 2 || seen.has(s)) continue;
      seen.add(s);
      const q = s.replace(new RegExp(`(^|\\s)${m[2]}(?=\\s)`), "$1____").trim();
      const pool = [n, n + 1, n - 1, n + 2, n * 2, Math.max(1, Math.round(n / 2)), n + 5].filter((v, i, a) => v > 0 && a.indexOf(v) === i);
      const options = [n, ...pool.filter((v) => v !== n).slice(0, 3)];
      // stable shuffle based on the sentence
      const seed = [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
      const order = options.map((v, i) => ({ v, k: (seed >>> (i * 3)) % 97 })).sort((a, b) => a.k - b.k).map((x) => x.v);
      out.push({ q, options: order.map(String), answer: order.indexOf(n), cite: p.cite });
      if (out.length >= max) return out;
    }
  }
  return out;
}
