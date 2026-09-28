/**
 * Deterministic numbers-and-dates check (no LLM).
 *
 * Every number or date in a draft sentence must appear in the cited source
 * text. Normalisation handles Devanagari digits (०-९), thousands separators
 * (Western and Indian grouping), ordinals ("45th", "46वाँ"), percentages,
 * unicode minus signs, ISO dates, month names (English and Hindi) and small
 * number words ("six", "छह").
 */

const DEVANAGARI_DIGITS = "०१२३४५६७८९";

export function toAsciiDigits(s: string): string {
  return s.replace(/[०-९]/g, (d) => String(DEVANAGARI_DIGITS.indexOf(d)));
}

const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8,
  september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
  "जनवरी": 1, "फ़रवरी": 2, "फरवरी": 2, "मार्च": 3, "अप्रैल": 4, "मई": 5, "जून": 6, "जुलाई": 7,
  "अगस्त": 8, "सितंबर": 9, "सितम्बर": 9, "अक्टूबर": 10, "अक्तूबर": 10, "नवंबर": 11, "नवम्बर": 11, "दिसंबर": 12, "दिसम्बर": 12,
};

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, hundred: 100,
  "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पाँच": 5, "पांच": 5, "छह": 6, "छः": 6, "सात": 7, "आठ": 8,
  "नौ": 9, "दस": 10, "ग्यारह": 11, "बारह": 12, "बीस": 20, "तीस": 30, "चालीस": 40, "पचास": 50, "सौ": 100,
};

export interface ExtractedNumber {
  /** Canonical numeric string, e.g. "4850", "-12.4", "45" */
  value: string;
  /** The text as written in the draft */
  raw: string;
  signed: boolean;
}

function canonical(n: number): string {
  // Avoid "2.10" vs "2.1" and "-0" issues.
  const v = Math.round(n * 1e6) / 1e6;
  return Object.is(v, -0) ? "0" : String(v);
}

/** Remove citation markers like [c1] or [c1, c2] so they are not read as numbers. */
export function stripCitations(s: string): string {
  return s.replace(/\[\s*c\d+(\s*,\s*c\d+)*\s*\]/gi, " ");
}

/**
 * Extract numbers from text. `includeWords` also reads number words and
 * month names (used on the source side so "8 January" matches "2026-01-08").
 */
export function extractNumbers(text: string, opts: { includeWords?: boolean; includeMonths?: boolean } = {}): ExtractedNumber[] {
  const out: ExtractedNumber[] = [];
  let s = toAsciiDigits(stripCitations(text)).replace(/[−–—]/g, "-");

  // ISO dates: 2026-01-08 -> 2026, 1, 8
  s = s.replace(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g, (raw, y, m, d) => {
    out.push({ value: canonical(+y), raw, signed: false }, { value: canonical(+m), raw, signed: false }, { value: canonical(+d), raw, signed: false });
    return " ";
  });
  // Year-month: 2025-07 -> 2025, 7
  s = s.replace(/\b(\d{4})-(\d{1,2})\b/g, (raw, y, m) => {
    out.push({ value: canonical(+y), raw, signed: false }, { value: canonical(+m), raw, signed: false });
    return " ";
  });
  // Ranges like 12-15 (not a negative number): split into two numbers.
  s = s.replace(/(\d)\s*-\s*(?=\d)/g, "$1 to ");

  // Numbers with separators, decimals, signs, ordinals and percentages.
  const re = /(^|[^\w.])(-)?(\d{1,3}(?:,\d{2,3})+|\d+)(\.\d+)?(?:\s*%)?(?:st|nd|rd|th|वाँ|वां|वीं|वें|वी)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    const sign = m[2] ?? "";
    const intPart = m[3].replace(/,/g, "");
    const dec = m[4] ?? "";
    const n = Number(`${sign}${intPart}${dec}`);
    if (!Number.isNaN(n)) out.push({ value: canonical(n), raw: m[0].trim(), signed: Boolean(sign) });
  }

  if (opts.includeWords || opts.includeMonths) {
    const words = text.toLowerCase().split(/[^\p{L}\p{M}]+/u).filter(Boolean);
    for (const w of words) {
      if (opts.includeWords && w in NUMBER_WORDS) out.push({ value: canonical(NUMBER_WORDS[w]), raw: w, signed: false });
      if (opts.includeMonths && w in MONTHS) out.push({ value: canonical(MONTHS[w]), raw: w, signed: false });
    }
  }
  return out;
}

/** Numbers stated in a draft sentence (digits plus number words, not month names). */
export function draftNumbers(sentence: string): ExtractedNumber[] {
  return extractNumbers(sentence, { includeWords: true });
}

/** Everything a source passage can vouch for (digits, number words, months). */
export function sourceNumberSet(source: string): Set<string> {
  return new Set(extractNumbers(source, { includeWords: true, includeMonths: true }).map((n) => n.value));
}

/**
 * Return the numbers in `sentence` that do NOT appear in `sources`.
 * An unsigned draft number may match a signed source number ("12.4" vs
 * "-12.4"), but a signed draft number must match exactly.
 */
export function unmatchedNumbers(sentence: string, sources: string | string[]): string[] {
  const pool = new Set<string>();
  for (const src of Array.isArray(sources) ? sources : [sources]) {
    for (const v of sourceNumberSet(src)) pool.add(v);
  }
  const misses: string[] = [];
  for (const n of draftNumbers(sentence)) {
    const abs = n.value.replace(/^-/, "");
    const ok = pool.has(n.value) || (!n.signed && (pool.has(abs) || pool.has(`-${abs}`)));
    if (!ok && !misses.includes(n.raw)) misses.push(n.raw);
  }
  return misses;
}
