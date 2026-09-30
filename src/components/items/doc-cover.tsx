import { useTranslations } from "next-intl";
import { ArrowUpRight, BookOpen, Database, FileText } from "lucide-react";
import { SEA_ICE } from "@/lib/seed/seaice";
import type { Item } from "@/lib/types";
import { cn } from "@/lib/utils";

export type CoverItem = Pick<Item, "type" | "media_url"> & Partial<Pick<Item, "title" | "authors" | "event_date" | "tags" | "source_url" | "external_url" | "language" | "discipline">>;

/** Bundled NSIDC series, keyed by the CSV file an item points at, so dataset covers can quote the first and last values. */
const SERIES: Record<string, keyof typeof SEA_ICE> = {
  "arctic-sea-ice-extent-september.csv": "arcticSep",
  "arctic-sea-ice-extent-march.csv": "arcticMar",
  "antarctic-sea-ice-extent-february.csv": "antarcticFeb",
  "antarctic-sea-ice-extent-september.csv": "antarcticSep",
};

const ACCENT: Record<string, string> = { report: "var(--chart-1)", dataset: "var(--chart-2)", publication: "var(--chart-4)" };
const ICON = { report: FileText, dataset: Database, publication: BookOpen } as const;

const host = (url: string | null | undefined) => {
  try {
    return url ? new URL(url).hostname.replace(/^www\./, "") : null;
  } catch {
    return null;
  }
};
const doi = (url: string | null | undefined) => url?.match(/doi\.org\/(.+)$/)?.[1] ?? null;
/** "Alfred Wegener Institute (source)" -> "Alfred Wegener Institute"; archive-desk bylines are skipped. */
const sourceName = (authors: string[] | undefined) => {
  // a long author list (a dataset's citation) reads better as "First Author et al."
  if (authors && authors.length > 2 && !authors.some((a) => /\((source|स्रोत)\)/.test(a))) return `${authors[0]} et al.`;
  const named = authors?.find((a) => /\((source|स्रोत)\)/.test(a)) ?? authors?.find((a) => !/archive desk|अभिलेख डेस्क/i.test(a));
  return named?.replace(/\s*\((source|स्रोत)\)/, "") ?? null;
};

/** The details a cover or a list row shows for a document-type item, all derived from the item itself. */
export function coverFacts(item: CoverItem) {
  const seriesKey = SERIES[item.media_url?.split("/").pop() ?? ""];
  const series = seriesKey ? SEA_ICE[seriesKey].flatMap(([y, extent]) => (extent == null ? [] : [{ y, v: extent }])) : null;
  return {
    Icon: ICON[item.type as keyof typeof ICON] ?? FileText,
    accent: ACCENT[item.type] ?? "var(--chart-1)",
    source: item.type === "publication" ? (item.authors?.join(", ") ?? null) : (sourceName(item.authors) ?? host(item.source_url)),
    first: series?.[0] ?? null,
    last: series?.[series.length - 1] ?? null,
    doi: doi(item.source_url),
  };
}

/**
 * Cover for an item that has no picture of its own (reports, datasets,
 * publications): a compact, typographic card — an icon tile, the type and
 * year, the title, and one line for the source. No artwork, no chart, nothing
 * behind the text. Purely presentational: callers keep an accessible title
 * beside it.
 */
export function DocCover({ item, meta, className }: { item: CoverItem; /** Extra facts for the source line, e.g. expedition code and date. */ meta?: string | null; className?: string }) {
  const t = useTranslations("types");
  const type = item.type as keyof typeof ICON;
  const Icon = ICON[type] ?? FileText;
  const accent = ACCENT[type] ?? "var(--chart-1)";
  const year = item.event_date?.slice(0, 4) ?? null;
  const source = type === "publication" ? item.authors?.join(", ") : (sourceName(item.authors) ?? host(item.source_url));
  const seriesKey = SERIES[item.media_url?.split("/").pop() ?? ""];
  const series = seriesKey ? SEA_ICE[seriesKey].flatMap(([y, extent]) => (extent == null ? [] : [{ y, v: extent }])) : null;
  const first = series?.[0];
  const last = series?.[series.length - 1];
  const paperDoi = doi(item.source_url);
  const tile = { color: accent, backgroundColor: `color-mix(in oklch, ${accent} 12%, transparent)`, borderColor: `color-mix(in oklch, ${accent} 30%, transparent)` };

  return (
    <div aria-hidden className={cn("@container flex h-full w-full items-center overflow-hidden bg-card text-foreground", className)}>
      {/* tiny thumbnails (list rows) only have room for the type mark */}
      <div className="flex h-full w-full items-center justify-center @[9rem]:hidden" style={{ backgroundColor: tile.backgroundColor }}>
        <Icon className="size-4" style={{ color: accent }} />
      </div>

      <div className="hidden min-w-0 flex-1 items-start gap-3 p-4 @[9rem]:flex">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border" style={tile}>
          <Icon className="size-5" />
        </span>
        <div className="grid min-w-0 flex-1 gap-1">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            <span style={{ color: accent }}>{t(type as "report")}</span>
            {year && <span className="tabular-nums">· {year}</span>}
            {item.external_url && <ArrowUpRight className="ml-auto size-3.5" />}
          </p>
          <p className={cn("line-clamp-2 text-[15px] leading-snug font-semibold tracking-tight", type === "publication" && "font-serif text-base")} lang={item.language}>
            {item.title}
          </p>
          <p className="truncate text-xs text-muted-foreground">{[source, meta].filter(Boolean).join(" · ")}</p>
          {first && last && (
            <p className="truncate text-xs text-muted-foreground tabular-nums">
              {first.y}: <span className="font-medium text-foreground">{first.v.toFixed(2)}</span> → {last.y}: <span className="font-medium text-foreground">{last.v.toFixed(2)}</span> million km²
            </p>
          )}
          {paperDoi && <p className="truncate font-mono text-[11px] text-muted-foreground">doi:{paperDoi}</p>}
        </div>
      </div>
    </div>
  );
}
