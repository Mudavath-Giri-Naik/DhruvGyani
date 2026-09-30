import type { Item } from "@/lib/types";
import { cn } from "@/lib/utils";

const ACCENTS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const SKIP = new Set(["of", "the", "and", "for", "de", "u.s."]);

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * Who runs an activity, as a short mark: "NCPOR" stays "NCPOR", "British
 * Antarctic Survey" becomes "BAS". Each organisation keeps one accent colour,
 * so its activities are recognisable at a glance.
 */
export function orgMark(item: Pick<Item, "authors" | "source_url" | "external_url">) {
  const org = item.authors[0] ?? "";
  const lead = org.split(",")[0].trim();
  const words = lead.split(/\s+/).filter((w) => w && !SKIP.has(w.toLowerCase()));
  const abbr = words.length === 1 && lead.length <= 7 ? lead : words.map((w) => w[0].toUpperCase()).join("").slice(0, 5);
  let host: string | null = null;
  try {
    const url = item.external_url ?? item.source_url;
    host = url ? new URL(url).hostname.replace(/^www\./, "") : null;
  } catch {
    host = null;
  }
  return { org, abbr: abbr || "•", host, accent: ACCENTS[hash(lead) % ACCENTS.length] };
}

/** The organisation mark as a tinted tile. */
export function OrgMark({ item, className }: { item: Pick<Item, "authors" | "source_url" | "external_url">; className?: string }) {
  const { abbr, accent } = orgMark(item);
  return (
    <span
      aria-hidden
      className={cn("flex h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border px-2.5 text-sm font-bold tracking-tight", className)}
      style={{ color: accent, backgroundColor: `color-mix(in oklch, ${accent} 12%, transparent)`, borderColor: `color-mix(in oklch, ${accent} 30%, transparent)` }}
    >
      {abbr}
    </span>
  );
}
