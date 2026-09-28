"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Brain, FilterX, GraduationCap, Search, SearchX, SlidersHorizontal, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Toggle } from "@/components/ui/toggle";
import { TypeBadge } from "@/components/items/badges";
import { TYPE_ICON } from "@/components/items/type-icon";
import { EmptyState } from "@/components/page-header";
import { ITEM_TYPES } from "@/lib/constants";

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
}

const POPULAR = ["sea ice", "glacier", "weather station", "krill", "ice core", "हिमनद"];

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

export function Explorer({
  initialQuery,
  expeditions,
  stations,
  disciplines,
  years,
}: {
  initialQuery: string;
  expeditions: Opt[];
  stations: Opt[];
  disciplines: string[];
  years: string[];
}) {
  const t = useTranslations("explore");
  const tt = useTranslations("types");
  const tu = useTranslations("ui");
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [debounced, setDebounced] = useState(initialQuery);
  const [types, setTypes] = useState<string[]>([]);
  const [f, setF] = useState({ expedition: "any", station: "any", year: "any", discipline: "any", language: "any" });
  const [results, setResults] = useState<Result[] | null>(null);
  const [mode, setMode] = useState<"hybrid" | "keyword">("keyword");
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(q.trim()), 350);
    return () => clearTimeout(id);
  }, [q]);

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
  const shown = debounced ? results : null;

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

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          className="h-14 rounded-2xl pr-32 pl-12 text-base shadow-sm"
        />
        <Button variant={showFilters ? "secondary" : "ghost"} size="sm" className="absolute top-1/2 right-2 -translate-y-1/2" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
          <SlidersHorizontal /> {t("filters")}
          {activeFilters > 0 && <Badge className="ml-1 h-5 min-w-5 rounded-full px-1">{activeFilters}</Badge>}
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="space-y-3 rounded-2xl border bg-card p-4">
              <div className="flex flex-wrap gap-2" role="group" aria-label={t("type")}>
                {ITEM_TYPES.map((type) => {
                  const Icon = TYPE_ICON[type];
                  return (
                    <Toggle
                      key={type}
                      variant="outline"
                      size="sm"
                      pressed={types.includes(type)}
                      onPressedChange={(on) => setTypes((s) => (on ? [...s, type] : s.filter((x) => x !== type)))}
                    >
                      <Icon className="size-3.5" /> {tt(type)}
                    </Toggle>
                  );
                })}
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {select("expedition", t("expedition"), expeditions)}
                {select("station", t("station"), stations)}
                {select("year", t("year"), years.map((y) => ({ id: y, label: y })))}
                {select("discipline", t("discipline"), disciplines.map((d) => ({ id: d, label: d })))}
                {select("language", t("language"), [
                  { id: "en", label: "English" },
                  { id: "hi", label: "हिंदी" },
                ])}
              </div>
              {activeFilters > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTypes([]);
                    setF({ expedition: "any", station: "any", year: "any", discipline: "any", language: "any" });
                  }}
                >
                  <FilterX /> {t("clear")}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!shown && (
        <div className="rounded-2xl border border-dashed p-8 text-center">
          <Sparkles className="mx-auto size-8 text-aurora" />
          <p className="mt-3 font-medium">{t("startTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("startBody")}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {POPULAR.map((p) => (
              <Button key={p} variant="secondary" size="sm" className="rounded-full" onClick={() => setQ(p)} lang={/[ऀ-ॿ]/.test(p) ? "hi" : undefined}>
                {p}
              </Button>
            ))}
          </div>
        </div>
      )}

      {shown && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p aria-live="polite">{loading ? "…" : t("results", { count: shown.length })}</p>
          <Badge variant="outline" className="gap-1">
            <Brain className="size-3" /> {mode === "hybrid" ? t("hybrid") : tu("keywordSearch")}
          </Badge>
        </div>
      )}

      {loading && !shown?.length && (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      )}

      {shown && !loading && shown.length === 0 && (
        <EmptyState icon={<SearchX className="size-5" />} title={t("noResults", { q: debounced })} body={t("noResultsBody")} />
      )}

      {shown && shown.length > 0 && (
        <ol className="grid gap-3">
          <AnimatePresence mode="popLayout">
            {shown.map((r, i) => (
              <motion.li key={r.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.025 }}>
                <article className="group relative rounded-xl border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md">
                  <div className="flex flex-wrap items-center gap-2">
                    <TypeBadge type={r.type} />
                    <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">{tu("relevance")} {(r.score * 100).toFixed(1)}</span>
                  </div>
                  <h2 className="mt-2 font-semibold group-hover:text-primary">
                    <Link href={`/items/${r.id}`} className="after:absolute after:inset-0">
                      {r.title}
                    </Link>
                  </h2>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{highlight(r.snippet, debounced)}</p>
                  <div className="relative z-10 mt-3">
                    <Button asChild size="sm" variant="secondary" className="h-7 rounded-full">
                      <Link href={`/items/${r.id}?explain=school#explain`}>
                        <GraduationCap className="size-3.5" /> {t("explainSimply")}
                      </Link>
                    </Button>
                  </div>
                </article>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      )}
    </div>
  );
}
