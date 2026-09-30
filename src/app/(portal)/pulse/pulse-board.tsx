"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceDot, ReferenceLine, XAxis, YAxis } from "recharts";
import { Activity, ArrowRight, ChartArea, Moon, Pause, Play, Snowflake, Sun, Sunrise, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Frame, FrameBody, FrameHeader, Pane } from "@/components/frame";
import { BASELINE, rankLowest, summarise } from "@/lib/datasets/trend";
import { sunInfo, type SunState } from "@/lib/sun";
import { cn } from "@/lib/utils";

export interface PulseSeries {
  key: string;
  itemId: string;
  points: { year: number; value: number }[];
}
export interface PulseStation {
  id: string;
  name: string;
  regionLabel: string;
  lat: number;
  lng: number;
}

// one shared clock: every subscriber re-renders on the minute
let now = 0;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, 30000);
  }
  return () => {
    listeners.delete(cb);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
};
const useNow = () =>
  useSyncExternalStore(
    subscribe,
    () => now || (now = Date.now()),
    () => 0,
  );

const SUN_ICON: Record<SunState, typeof Sun> = { polar_day: Sun, day: Sun, twilight: Sunrise, night: Moon, polar_night: Moon };
const SUN_TONE: Record<SunState, string> = {
  polar_day: "border-warning/40 bg-warning/10 text-warning",
  day: "border-warning/40 bg-warning/10 text-warning",
  twilight: "border-primary/40 bg-primary/10 text-primary",
  night: "border-border bg-muted text-muted-foreground",
  polar_night: "border-border bg-muted text-muted-foreground",
};
const clock = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(Math.floor(minutes % 60)).padStart(2, "0")}`;
const chartConfig: ChartConfig = { value: { label: "Extent", color: "var(--chart-1)" } };

export function PulseBoard({ series, stations }: { series: PulseSeries[]; stations: PulseStation[] }) {
  const t = useTranslations("pulse");
  const [key, setKey] = useState(series[0].key);
  const active = series.find((s) => s.key === key) ?? series[0];
  const years = useMemo(() => active.points.map((p) => p.year), [active]);
  const last = years[years.length - 1];
  const [picked, setPicked] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const year = picked != null && years.includes(picked) ? picked : last;
  const running = playing && year !== last;
  const summary = useMemo(() => summarise(active.points), [active]);
  const value = active.points.find((p) => p.year === year)!.value;
  const vsBaseline = ((value - summary.baseline) / summary.baseline) * 100;
  const rank = rankLowest(active.points, year);
  const time = useNow();

  // "play" walks the year marker through the record and stops at the latest year
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setPicked((cur) => years[Math.min(years.length - 1, years.indexOf(cur ?? last) + 1)]), 350);
    return () => clearInterval(id);
  }, [playing, years, last]);
  const choose = (k: string) => {
    setKey(k);
    setPicked(null);
    setPlaying(false);
  };

  const fmt = (n: number) => n.toFixed(2);
  const stats = [
    { icon: Snowflake, label: t("extentIn", { year }), value: `${fmt(value)}`, unit: t("unit") },
    { icon: vsBaseline < 0 ? TrendingDown : TrendingUp, label: t("vsBaseline", { from: BASELINE[0], to: BASELINE[1] }), value: `${vsBaseline > 0 ? "+" : ""}${vsBaseline.toFixed(1)}%`, unit: "" },
    { icon: Trophy, label: t("rank", { count: active.points.length }), value: `#${rank}`, unit: t("lowest") },
    { icon: summary.trendPerDecade < 0 ? TrendingDown : TrendingUp, label: t("trend"), value: `${summary.trendPctPerDecade > 0 ? "+" : ""}${summary.trendPctPerDecade.toFixed(1)}%`, unit: t("perDecade") },
  ];

  return (
    <Frame>
      <FrameHeader
        icon={Activity}
        title={t("title")}
        description={t("subtitle")}
        actions={
          <ToggleGroup type="single" variant="outline" size="sm" value={key} onValueChange={(v) => v && choose(v)} aria-label={t("series")} className="flex-wrap justify-start">
            {series.map((s) => (
              <ToggleGroupItem key={s.key} value={s.key} className="px-3">
                {t(`series_${s.key}` as "series_arcticSep")}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        }
      />

      <FrameBody className="lg:grid-cols-12">
        <Pane
          icon={ChartArea}
          title={t(`series_${active.key}` as "series_arcticSep")}
          description={t("source")}
          scroll={false}
          className="lg:col-span-8"
          bodyClassName="gap-3 px-4 pb-4"
          action={
            <Link href={`/items/${active.itemId}`} className="inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground">
              {t("openDataset")} <ArrowRight className="size-3" aria-hidden />
            </Link>
          }
        >
          <dl className="grid shrink-0 grid-cols-2 gap-2 xl:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-2.5 rounded-xl border bg-background px-3 py-2">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-aurora/15 text-primary">
                  <s.icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <dd className="text-lg leading-tight font-semibold tracking-tight tabular-nums">
                    {s.value} <span className="text-xs font-normal text-muted-foreground">{s.unit}</span>
                  </dd>
                  <dt className="truncate text-[11px] text-muted-foreground">{s.label}</dt>
                </div>
              </div>
            ))}
          </dl>

          <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full fit:h-auto fit:min-h-0 fit:flex-1">
            <AreaChart data={active.points} margin={{ left: 0, right: 16, top: 12 }} onClick={(e) => e?.activeLabel != null && setPicked(Number(e.activeLabel))}>
              <defs>
                <linearGradient id="pulse-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="year" tickLine={false} axisLine={false} minTickGap={28} />
              <YAxis tickLine={false} axisLine={false} width={40} domain={["auto", "auto"]} />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <ReferenceLine y={summary.baseline} stroke="var(--muted-foreground)" strokeDasharray="4 4" label={{ value: t("baseline", { from: BASELINE[0], to: BASELINE[1] }), position: "insideTopRight", fontSize: 10, fill: "var(--muted-foreground)" }} />
              <Area dataKey="value" type="monotone" stroke="var(--color-value)" strokeWidth={2} fill="url(#pulse-fill)" isAnimationActive={false} />
              <ReferenceLine x={year} stroke="var(--aurora)" strokeWidth={1.5} />
              <ReferenceDot x={year} y={value} r={5} fill="var(--aurora)" stroke="var(--card)" strokeWidth={2} />
            </AreaChart>
          </ChartContainer>

          <div className="flex shrink-0 items-center gap-3">
            <Button
              size="icon-sm"
              variant="outline"
              aria-label={running ? t("pause") : t("play")}
              onClick={() => {
                if (running) return setPlaying(false);
                if (year === last) setPicked(years[0]);
                setPlaying(true);
              }}
            >
              {running ? <Pause /> : <Play />}
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">{years[0]}</span>
            <Slider min={years[0]} max={last} step={1} value={[year]} onValueChange={([v]) => {
                setPlaying(false);
                setPicked(v);
              }} aria-label={t("year")} className="flex-1" />
            <span className="text-xs text-muted-foreground tabular-nums">{last}</span>
            <Badge variant="secondary" className="tabular-nums">
              {year}
            </Badge>
          </div>
          <p className="shrink-0 text-[11px] text-muted-foreground">{t("recordNote", { minYear: summary.min.year, min: fmt(summary.min.value), maxYear: summary.max.year, max: fmt(summary.max.value) })}</p>
        </Pane>

        <Pane icon={Sun} title={t("stationsNow")} description={t("stationsNowBody")} className="lg:col-span-4" bodyClassName="px-2">
          <ul className="grid gap-2">
            {stations.map((s) => {
              // before hydration there is no clock yet; render the card shell without numbers
              const sun = time ? sunInfo(s.lat, s.lng, new Date(time)) : null;
              const Icon = sun ? SUN_ICON[sun.state] : Sun;
              return (
                <li key={s.id} className="rounded-xl border bg-background p-3">
                  <div className="flex items-center gap-3">
                    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl border", sun ? SUN_TONE[sun.state] : "bg-muted text-muted-foreground")}>
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <div className="grid min-w-0 flex-1">
                      <span className="truncate text-sm font-semibold">{s.name}</span>
                      <span className="truncate text-xs text-muted-foreground">{s.regionLabel}</span>
                    </div>
                    {sun && (
                      <Badge variant="outline" className={cn("shrink-0", SUN_TONE[sun.state])}>
                        {t(`state_${sun.state}` as "state_day")}
                      </Badge>
                    )}
                  </div>
                  {sun && (
                    <>
                      {/* 24-hour bar: the lit part is today's daylight, the marker is the local solar time */}
                      <div className="relative mt-3 h-2 rounded-full bg-muted" aria-hidden>
                        <div className="absolute inset-y-0 rounded-full bg-gradient-to-r from-warning/70 via-warning to-warning/70" style={{ left: `${50 - (sun.daylightHours / 24) * 50}%`, right: `${50 - (sun.daylightHours / 24) * 50}%` }} />
                        <div className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary" style={{ left: `${(sun.solarMinutes / 1440) * 100}%` }} />
                      </div>
                      <dl className="mt-2.5 grid grid-cols-3 gap-2 text-center">
                        <div>
                          <dd className="text-sm font-semibold tabular-nums">{clock(sun.solarMinutes)}</dd>
                          <dt className="text-[11px] text-muted-foreground">{t("solarTime")}</dt>
                        </div>
                        <div>
                          <dd className="text-sm font-semibold tabular-nums">{sun.elevation.toFixed(1)}°</dd>
                          <dt className="text-[11px] text-muted-foreground">{t("sunHeight")}</dt>
                        </div>
                        <div>
                          <dd className="text-sm font-semibold tabular-nums">{t("hours", { h: sun.daylightHours.toFixed(1) })}</dd>
                          <dt className="text-[11px] text-muted-foreground">{t("daylight")}</dt>
                        </div>
                      </dl>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-3 px-1 text-[11px] text-muted-foreground">{t("sunNote")}</p>
        </Pane>
      </FrameBody>
    </Frame>
  );
}
