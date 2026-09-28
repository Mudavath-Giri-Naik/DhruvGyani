import "server-only";

import { assertAiAllowed } from "@/lib/policy";
import type { Item } from "@/lib/types";
import { getLlm } from "./llm";

/**
 * Embed document chunks for an item — ONLY if the item is cleared for public
 * release and past its embargo (server-enforced here). Returns null when the
 * item is not allowed or no LLM is configured (keyword search only).
 */
export async function embedItemChunks(item: Pick<Item, "id" | "title" | "visibility" | "embargo_until">, texts: string[]): Promise<number[][] | null> {
  try {
    assertAiAllowed([item]);
  } catch {
    return null;
  }
  const llm = getLlm();
  if (!llm || !texts.length) return null;
  // gemini-embedding-2 takes task hints in the text rather than a taskType.
  return llm.embed(texts.map((t) => `title: ${item.title} | text: ${t}`));
}
