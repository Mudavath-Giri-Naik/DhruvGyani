"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import Papa from "papaparse";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartColumn, Download, FileSpreadsheet, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buildDataCard } from "@/lib/datasets/profile";
import type { DatasetProfile } from "@/lib/types";

/**
 * Data Quick-Look: an instant chart, a column summary and a plain-language
 * data card. Every number shown here is computed by code (profileCsv), never
 * by the AI.
 */
export function DataQuickLook({ profile, csv, itemId }: { profile: DatasetProfile; csv: string | null; itemId: string }) {
  const t = useTranslations("item");
  const tu = useTranslations("ui");
  const locale = useLocale();
  const numeric = profile.columns.filter((c) => c.kind === "number");
  const [col, setCol] = useState(numeric[0]?.name ?? "");
  const timeCol = profile.time_range?.column ?? null;

  const rows = useMemo(() => {
    if (!csv) return (profile.sample_rows ?? []) as Record<string, string | number | null>[];
    return Papa.parse<Record<string, string>>(csv.trim(), { header: true, skipEmptyLines: true }).data;
  }, [csv, profile.sample_rows]);

  const data = useMemo(
    () =>
      rows
        .map((r, i) => ({ x: timeCol ? String(r[timeCol]) : String(i + 1), y: r[col] === "" || r[col] == null ? null : Number(r[col]) }))
        .filter((d) => d.y === null || Number.isFinite(d.y)),
    [rows, col, timeCol],
  );
  const unit = profile.columns.find((c) => c.name === col)?.unit ?? profile.units[col] ?? "";
  const config: ChartConfig = { y: { label: `${col}${unit ? ` (${unit})` : ""}`, color: "var(--chart-1)" } };
  const card = buildDataCard(profile, locale === "hi" ? "hi" : "en");

  const download = () => {
    if (!csv) return;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `dataset-${itemId.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold">
          <ChartColumn className="size-5 text-primary" /> {t("dataQuickLook")}
        </h2>
        <div className="flex items-center gap-2">
          {numeric.length > 1 && (
            <Select value={col} onValueChange={setCol}>
              <SelectTrigger className="w-52" aria-label="Column to chart">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {numeric.map((c) => (
                  <SelectItem key={c.name} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {csv && (
            <Button size="sm" variant="outline" onClick={download}>
              <Download /> CSV
            </Button>
          )}
        </div>
      </div>

      {col && data.length > 0 && (
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          {timeCol ? (
            <AreaChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
              <defs>
                <linearGradient id={`fill-${itemId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-y)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--color-y)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="x" tickLine={false} axisLine={false} minTickGap={32} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={44} />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <Area dataKey="y" type="monotone" stroke="var(--color-y)" strokeWidth={2} fill={`url(#fill-${itemId})`} connectNulls={false} />
            </AreaChart>
          ) : (
            <BarChart data={data.slice(0, 40)}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="x" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={44} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="y" fill="var(--color-y)" radius={4} />
            </BarChart>
          )}
        </ChartContainer>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>{tu("column")}</TableHead>
                <TableHead>{tu("kind")}</TableHead>
                <TableHead className="text-right">{tu("min")}</TableHead>
                <TableHead className="text-right">{tu("max")}</TableHead>
                <TableHead className="text-right">{tu("mean")}</TableHead>
                <TableHead className="text-right">{tu("missing")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profile.columns.map((c) => (
                <TableRow key={c.name}>
                  <TableCell className="font-mono text-xs">
                    {c.name}
                    {c.unit && <span className="ml-1 text-muted-foreground">({c.unit})</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {c.kind}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{c.min ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.max ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.mean ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.missing ? `${c.missing} (${c.missingPct}%)` : "0"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-aurora/5 p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            <FileSpreadsheet className="size-4 text-primary" /> {tu("dataCard")}
          </p>
          <ul className="mt-2 space-y-1.5 text-muted-foreground">
            {card.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
          <p className="mt-3 flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <Info className="mt-0.5 size-3 shrink-0" /> {tu("dataCaveat")}
          </p>
        </div>
      </div>
    </div>
  );
}
