"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ArrowUpRight, CalendarDays, ChevronRight, GraduationCap, Languages, LayoutGrid, Library, Rows3, Search, Ship, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Frame, FrameBody, FrameHeader, MetaChip, Pane } from "@/components/frame";
import { ItemFlags, TypeBadge } from "@/components/items/badges";
import { formatDate } from "@/components/items/item-card";
import { coverFacts } from "@/components/items/doc-cover";
import { MediaThumb, usesCover } from "@/components/items/media-thumb";
import { OrgMark, orgMark } from "@/components/items/org-mark";
import { TYPE_ICON } from "@/components/items/type-icon";
import { EmptyState } from "@/components/page-header";
import { LIBRARY_SEGMENTS } from "@/lib/constants";
import type { Item } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Slideshow } from "./slideshow";

type Sort = "newest" | "oldest" | "title";

const ROW_TYPES = ["report", "dataset", "publication"];
/** "NCPOR Arctic programme — external link" -> "NCPOR Arctic programme": the card already shows where the link goes. */
const plainTitle = (title: string) => title.replace(/\s*[—-]\s*external link$/i, "");
// the source column only appears when the pane is wide enough; below that the source sits under the title
const ROW_COLS = "md:grid-cols-[minmax(0,1fr)_6.5rem_6.5rem_1rem] 2xl:grid-cols-[minmax(0,1fr)_11rem_6.5rem_6.5rem_1rem]";

export function LibraryBrowser({
  segment,
  type,
  items,
  expeditions,
  counts,
}: {
  segment: string;
  type: string;
  items: Item[];
  expeditions: { id: string; code: string }[];
  counts: Record<string, number>;
}) {
  const t = useTranslations("library");
  const tc = useTranslations("common");
  const te = useTranslations("explore");
  const tn = useTranslations("nav");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [exp, setExp] = useState("all");
  const [year, setYear] = useState("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const rowsOnly = ROW_TYPES.includes(type);
  const code = (id: string | null) => expeditions.find((e) => e.id === id)?.code ?? null;
  const years = useMemo(() => [...new Set(items.map((i) => i.event_date?.slice(0, 4)).filter(Boolean) as string[])].sort().reverse(), [items]);
  const label = tn(segment as "reports");

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = items.filter(
      (i) =>
        (exp === "all" || i.expedition_id === exp) &&
        (year === "all" || i.event_date?.startsWith(year)) &&
        (!needle || [i.title, i.description, ...i.tags, ...i.authors].join(" ").toLowerCase().includes(needle)),
    );
    const key = (i: Item) => i.event_date ?? i.created_at;
    return [...filtered].sort((a, b) =>
      sort === "title" ? a.title.localeCompare(b.title) : sort === "oldest" ? key(a).localeCompare(key(b)) : key(b).localeCompare(key(a)),
    );
  }, [items, q, sort, exp, year]);

  const active = list.find((i) => i.id === activeId) ?? list[0] ?? null;
  // rows only show flags that apply (sample, draft, internal, embargoed)
  const hasFlags = (i: Item) => Boolean(i.is_sample || i.status !== "published" || i.visibility === "internal" || i.embargo_until);
  const hover = (id: string) => ({ onMouseEnter: () => setActiveId(id), onFocus: () => setActiveId(id) });

  return (
    <Frame>
      <FrameHeader
        icon={TYPE_ICON[type]}
        title={t("title", { type: label })}
        description={t("subtitle", { type: label.toLowerCase() })}
        actions={
          <nav aria-label={tn("library")} className="flex flex-wrap gap-1 rounded-xl border bg-card/70 p-1 shadow-xs">
            {Object.entries(LIBRARY_SEGMENTS).map(([seg, ty]) => {
              const Icon = TYPE_ICON[ty];
              const on = seg === segment;
              return (
                <Link
                  key={seg}
                  href={`/library/${seg}`}
                  aria-current={on ? "page" : undefined}
                  title={tn(seg as "reports")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    on && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  )}
                >
                  <Icon className="size-3.5" aria-hidden />
                  <span className={cn(!on && "sr-only 2xl:not-sr-only")}>{tn(seg as "reports")}</span>
                  <span className="tabular-nums opacity-80">{counts[ty] ?? 0}</span>
                </Link>
              );
            })}
          </nav>
        }
      />

      {/* toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-2xl border bg-card/70 p-2 shadow-xs backdrop-blur">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("filterPlaceholder")} className="border-transparent bg-transparent pl-9 shadow-none" aria-label={t("filterPlaceholder")} />
        </div>
        <Select value={exp} onValueChange={setExp}>
          <SelectTrigger size="sm" className="w-40" aria-label={te("expedition")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {te("expedition")}: {te("any")}
            </SelectItem>
            {expeditions.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {years.length > 1 && (
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger size="sm" className="w-32" aria-label={te("year")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {te("year")}: {te("any")}
              </SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
          <SelectTrigger size="sm" className="w-32" aria-label={t("sort")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t("newest")}</SelectItem>
            <SelectItem value="oldest">{t("oldest")}</SelectItem>
            <SelectItem value="title">{t("az")}</SelectItem>
          </SelectContent>
        </Select>
        {!rowsOnly && (
          <ToggleGroup type="single" variant="outline" size="sm" value={view} onValueChange={(v) => v && setView(v as "grid" | "table")}>
            <ToggleGroupItem value="grid" aria-label={t("gridView")}>
              <LayoutGrid className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label={t("tableView")}>
              <Rows3 className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        )}
        {type === "photo" && <Slideshow items={list} />}
        <p className="px-1 text-xs text-muted-foreground tabular-nums" aria-live="polite">
          {te("results", { count: list.length })}
        </p>
      </div>

      <FrameBody className="lg:grid-cols-12">
        <Pane label={label} className="lg:col-span-7 xl:col-span-8" bodyClassName={rowsOnly ? "px-2 pt-2" : view === "grid" ? "pt-4" : "px-2 pt-2"}>
          {list.length === 0 ? (
            <EmptyState icon={<Library className="size-5" />} title={tc("none")} />
          ) : rowsOnly ? (
            // reports, datasets and publications have no picture: one structured row each, with aligned columns
            <div role="table" aria-label={label}>
              <div role="rowgroup" className="hidden border-b md:block">
                <div role="row" className={cn("grid items-center gap-4 px-3 pb-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase", ROW_COLS)}>
                  <span role="columnheader">{t("colTitle")}</span>
                  <span role="columnheader" className="max-2xl:hidden">
                    {type === "publication" ? t("colAuthors") : t("colSource")}
                  </span>
                  <span role="columnheader">{t("colExpedition")}</span>
                  <span role="columnheader">{t("colDate")}</span>
                  <span role="columnheader" className="sr-only">
                    {t("openItem")}
                  </span>
                </div>
              </div>
              <div role="rowgroup" className="divide-y">
                {list.map((i) => {
                  const f = coverFacts(i);
                  const tile = { color: f.accent, backgroundColor: `color-mix(in oklch, ${f.accent} 12%, transparent)`, borderColor: `color-mix(in oklch, ${f.accent} 30%, transparent)` };
                  return (
                    <Link
                      key={i.id}
                      role="row"
                      href={`/items/${i.id}`}
                      {...hover(i.id)}
                      className={cn("group grid items-center gap-x-4 gap-y-1 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/60", ROW_COLS, active?.id === i.id && "lg:bg-primary/5")}
                    >
                      <span role="cell" className="flex min-w-0 items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border" style={tile}>
                          <f.Icon className="size-4" aria-hidden />
                        </span>
                        <span className="grid min-w-0">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="truncate text-sm font-medium group-hover:text-primary" lang={i.language}>
                              {i.title}
                            </span>
                            {hasFlags(i) && (
                              <span className="flex shrink-0 gap-1">
                                <ItemFlags item={i} hideExternal />
                              </span>
                            )}
                          </span>
                          <span className="truncate text-xs text-muted-foreground tabular-nums">
                            {f.source && (
                              <span className="2xl:hidden">
                                {f.source}
                                {(f.first || f.doi) && " · "}
                              </span>
                            )}
                            {f.first && f.last ? (
                              <>
                                {f.first.y}: <span className="font-medium text-foreground">{f.first.v.toFixed(2)}</span> → {f.last.y}: <span className="font-medium text-foreground">{f.last.v.toFixed(2)}</span> million km²
                              </>
                            ) : f.doi ? (
                              <span className="font-mono text-[11px]">doi:{f.doi}</span>
                            ) : null}
                          </span>
                          {/* phones have no columns, so expedition and date sit under the title too */}
                          <span className="truncate text-xs text-muted-foreground md:hidden">{[code(i.expedition_id), formatDate(i.event_date)].filter(Boolean).join(" · ")}</span>
                        </span>
                      </span>
                      <span role="cell" className="truncate text-sm text-muted-foreground max-2xl:hidden">
                        {f.source ?? "—"}
                      </span>
                      <span role="cell" className="truncate font-mono text-xs text-muted-foreground max-md:hidden">
                        {code(i.expedition_id) ?? "—"}
                      </span>
                      <span role="cell" className="truncate text-xs text-muted-foreground tabular-nums max-md:hidden">
                        {formatDate(i.event_date) ?? "—"}
                      </span>
                      <span role="cell" className="text-muted-foreground max-md:hidden">
                        {i.external_url ? <ArrowUpRight className="size-4" aria-hidden /> : <ChevronRight className="size-4" aria-hidden />}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : type === "activity" && view === "grid" ? (
            <motion.div layout className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {list.map((i) => {
                  const mark = orgMark(i);
                  return (
                    <motion.div key={i.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      <Link
                        href={`/items/${i.id}`}
                        {...hover(i.id)}
                        className={cn(
                          "group flex h-full flex-col gap-3 rounded-xl border bg-background p-4 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
                          active?.id === i.id && "lg:border-primary/50 lg:ring-2 lg:ring-primary/15",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <OrgMark item={i} />
                          {mark.host && (
                            <span className="inline-flex min-w-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
                              <span className="truncate">{mark.host}</span> <ArrowUpRight className="size-3 shrink-0" aria-hidden />
                            </span>
                          )}
                        </div>
                        <h2 className="line-clamp-2 text-sm leading-snug font-semibold tracking-tight group-hover:text-primary" lang={i.language}>
                          {plainTitle(i.title)}
                        </h2>
                        <p className="mt-auto truncate text-xs text-muted-foreground">{[mark.org, i.discipline[0]].filter(Boolean).join(" · ")}</p>
                      </Link>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          ) : view === "table" ? (
            <ul>
              {list.map((i) => (
                <li key={i.id}>
                  <Link
                    href={`/items/${i.id}`}
                    {...hover(i.id)}
                    className={cn("group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/60", active?.id === i.id && "lg:bg-primary/5")}
                  >
                    <MediaThumb item={i} className="h-9 w-14 shrink-0 rounded-lg border [&_.absolute]:hidden" />
                    <span className="grid min-w-0 flex-1">
                      <span className="truncate text-sm font-medium group-hover:text-primary" lang={i.language}>
                        {i.title}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">{[code(i.expedition_id), formatDate(i.event_date), i.language.toUpperCase()].filter(Boolean).join(" · ")}</span>
                    </span>
                    <span className="hidden shrink-0 flex-wrap justify-end gap-1 sm:flex">
                      <ItemFlags item={i} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <motion.div layout className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {list.map((i) => (
                  <motion.div key={i.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Link
                      href={`/items/${i.id}`}
                      {...hover(i.id)}
                      className={cn(
                        "group flex h-full flex-col overflow-hidden rounded-xl border bg-background transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
                        active?.id === i.id && "lg:border-primary/50 lg:ring-2 lg:ring-primary/15",
                      )}
                    >
                      <MediaThumb item={i} className="aspect-[16/7] w-full transition-transform duration-500 group-hover:scale-[1.02]" />
                      <div className="flex flex-1 flex-col gap-1 p-3">
                        <h2 className="line-clamp-2 text-sm leading-snug font-semibold tracking-tight group-hover:text-primary" lang={i.language}>
                          {i.title}
                        </h2>
                        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1.5 text-[11px] text-muted-foreground">
                          {code(i.expedition_id) && (
                            <span className="inline-flex items-center gap-1">
                              <Ship className="size-3" /> {code(i.expedition_id)}
                            </span>
                          )}
                          {i.event_date && (
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="size-3" /> {formatDate(i.event_date)}
                            </span>
                          )}
                          <span className="ml-auto flex flex-wrap gap-1">
                            <ItemFlags item={i} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </Pane>

        {/* preview of the hovered / focused item (desktop) */}
        <aside aria-label={t("preview")} className="hidden min-h-0 lg:col-span-5 lg:flex xl:col-span-4">
          {active ? (
            <motion.div key={active.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="flex min-h-0 w-full flex-col overflow-hidden rounded-2xl border bg-card shadow-xs">
              {active.type === "activity" ? (
                <div className="bg-grid flex h-24 w-full shrink-0 items-center justify-center border-b bg-muted/40 tall:h-32">
                  <OrgMark item={active} className="h-14 min-w-14 px-4 text-lg" />
                </div>
              ) : (
                <MediaThumb item={active} className="h-32 w-full shrink-0 tall:h-44" />
              )}
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  <TypeBadge type={active.type} />
                  <ItemFlags item={active} />
                </div>
                <h2 className={cn("text-base leading-snug font-semibold tracking-tight text-balance", usesCover(active) && "sr-only")} lang={active.language}>
                  {active.title}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground" lang={active.language}>
                  {active.description}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {code(active.expedition_id) && <MetaChip icon={Ship}>{code(active.expedition_id)}</MetaChip>}
                  {active.event_date && <MetaChip icon={CalendarDays}>{formatDate(active.event_date)}</MetaChip>}
                  <MetaChip icon={Languages}>{active.language === "hi" ? "हिंदी" : "English"}</MetaChip>
                  {active.authors.length > 0 && <MetaChip icon={UserRound}>{active.authors.slice(0, 2).join(", ")}</MetaChip>}
                </div>
                {active.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {active.tags.slice(0, 8).map((tag) => (
                      <Badge key={tag} variant="secondary" asChild>
                        <Link href={`/explore?q=${encodeURIComponent(tag)}`}>#{tag}</Link>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 gap-2 border-t p-3">
                <Button asChild className="flex-1">
                  <Link href={`/items/${active.id}`}>
                    {t("openItem")} <ArrowRight />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/items/${active.id}?explain=school`}>
                    <GraduationCap /> {te("explainSimply")}
                  </Link>
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="flex w-full items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground">{tc("none")}</div>
          )}
        </aside>
      </FrameBody>
    </Frame>
  );
}
