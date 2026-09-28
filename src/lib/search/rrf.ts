/**
 * Reciprocal rank fusion: merge several ranked id lists into one.
 * score(id) = Σ 1 / (k + rank), rank starting at 1. Mirrors search_items() in SQL.
 */
export function rrfMerge(lists: string[][], k = 50): { id: string; score: number }[] {
  const scores = new Map<string, number>();
  for (const list of lists) {
    const seen = new Set<string>();
    list.forEach((id, i) => {
      if (seen.has(id)) return; // count each id once per list, at its best rank
      seen.add(id);
      scores.set(id, (scores.get(id) ?? 0) + 1 / (k + i + 1));
    });
  }
  return [...scores.entries()].map(([id, score]) => ({ id, score })).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}
