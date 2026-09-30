"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Brain, Compass, FilterX, GraduationCap, History, ListFilter, Search, SearchX, Ship, SlidersHorizontal, Sparkles, Tags, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocalValue, writeLocal } from "@/components/a11y/local-store";
import { Frame, FrameBody, FrameHeader, Pane } from "@/components/frame";
import { SampleBadge } from "@/components/items/badges";
import { formatDate } from "@/components/items/item-card";
import { TYPE_ICON, TYPE_TONE } from "@/components/items/type-icon";
import { EmptyState } from "@/components/page-header";
import { ITEM_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Opt {
  id: string;
  label: string;
}
interface Result {
  id: string;
  title: string;
  type: string;
  snippet: string;
  score: number;
  date?: string | null;
  expedition?: string | null;
  language?: string;
  sample?: boolean;
}
type Sort = "relevance" | "newest" | "title";

const POPULAR = ["sea ice", "glacier", "weather station", "krill", "ice core", "हिमनद"];
const RECENT_KEY = "dg-recent-searches";
const NO_FILTERS = { expedition: "any", station: "any", year: "any", discipline: "any", language: "any" };

function highlight(text: string, q: string) {
  const terms = q
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!terms.length) return text;
  const parts = text.split(new RegExp(`(${terms.join("|")})`, "gi"));
  return parts.map((p, i) =>
    terms.some((t) => new RegExp(`^${t}$`, "i").test(p)) ? (
      <mark key={i} className="rounded bg-aurora/25 px-0.5 text-foreground">
        {p}
      </mark>
    ) : (
      p
    ),
  );
}

function parseRecent(raw: string | null): string[] {
  try {
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 6) : [];
  } catch {
    return [];
  }
}

export function Explorer({
  initialQuery,
  expeditions,
  stations,
  disciplines,
  years,
  topics,
  total,
}: {
  initialQuery: string;
  expeditions: Opt[];
  stations: Opt[];
  disciplines: string[];
  years: string[];
  topics: string[];
  total: number;
}) {
  const t = useTranslations("explore");
  const tt = useTranslations("types");
  const tu = useTranslations("ui");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState(initialQuery);
  const [debounced, setDebounced] = useState(initialQuery);
  const [types, setTypes] = useState<string[]>([]);
  const [f, setF] = useState(NO_FILTERS);
  const [results, setResults] = useState<Result[] | null>(null);
  const [mode, setMode] = useState<"hybrid" | "keyword">("keyword");
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState<Sort>("relevance");
  const recent = parseRecent(useLocalValue(RECENT_KEY));

  useEffect(() => {
    const id = setTimeout(() => setDebounced(q.trim()), 350);
    return () => clearTimeout(id);
  }, [q]);

  // "/" focuses the search box from anywhere on the page
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (e.key !== "/" || e.metaKey || e.ctrlKey || el?.closest("input, textarea, [contenteditable=true]")) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const params = useMemo(() => {
    const p = new URLSearchParams({ q: debounced });
    if (types.length) p.set("types", types.join(","));
    for (const [k, v] of Object.entries(f)) if (v !== "any") p.set(k, v);
    return p.toString();
  }, [debounced, types, f]);

  useEffect(() => {
    if (!debounced) return;
    const ctrl = new AbortController();
    const run = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?${params}`, { signal: ctrl.signal });
        const json = await res.json();
        setResults(json.results ?? []);
        setMode(json.mode ?? "keyword");
        router.replace(`/explore?q=${encodeURIComponent(debounced)}`, { scroll: false });
        if ((json.results ?? []).length) {
          const prev = parseRecent(localStorage.getItem(RECENT_KEY));
          writeLocal(RECENT_KEY, JSON.stringify([debounced, ...prev.filter((x) => x.toLowerCase() !== debounced.toLowerCase())].slice(0, 6)));
        }
      } catch {
        /* aborted */
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    };
    void run();
    return () => ctrl.abort();
  }, [params, debounced, router]);

  const activeFilters = types.length + Object.values(f).filter((v) => v !== "any").length;
  const shown = useMemo(() => {
    if (!debounced || !results) return null;
    if (sort === "relevance") return results;
    return [...results].sort((a, b) => (sort === "title" ? a.title.localeCompare(b.title) : (b.date ?? "").localeCompare(a.date ?? "")));
  }, [debounced, results, sort]);
  const facet = (type: string) => results?.filter((r) => r.type === type).length ?? 0;
  const codeOf = (id: string | null | undefined) => expeditions.find((e) => e.id === id)?.label ?? null;
  const clear = () => {
    setTypes([]);
    setF(NO_FILTERS);
  };

  const select = (key: keyof typeof f, label: string, opts: Opt[]) => (
    <Select value={f[key]} onValueChange={(v) => setF((s) => ({ ...s, [key]: v }))}>
      <SelectTrigger className="w-full" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="any">
          {label}: {t("any")}
        </SelectItem>
        {opts.map((o) => (
          <SelectItem key={o.id} value={o.id}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const chip = (label: string, icon?: React.ReactNode) => (
    <Button key={label} variant="secondary" size="sm" className="rounded-full" onClick={() => setQ(label)} lang={/[ऀ-ॿ]/.test(label) ? "hi" : undefined}>
      {icon} {label}
    </Button>
  );

  return (
    <Frame>
      <FrameHeader
        icon={Compass}
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Badge variant="outline" className="gap-1 max-sm:hidden">
            <Brain className="size-3" /> {mode === "hybrid" ? t("hybrid") : tu("keywordSearch")}
          </Badge>
        }
      />

      {/* search bar */}
      <div className="relative shrink-0">
        <Search className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          ref={inputRef}
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          className="h-12 w-full rounded-2xl border bg-card pr-40 pl-12 text-base shadow-sm transition-shadow outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
        />
        <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
          {q ? (
            <Button variant="ghost" size="icon-sm" aria-label={t("clearSearch")} onClick={() => setQ("")}>
              <X />
            </Button>
          ) : (
            <kbd className="hidden rounded-md border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground lg:inline">/</kbd>
          )}
          <Button variant={showFilters ? "secondary" : "ghost"} size="sm" className="lg:hidden" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
            <SlidersHorizontal /> {t("filters")}
            {activeFilters > 0 && <Badge className="ml-1 h-5 min-w-5 rounded-full px-1">{activeFilters}</Badge>}
          </Button>
        </div>
      </div>

      <FrameBody className="lg:grid-cols-[17rem_minmax(0,1fr)]">
        {/* filter rail: always open on desktop, toggled on phones */}
        <Pane
          icon={ListFilter}
          title={t("filters")}
          count={activeFilters || undefined}
          className={cn(!showFilters && "max-lg:hidden")}
          action={
            activeFilters > 0 && (
              <Button variant="ghost" size="xs" onClick={clear}>
                <FilterX /> {t("clear")}
              </Button>
            )
          }
        >
          <div className="space-y-4">
            <div role="group" aria-label={t("type")} className="grid gap-1">
              <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{t("type")}</p>
              {ITEM_TYPES.map((type) => {
                const Icon = TYPE_ICON[type];
                const on = types.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setTypes((s) => (on ? s.filter((x) => x !== type) : [...s, type]))}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg border border-transparent px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/60",
                      on && "border-primary/30 bg-primary/5 font-medium",
                    )}
                  >
                    <span className={cn("flex size-6 items-center justify-center rounded-md border", TYPE_TONE[type])}>
                      <Icon className="size-3" aria-hidden />
                    </span>
                    <span className="flex-1">{tt(type)}</span>
                    {results && debounced && <span className="text-xs text-muted-foreground tabular-nums">{facet(type)}</span>}
                  </button>
                );
              })}
            </div>
            <div className="grid gap-2">
              <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{t("refine")}</p>
              {select("expedition", t("expedition"), expeditions)}
              {select("station", t("station"), stations)}
              {select("year", t("year"), years.map((y) => ({ id: y, label: y })))}
              {select("discipline", t("discipline"), disciplines.map((d) => ({ id: d, label: d })))}
              {select("language", t("language"), [
                { id: "en", label: "English" },
                { id: "hi", label: "हिंदी" },
              ])}
            </div>
          </div>
        </Pane>

        <Pane
          icon={Search}
          title={shown ? (loading ? "…" : t("results", { count: shown.length })) : t("startTitle")}
          description={shown ? undefined : t("archiveSize", { count: total })}
          action={
            shown &&
            shown.length > 1 && (
              <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
                <SelectTrigger size="sm" className="w-36" aria-label={t("sortBy")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">{t("sortRelevance")}</SelectItem>
                  <SelectItem value="newest">{t("sortNewest")}</SelectItem>
                  <SelectItem value="title">{t("sortTitle")}</SelectItem>
                </SelectContent>
              </Select>
            )
          }
        >
          <div aria-live="polite" className="sr-only">
            {shown && !loading ? t("results", { count: shown.length }) : ""}
          </div>

          {!shown && !loading && (
            <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 py-6 text-center tall:py-12">
              <span className="flex size-14 items-center justify-center rounded-2xl border bg-gradient-to-br from-primary/15 to-aurora/15 text-primary shadow-sm">
                <Sparkles className="size-7" aria-hidden />
              </span>
              <div>
                <p className="text-lg font-semibold tracking-tight">{t("startTitle")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("startBody")}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">{POPULAR.map((p) => chip(p))}</div>
              {topics.length > 0 && (
                <div className="w-full">
                  <p className="mb-2 flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Tags className="size-3.5" /> {t("topics")}
                  </p>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {topics.map((tag) => (
                      <button key={tag} type="button" onClick={() => setQ(tag)} className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {recent.length > 0 && (
                <div className="w-full">
                  <p className="mb-2 flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <History className="size-3.5" /> {t("recent")}
                    <button type="button" className="ml-1 underline underline-offset-2 hover:text-foreground" onClick={() => writeLocal(RECENT_KEY, null)}>
                      {t("clearRecent")}
                    </button>
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">{recent.map((r) => chip(r, <History className="size-3.5 text-muted-foreground" />))}</div>
                </div>
              )}
            </div>
          )}

          {loading && !shown?.length && (
            <div className="grid gap-2 pt-1">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          )}

          {shown && !loading && shown.length === 0 && <EmptyState icon={<SearchX className="size-5" />} title={t("noResults", { q: debounced })} body={t("noResultsBody")} />}

          {shown && shown.length > 0 && (
            <ol className="grid gap-2 pt-1">
              <AnimatePresence mode="popLayout">
                {shown.map((r, i) => {
                  const Icon = TYPE_ICON[r.type];
                  const code = codeOf(r.expedition);
                  return (
                    <motion.li key={r.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.02 }}>
                      <article className="group relative flex gap-3 rounded-xl border bg-background p-3 transition-all hover:border-primary/40 hover:shadow-md">
                        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg border", TYPE_TONE[r.type])}>{Icon && <Icon className="size-4" aria-hidden />}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2">
                            <h2 className="min-w-0 flex-1 text-sm leading-snug font-semibold group-hover:text-primary" lang={r.language}>
                              <Link href={`/items/${r.id}`} className="after:absolute after:inset-0">
                                {r.title}
                              </Link>
                            </h2>
                            {r.sample && <SampleBadge className="shrink-0 max-sm:hidden" />}
                          </div>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                            <span>{tt(r.type as "report")}</span>
                            {code && (
                              <span className="inline-flex items-center gap-1">
                                <Ship className="size-3" /> {code}
                              </span>
                            )}
                            {r.date && <span>{formatDate(r.date)}</span>}
                          </p>
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground" lang={r.language}>
                            {highlight(r.snippet, debounced)}
                          </p>
                          <div className="relative z-10 mt-2 flex items-center gap-3">
                            <Button asChild size="xs" variant="secondary" className="rounded-full">
                              <Link href={`/items/${r.id}?explain=school`}>
                                <GraduationCap /> {t("explainSimply")}
                              </Link>
                            </Button>
                            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground tabular-nums" title={`${tu("relevance")} ${(r.score * 100).toFixed(1)}`}>
                              <span className="h-1 w-12 overflow-hidden rounded-full bg-muted">
                                <span className="block h-full rounded-full bg-gradient-to-r from-primary to-aurora" style={{ width: `${Math.min(100, Math.max(6, (r.score / (results?.[0]?.score || 1)) * 100))}%` }} />
                              </span>
                              {tu("relevance")}
                            </span>
                          </div>
                        </div>
                      </article>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ol>
          )}
        </Pane>
      </FrameBody>
    </Frame>
  );
}
