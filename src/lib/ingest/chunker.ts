export interface PageText {
  page_no: number | null;
  text: string;
}

export interface TextChunk {
  page_no: number | null;
  chunk_index: number;
  content: string;
}

/** Normalise whitespace and strip control characters left by PDF extraction. */
export function cleanText(s: string): string {
  return s
    .replace(/\u0000/g, "")
    .replace(/-\n(?=\p{Ll})/gu, "") // re-join hyphenated line breaks
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{2,}/g, "\n\n")
    .trim();
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?।])\s+/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

const wc = (s: string) => s.split(/\s+/).filter(Boolean).length;

/**
 * Split pages into chunks of about `maxWords` words with ~`overlapWords` of
 * overlap, never crossing a page boundary (so citations keep page numbers)
 * and never cutting a sentence unless that sentence alone is too long.
 */
export function chunkPages(pages: PageText[], maxWords = 220, overlapWords = 40): TextChunk[] {
  const chunks: TextChunk[] = [];
  let index = 0;
  const push = (page_no: number | null, content: string) => chunks.push({ page_no, chunk_index: index++, content });

  for (const page of pages) {
    let current: string[] = [];
    let fresh = 0; // sentences added since the last emitted chunk
    const words = () => current.reduce((a, s) => a + wc(s), 0);

    const flush = () => {
      if (!fresh) return;
      push(page.page_no, current.join(" "));
      const carry: string[] = [];
      let c = 0;
      for (let i = current.length - 1; i > 0 && c + wc(current[i]) <= overlapWords; i--) {
        carry.unshift(current[i]);
        c += wc(current[i]);
      }
      current = carry;
      fresh = 0;
    };

    for (const s of sentences(cleanText(page.text))) {
      const n = wc(s);
      if (n > maxWords) {
        flush();
        current = [];
        const w = s.split(/\s+/);
        for (let i = 0; i < w.length; i += maxWords - overlapWords) {
          push(page.page_no, w.slice(i, i + maxWords).join(" "));
          if (i + maxWords >= w.length) break;
        }
        continue;
      }
      if (fresh && words() + n > maxWords) flush();
      current.push(s);
      fresh++;
    }
    flush();
  }
  return chunks;
}
