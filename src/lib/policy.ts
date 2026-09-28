import type { Item } from "@/lib/types";

/**
 * AI-processing rule (server-enforced, BUILD_PROMPT §9):
 * content may be sent to an external AI or embedding API ONLY when the item
 * is cleared for public release (visibility = public) and any embargo has
 * passed. Internal or embargoed items get keyword search only.
 */
export function isAiAllowed(item: Pick<Item, "visibility" | "embargo_until">, now: Date = new Date()): boolean {
  if (item.visibility !== "public") return false;
  if (item.embargo_until && new Date(item.embargo_until).getTime() > now.getTime()) return false;
  return true;
}

/** Mirrors the RLS public-read rule in 0002_rls.sql. */
export function isPubliclyVisible(item: Pick<Item, "status" | "visibility" | "embargo_until">, now: Date = new Date()): boolean {
  return item.status === "published" && isAiAllowed(item, now);
}

export function isEmbargoed(item: Pick<Item, "embargo_until">, now: Date = new Date()): boolean {
  return Boolean(item.embargo_until && new Date(item.embargo_until).getTime() > now.getTime());
}

/** Throws unless every item may be sent to an AI service. Use before any LLM/embedding call. */
export function assertAiAllowed(items: Pick<Item, "id" | "visibility" | "embargo_until">[]): void {
  const blocked = items.filter((i) => !isAiAllowed(i));
  if (blocked.length) {
    throw new AiBlockedError(`AI disabled: ${blocked.length} item(s) not cleared for public release`);
  }
}

export class AiBlockedError extends Error {
  status = 403;
}
