"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { ChartArea, ChartNoAxesColumn, ChartPie, Download, Eye, Search, SearchX, ThumbsUp, TrendingUp, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Frame, FrameBody, FrameHeader, MetaChip, Pane, Stat } from "@/components/frame";

const trafficConfig: ChartConfig = { views: { label: "Item views", color: "var(--chart-1)" }, searches: { label: "Searches", color: "var(--chart-2)" } };
const statusConfig: ChartConfig = {
  published: { label: "Published", color: "var(--chart-2)" },
  in_review: { label: "In review", color: "var(--chart-3)" },
  draft: { label: "Draft", color: "var(--chart-4)" },
};
const channelConfig: ChartConfig = { approved: { label: "Approved / published", color: "var(--chart-2)" }, total: { label: "All drafts", color: "var(--chart-1)" } };
const CHANNEL: Record<string, string> = { website_article: "Article", x: "X", facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn" };
// charts fill their pane on desktop and get a fixed height when the page stacks
const CHART = "aspect-auto h-56 w-full fit:h-auto fit:min-h-0 fit:flex-1";

export function AnalyticsBoard({
  byDay,
  top,
  noResult,
  totals,
  byStatus,
  byChannel,
  topItems,
}: {
  byDay: { day: string; searches: number; views: number }[];
  top: { query: string; count: number; avgResults: number }[];
  noResult: { query: string; count: number }[];
  totals: { searches: number; views: number; approvalRate: number; reviewed: number };
  byStatus: { status: string; count: number }[];
  byChannel: { channel: string; approved: number; total: number }[];
  topItems: { id: string; title: string; views: number }[];
}) {
  const t = useTranslations("analytics");
  const [range, setRange] = useState("14");
  const days = byDay.slice(-Number(range));
  const maxTop = Math.max(1, ...top.map((x) => x.count));
  const maxViews = Math.max(1, ...topItems.map((x) => x.views));
  const gapCount = noResult.reduce((a, n) => a + n.count, 0);

  const exportCsv = () => {
    const csv = ["day,views,searches", ...byDay.map((d) => `${d.day},${d.views},${d.searches}`)].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "dhruvgyani-traffic.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Frame>
      <FrameHeader
        icon={ChartNoAxesColumn}
        title={t("title")}
        description={t("subtitle")}
        actions={
          <>
            {/* on short screens the KPI row folds into these chips so the charts keep their height */}
            <MetaChip icon={Eye} className="hidden short:inline-flex">
              {totals.views} views
            </MetaChip>
            <MetaChip icon={Search} className="hidden short:inline-flex">
              {totals.searches} searches
            </MetaChip>
            <MetaChip icon={SearchX} className="hidden short:inline-flex">
              {gapCount} no-result
            </MetaChip>
            <MetaChip icon={ThumbsUp} className="hidden short:inline-flex">
              {totals.approvalRate}% approved
            </MetaChip>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download /> CSV
            </Button>
          </>
        }
      />

      <div className="grid shrink-0 grid-cols-2 gap-3 short:hidden xl:grid-cols-4 tall:gap-4">
        <Stat icon={Eye} label={t("views")} value={totals.views} />
        <Stat icon={Search} label={t("searches")} value={totals.searches} />
        <Stat icon={SearchX} label={t("noResult")} value={gapCount} />
        <Stat icon={ThumbsUp} label={t("approvalRate")} value={totals.approvalRate} suffix="%" hint={`${totals.reviewed} reviewed drafts`} />
      </div>

      <FrameBody className="lg:grid-cols-12 fit:grid-rows-[minmax(0,5fr)_minmax(0,4fr)]">
        <Pane
          icon={ChartArea}
          title="Traffic"
          description="Item views and searches per day (no personal data is stored)."
          scroll={false}
          className="lg:col-span-8"
          bodyClassName="px-3 pb-3"
          action={
            <ToggleGroup type="single" variant="outline" size="sm" value={range} onValueChange={(v) => v && setRange(v)} aria-label="Date range">
              <ToggleGroupItem value="7" className="px-2.5 text-xs">
                7d
              </ToggleGroupItem>
              <ToggleGroupItem value="14" className="px-2.5 text-xs">
                14d
              </ToggleGroupItem>
            </ToggleGroup>
          }
        >
          <ChartContainer config={trafficConfig} className={CHART}>
            <AreaChart data={days} margin={{ left: 0, right: 12, top: 4 }}>
              <defs>
                {(["views", "searches"] as const).map((k) => (
                  <linearGradient key={k} id={`g-${k}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={`var(--color-${k})`} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={`var(--color-${k})`} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tickFormatter={(d: string) => d.slice(5)} minTickGap={24} />
              <YAxis tickLine={false} axisLine={false} width={36} />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Area dataKey="views" type="monotone" stroke="var(--color-views)" strokeWidth={2} fill="url(#g-views)" />
              <Area dataKey="searches" type="monotone" stroke="var(--color-searches)" strokeWidth={2} fill="url(#g-searches)" />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </Pane>

        <Pane icon={ChartPie} title={t("byStatus")} scroll={false} className="lg:col-span-4" bodyClassName="px-3 pb-3">
          <ChartContainer config={statusConfig} className={CHART}>
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
              <Pie data={byStatus} dataKey="count" nameKey="status" innerRadius="55%" strokeWidth={4}>
                {byStatus.map((s) => (
                  <Cell key={s.status} fill={`var(--color-${s.status})`} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="status" />} />
            </PieChart>
          </ChartContainer>
        </Pane>

        <Pane icon={TrendingUp} title={t("topSearches")} className="lg:col-span-3">
          <ul className="space-y-2.5">
            {top.map((s) => (
              <li key={s.query} className="text-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-medium">{s.query}</span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {s.count}× · avg {s.avgResults}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-aurora" style={{ width: `${(s.count / maxTop) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Pane>

        <Pane icon={SearchX} title="Content gaps" description="Signals for new explainers or uploads." className="lg:col-span-3" bodyClassName="px-2">
          <ul>
            {noResult.map((n) => (
              <li key={n.query}>
                <Link href="/studio/content" className="group flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted/60">
                  <span className="min-w-0 truncate">
                    “{n.query}” <span className="text-muted-foreground">· {n.count}×</span>
                  </span>
                  <span className="shrink-0 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">Create</span>
                </Link>
              </li>
            ))}
          </ul>
        </Pane>

        <Pane icon={ThumbsUp} title="Most-approved formats" scroll={false} className="lg:col-span-3" bodyClassName="px-3 pb-3">
          <ChartContainer config={channelConfig} className={CHART}>
            <BarChart data={byChannel.map((c) => ({ ...c, name: CHANNEL[c.channel] }))} margin={{ left: 0, right: 4, top: 4 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={24} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="total" fill="var(--color-total)" radius={4} />
              <Bar dataKey="approved" fill="var(--color-approved)" radius={4} />
            </BarChart>
          </ChartContainer>
        </Pane>

        <Pane icon={Trophy} title={t("topItems")} className="lg:col-span-3" bodyClassName="px-2">
          <ol>
            {topItems.map((i, n) => (
              <li key={i.id}>
                <Link href={`/items/${i.id}`} className="group relative flex items-center gap-2.5 overflow-hidden rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted/60">
                  <span className="absolute inset-y-1 left-0 rounded-md bg-primary/10" style={{ width: `${(i.views / maxViews) * 100}%` }} aria-hidden />
                  <span className="relative flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">{n + 1}</span>
                  <span className="relative min-w-0 flex-1 truncate font-medium group-hover:text-primary">{i.title}</span>
                  <span className="relative text-muted-foreground tabular-nums">{i.views}</span>
                </Link>
              </li>
            ))}
          </ol>
        </Pane>
      </FrameBody>
    </Frame>
  );
}
