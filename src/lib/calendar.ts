import type { CalendarEntry, Item } from "@/lib/types";
import { occasions, sid } from "@/lib/seed/data";

/** Next occurrence (today or later) of a month/day, as YYYY-MM-DD. */
export function nextOccurrence(month: number, day: number, from = new Date()): string {
  const y = from.getUTCFullYear();
  const today = Date.UTC(y, from.getUTCMonth(), from.getUTCDate());
  let d = Date.UTC(y, month - 1, day);
  if (d < today) d = Date.UTC(y + 1, month - 1, day);
  return new Date(d).toISOString().slice(0, 10);
}

/** Rank published items for an occasion by tag/discipline overlap. */
export function suggestItems(tags: string[], items: Item[], limit = 4): string[] {
  const want = tags.map((t) => t.toLowerCase());
  return items
    .map((i) => {
      const hay = [...i.tags, ...i.discipline, i.title].join(" ").toLowerCase();
      const score = want.reduce((s, t) => s + (hay.includes(t) ? 1 : 0), 0) + (i.is_sample ? 0 : 0.1);
      return { id: i.id, score };
    })
    .filter((x) => x.score >= 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.id);
}

export function buildCalendar(publicItems: Item[], from = new Date()): CalendarEntry[] {
  return occasions
    .map((o, i) => ({
      id: sid(300 + i),
      date: o.kind === "milestone" ? "2026-11-01" : nextOccurrence(o.month, o.day, from),
      occasion: o.occasion,
      occasion_hi: o.occasion_hi,
      kind: o.kind,
      suggested_item_ids: suggestItems(o.tags, publicItems),
      status: "idea" as const,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function occasionTags(occasion: string): string[] {
  return occasions.find((o) => o.occasion === occasion)?.tags ?? [];
}
