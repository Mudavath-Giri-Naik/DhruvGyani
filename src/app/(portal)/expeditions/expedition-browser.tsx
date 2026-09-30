"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, CalendarRange, Clock, Compass, Layers, LayoutGrid, ListTree, MapPin, Search, SearchX, Ship } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Frame, FrameBody, FrameHeader, MetaChip, Pane } from "@/components/frame";
import { SampleBadge } from "@/components/items/badges";
import { TYPE_ICON, TYPE_TONE } from "@/components/items/type-icon";
import { EmptyState } from "@/components/page-header";
import { PolarArt, artVariant } from "@/components/polar-art";
import { EXPEDITION_STATUSES, ITEM_TYPES, REGIONS } from "@/lib/constants";
import type { Expedition } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<string, string> = {
  planned: "text-warning border-warning/40",
  ongoing: "text-aurora border-aurora/40",
  completed: "text-primary border-primary/30",
};

function dateRange(e: Expedition, tbd: string) {
  const f = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-IN", { month: "short", year: "numeric", timeZone: "UTC" }) : null);
  const a = f(e.start_date);
  const b = f(e.end_date);
  if (!a) return tbd;
  return b ? `${a} – ${b}` : `${a} –`;
}

function durationDays(e: Expedition) {
  if (!e.start_date || !e.end_date) return null;
  return Math.max(1, Math.round((new Date(e.end_date).getTime() - new Date(e.start_date).getTime()) / 86400000) + 1);
}

const total = (c: Record<string, number> | undefined) => Object.values(c ?? {}).reduce((a, n) => a + n, 0);

export function ExpeditionBrowser({
  expeditions,
  counts,
  stations,
}: {
  expeditions: Expedition[];
  counts: Record<string, Record<string, number>>;
  stations: Record<string, string>;
}) {
  const t = useTranslations("expeditions");
  const tr = useTranslations("regions");
  const ts = useTranslations("expStatus");
  const tt = useTranslations("types");
  const [region, setRegion] = useState("all");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [view, setView] = useState<"grid" | "timeline">("grid");
  const [activeId, setActiveId] = useState<string | null>(null);
  const regions = REGIONS.filter((r) => expeditions.some((e) => e.region === r));

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return expeditions
      .filter(
        (e) =>
          (region === "all" || e.region === region) &&
          (status === "all" || e.status === status) &&
          (!needle || `${e.code} ${e.title} ${e.summary}`.toLowerCase().includes(needle)),
      )
      .sort((a, b) => (b.start_date ?? "").localeCompare(a.start_date ?? ""));
  }, [expeditions, region, status, q]);

  const active = list.find((e) => e.id === activeId) ?? list[0] ?? null;
  const allItems = expeditions.reduce((a, e) => a + total(counts[e.id]), 0);

  return (
    <Frame>
      <FrameHeader
        icon={Ship}
        title={t("title")}
        description={t("subtitle")}
        actions={
          <>
            <MetaChip icon={Ship} className="max-sm:hidden">
              {t("countExpeditions", { count: expeditions.length })}
            </MetaChip>
            <MetaChip icon={Compass} className="max-sm:hidden">
              {t("countRegions", { count: regions.length })}
            </MetaChip>
            <MetaChip icon={Layers} className="max-md:hidden">
              {t("linkedItems", { count: allItems })}
            </MetaChip>
          </>
        }
      />

      {/* toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-2xl border bg-card/70 p-2 shadow-xs backdrop-blur">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPlaceholder")} aria-label={t("searchPlaceholder")} className="border-transparent bg-transparent pl-9 shadow-none" />
        </div>
        <ToggleGroup type="single" variant="outline" size="sm" value={region} onValueChange={(v) => v && setRegion(v)} aria-label={t("filterRegion")} className="flex-wrap justify-start">
          <ToggleGroupItem value="all" className="px-3">
            {t("all")}
          </ToggleGroupItem>
          {regions.map((r) => (
            <ToggleGroupItem key={r} value={r} className="px-3">
              {tr(r)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger size="sm" className="w-36" aria-label={t("status")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("anyStatus")}</SelectItem>
            {EXPEDITION_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {ts(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ToggleGroup type="single" variant="outline" size="sm" value={view} onValueChange={(v) => v && setView(v as "grid" | "timeline")}>
          <ToggleGroupItem value="grid" aria-label={t("grid")}>
            <LayoutGrid className="size-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="timeline" aria-label={t("timeline")}>
            <ListTree className="size-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <FrameBody className="lg:grid-cols-12">
        <Pane label={t("title")} className="lg:col-span-7 xl:col-span-8" bodyClassName="pt-4">
          {list.length === 0 ? (
            <EmptyState icon={<SearchX className="size-5" />} title={t("noMatch")} />
          ) : view === "grid" ? (
            <motion.div layout className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {list.map((e) => (
                  <motion.div key={e.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.22 }}>
                    <Link
                      href={`/expeditions/${e.code}`}
                      onMouseEnter={() => setActiveId(e.id)}
                      onFocus={() => setActiveId(e.id)}
                      className={cn(
                        "group flex h-full flex-col overflow-hidden rounded-xl border bg-background transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
                        active?.id === e.id && "lg:border-primary/50 lg:ring-2 lg:ring-primary/15",
                      )}
                    >
                      <div className="relative aspect-[16/7] overflow-hidden">
                        <PolarArt variant={artVariant(e.cover_url) ?? "aurora"} className="transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                        <div className="absolute inset-x-2.5 bottom-2.5 flex items-end justify-between">
                          <span className="rounded-md bg-black/50 px-2 py-0.5 font-mono text-xs font-semibold text-white backdrop-blur">{e.code}</span>
                          <Badge variant="outline" className={cn("border bg-background", STATUS_TONE[e.status])}>
                            {ts(e.status)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col gap-1 p-3">
                        <h2 className="line-clamp-1 text-sm leading-snug font-semibold tracking-tight group-hover:text-primary">{e.title}</h2>
                        <p className="line-clamp-2 text-xs text-muted-foreground">{e.summary}</p>
                        <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-[11px] text-muted-foreground">
                          <span className="inline-flex min-w-0 items-center gap-1">
                            <CalendarRange className="size-3 shrink-0" /> <span className="truncate">{dateRange(e, t("tbd"))}</span>
                          </span>
                          <span className="inline-flex shrink-0 items-center gap-1">
                            <Layers className="size-3" /> {total(counts[e.id])}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <ol className="relative ml-2 space-y-3 border-l-2 border-dashed border-primary/30 pl-6">
              {list.map((e, i) => (
                <motion.li key={e.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="relative">
                  <span className="absolute top-4 -left-[33px] flex size-4 items-center justify-center rounded-full border-2 border-primary bg-background">
                    <span className={cn("size-1.5 rounded-full", e.status === "planned" ? "bg-warning" : e.status === "ongoing" ? "bg-aurora" : "bg-primary")} />
                  </span>
                  <Link
                    href={`/expeditions/${e.code}`}
                    onMouseEnter={() => setActiveId(e.id)}
                    onFocus={() => setActiveId(e.id)}
                    className={cn(
                      "group flex gap-3 rounded-xl border bg-background p-2.5 transition-all hover:border-primary/40 hover:shadow-md",
                      active?.id === e.id && "lg:border-primary/50 lg:ring-2 lg:ring-primary/15",
                    )}
                  >
                    <div className="relative hidden aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-lg sm:block">
                      <PolarArt variant={artVariant(e.cover_url) ?? "aurora"} />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-xs font-medium text-primary">{dateRange(e, t("tbd"))}</p>
                      <p className="truncate text-sm font-semibold group-hover:text-primary">
                        <span className="font-mono">{e.code}</span> · {e.title}
                      </p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{e.summary}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {tr(e.region)} · {ts(e.status)} · {t("linkedItems", { count: total(counts[e.id]) })}
                      </p>
                    </div>
                  </Link>
                </motion.li>
              ))}
            </ol>
          )}
        </Pane>

        {/* preview of the hovered / focused expedition (desktop) */}
        <aside aria-label={t("preview")} className="hidden min-h-0 lg:col-span-5 lg:flex xl:col-span-4">
          {active ? (
            <motion.div key={active.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="flex min-h-0 w-full flex-col overflow-hidden rounded-2xl border bg-card shadow-xs">
              <div className="relative h-32 shrink-0 overflow-hidden tall:h-44">
                <PolarArt variant={artVariant(active.cover_url) ?? "aurora"} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-x-3 top-3 flex flex-wrap items-center gap-1.5">
                  <Badge className="bg-black/55 font-mono text-white backdrop-blur">{active.code}</Badge>
                  <Badge variant="outline" className={cn("border bg-background", STATUS_TONE[active.status])}>
                    {ts(active.status)}
                  </Badge>
                  {active.is_sample && <SampleBadge className="ml-auto bg-background" />}
                </div>
                <p className="absolute inset-x-3 bottom-2.5 line-clamp-2 text-base leading-snug font-semibold text-white">{active.title}</p>
              </div>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                <div className="flex flex-wrap gap-1.5">
                  <MetaChip icon={Compass}>{tr(active.region)}</MetaChip>
                  <MetaChip icon={CalendarRange}>{dateRange(active, t("tbd"))}</MetaChip>
                  {durationDays(active) && <MetaChip icon={Clock}>{t("days", { count: durationDays(active)! })}</MetaChip>}
                  {active.station_id && stations[active.station_id] && <MetaChip icon={MapPin}>{stations[active.station_id]}</MetaChip>}
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{active.summary}</p>
                <ul aria-label={t("archive")} className="grid grid-cols-3 gap-2">
                  {ITEM_TYPES.map((type) => {
                    const Icon = TYPE_ICON[type];
                    return (
                      <li key={type} className="rounded-xl border bg-background p-2">
                        <span className="flex items-center justify-between">
                          <span className="text-base leading-none font-semibold tabular-nums">{counts[active.id]?.[type] ?? 0}</span>
                          <span className={cn("flex size-6 items-center justify-center rounded-md border", TYPE_TONE[type])}>
                            <Icon className="size-3" aria-hidden />
                          </span>
                        </span>
                        <span className="mt-1 block truncate text-[11px] text-muted-foreground">{tt(type)}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="flex shrink-0 gap-2 border-t p-3">
                <Button asChild className="flex-1">
                  <Link href={`/expeditions/${active.code}`}>
                    {t("storyMode")} <ArrowRight />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/explore?q=${encodeURIComponent(active.code)}`}>
                    <Search /> {t("findInArchive")}
                  </Link>
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="flex w-full items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground">{t("noMatch")}</div>
          )}
        </aside>
      </FrameBody>
    </Frame>
  );
}
