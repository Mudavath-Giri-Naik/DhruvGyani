"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarRange, LayoutGrid, ListTree, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PolarArt, artVariant } from "@/components/polar-art";
import { REGIONS } from "@/lib/constants";
import type { Expedition } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<string, string> = {
  planned: "bg-warning/15 text-warning border-warning/30",
  ongoing: "bg-aurora/15 text-aurora border-aurora/30",
  completed: "bg-primary/10 text-primary border-primary/25",
};

function dateRange(e: Expedition, tbd: string) {
  const f = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : null);
  const a = f(e.start_date);
  const b = f(e.end_date);
  if (!a) return tbd;
  return b ? `${a} – ${b}` : `${a} –`;
}

export function ExpeditionBrowser({ expeditions, counts }: { expeditions: Expedition[]; counts: Record<string, number> }) {
  const t = useTranslations("expeditions");
  const tr = useTranslations("regions");
  const ts = useTranslations("expStatus");
  const [region, setRegion] = useState("all");
  const [view, setView] = useState<"grid" | "timeline">("grid");
  const regions = REGIONS.filter((r) => expeditions.some((e) => e.region === r));
  const list = expeditions
    .filter((e) => region === "all" || e.region === region)
    .sort((a, b) => (b.start_date ?? "").localeCompare(a.start_date ?? ""));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup type="single" variant="outline" size="sm" value={region} onValueChange={(v) => v && setRegion(v)} aria-label="Filter by region" className="flex-wrap justify-start">
          <ToggleGroupItem value="all" className="px-3">
            {t("all")}
          </ToggleGroupItem>
          {regions.map((r) => (
            <ToggleGroupItem key={r} value={r} className="px-3">
              {tr(r)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <ToggleGroup type="single" variant="outline" size="sm" value={view} onValueChange={(v) => v && setView(v as "grid" | "timeline")}>
          <ToggleGroupItem value="grid" aria-label={t("grid")}>
            <LayoutGrid className="size-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="timeline" aria-label={t("timeline")}>
            <ListTree className="size-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {view === "grid" ? (
        <motion.div layout className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {list.map((e) => (
              <motion.div
                key={e.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25 }}
              >
                <Link
                  href={`/expeditions/${e.code}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <PolarArt variant={artVariant(e.cover_url) ?? "aurora"} className="transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <div className="absolute inset-x-3 bottom-3 flex items-end justify-between">
                      <span className="rounded-md bg-black/50 px-2 py-0.5 font-mono text-sm font-semibold text-white backdrop-blur">{e.code}</span>
                      <Badge variant="outline" className={cn("border backdrop-blur", STATUS_TONE[e.status])}>
                        {ts(e.status)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{tr(e.region)}</span>
                      {e.is_sample && (
                        <Badge variant="outline" className="border-dashed border-warning/60 text-warning">
                          Sample
                        </Badge>
                      )}
                    </div>
                    <h2 className="font-semibold leading-snug tracking-tight">{e.title}</h2>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{e.summary}</p>
                    <div className="mt-auto flex items-center justify-between pt-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CalendarRange className="size-3.5" /> {dateRange(e, t("tbd"))}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Layers className="size-3.5" /> {t("linkedItems", { count: counts[e.id] ?? 0 })}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <ol className="relative ml-3 space-y-6 border-l-2 border-dashed border-primary/30 pl-8">
          {list.map((e, i) => (
            <motion.li
              key={e.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="relative"
            >
              <span className="absolute top-5 -left-[41px] flex size-5 items-center justify-center rounded-full border-2 border-primary bg-background">
                <span className={cn("size-2 rounded-full", e.status === "planned" ? "bg-warning" : "bg-primary")} />
              </span>
              <Link href={`/expeditions/${e.code}`} className="group flex gap-4 rounded-xl border bg-card p-3 transition-all hover:border-primary/40 hover:shadow-md">
                <div className="relative hidden aspect-[4/3] w-36 shrink-0 overflow-hidden rounded-lg sm:block">
                  <PolarArt variant={artVariant(e.cover_url) ?? "aurora"} />
                </div>
                <div className="min-w-0 space-y-1 py-1">
                  <p className="text-xs font-medium text-primary">{dateRange(e, t("tbd"))}</p>
                  <p className="font-semibold group-hover:text-primary">
                    <span className="font-mono">{e.code}</span> · {e.title}
                  </p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{e.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    {tr(e.region)} · {ts(e.status)} · {t("linkedItems", { count: counts[e.id] ?? 0 })}
                  </p>
                </div>
              </Link>
            </motion.li>
          ))}
        </ol>
      )}
    </div>
  );
}
