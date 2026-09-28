"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { Eye, Search, SearchX, ThumbsUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Button } from "@/components/ui/button";

const trafficConfig: ChartConfig = { views: { label: "Item views", color: "var(--chart-1)" }, searches: { label: "Searches", color: "var(--chart-2)" } };
const statusConfig: ChartConfig = {
  published: { label: "Published", color: "var(--chart-2)" },
  in_review: { label: "In review", color: "var(--chart-3)" },
  draft: { label: "Draft", color: "var(--chart-4)" },
};
const channelConfig: ChartConfig = { approved: { label: "Approved / published", color: "var(--chart-2)" }, total: { label: "All drafts", color: "var(--chart-1)" } };
const CHANNEL: Record<string, string> = { website_article: "Article", x: "X", facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn" };

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
  const kpis = [
    { label: t("views"), value: totals.views, icon: Eye, suffix: "" },
    { label: t("searches"), value: totals.searches, icon: Search, suffix: "" },
    { label: t("noResult"), value: noResult.reduce((a, n) => a + n.count, 0), icon: SearchX, suffix: "" },
    { label: t("approvalRate"), value: totals.approvalRate, icon: ThumbsUp, suffix: "%" },
  ];
  const maxTop = Math.max(1, ...top.map((x) => x.count));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{k.label}</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums">
                  <NumberTicker value={k.value} />
                  {k.suffix}
                </p>
              </div>
              <span className="rounded-xl bg-gradient-to-br from-primary/15 to-aurora/15 p-3 text-primary">
                <k.icon className="size-5" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Traffic, last 14 days</CardTitle>
          <CardDescription>Item views and searches per day (no personal data is stored).</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={trafficConfig} className="aspect-auto h-72 w-full">
            <AreaChart data={byDay} margin={{ left: 0, right: 12 }}>
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
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("topSearches")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {top.map((s) => (
                <li key={s.query} className="grid grid-cols-[1fr_auto] items-center gap-3 text-sm">
                  <div>
                    <div className="flex justify-between">
                      <span className="truncate font-medium">{s.query}</span>
                      <span className="text-xs text-muted-foreground">avg {s.avgResults} results</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-aurora" style={{ width: `${(s.count / maxTop) * 100}%` }} />
                    </div>
                  </div>
                  <span className="w-8 text-right tabular-nums">{s.count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SearchX className="size-5 text-warning" /> {t("noResult")}
            </CardTitle>
            <CardDescription>Each is a signal for new explainers or uploads.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {noResult.map((n) => (
                <li key={n.query} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    “{n.query}” <span className="text-muted-foreground">· {n.count}×</span>
                  </span>
                  <Button asChild size="sm" variant="ghost">
                    <Link href="/studio/content">Create content</Link>
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("byStatus")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={statusConfig} className="mx-auto aspect-square h-64">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
                <Pie data={byStatus} dataKey="count" nameKey="status" innerRadius={60} strokeWidth={4}>
                  {byStatus.map((s) => (
                    <Cell key={s.status} fill={`var(--color-${s.status})`} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="status" />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most-approved formats</CardTitle>
            <CardDescription>
              {totals.reviewed} reviewed drafts · {totals.approvalRate}% approved
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={channelConfig} className="aspect-auto h-64 w-full">
              <BarChart data={byChannel.map((c) => ({ ...c, name: CHANNEL[c.channel] }))}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="total" fill="var(--color-total)" radius={4} />
                <Bar dataKey="approved" fill="var(--color-approved)" radius={4} />
                <ChartLegend content={<ChartLegendContent />} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("topItems")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="grid gap-2 md:grid-cols-2">
              {topItems.map((i, n) => (
                <li key={i.id} className="flex items-center gap-3 rounded-xl border p-3 text-sm">
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{n + 1}</span>
                  <Link href={`/items/${i.id}`} className="min-w-0 flex-1 truncate font-medium hover:text-primary">
                    {i.title}
                  </Link>
                  <span className="tabular-nums text-muted-foreground">{i.views}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
