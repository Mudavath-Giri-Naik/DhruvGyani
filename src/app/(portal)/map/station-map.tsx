"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Layers, LocateFixed, Map as MapIcon, MapPin, Maximize2, Search, Ship } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Frame, FrameBody, FrameHeader, MetaChip, Pane } from "@/components/frame";
import { cn } from "@/lib/utils";

export interface MapStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  regionLabel: string;
  description: string;
  count: number;
  expeditions: string[];
}

// Leaflet touches `window`, so it only loads in the browser.
const LeafletMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});

const coord = (v: number, pos: string, neg: string) => `${Math.abs(v).toFixed(2)}° ${v >= 0 ? pos : neg}`;

export function StationMap({ stations, attribution }: { stations: MapStation[]; attribution: string }) {
  const t = useTranslations("map");
  const [selected, setSelected] = useState<string | null>(null);
  const totalItems = stations.reduce((a, s) => a + s.count, 0);

  return (
    <Frame>
      <FrameHeader
        icon={MapIcon}
        title={t("title")}
        description={`${t("subtitle")} ${t("approx")}`}
        actions={
          <>
            <MetaChip icon={MapPin}>{t("stationCount", { count: stations.length })}</MetaChip>
            <MetaChip icon={Layers} className="max-sm:hidden">
              {t("items", { count: totalItems })}
            </MetaChip>
          </>
        }
      />
      <FrameBody className="lg:grid-cols-12">
        <div className="relative h-[420px] min-h-0 overflow-hidden rounded-2xl border shadow-xs lg:col-span-8 fit:h-auto">
          <LeafletMap stations={stations} attribution={attribution} selected={selected} onSelect={setSelected} />
          {selected && (
            <Button size="sm" variant="secondary" className="absolute top-3 right-3 z-10 shadow-md" onClick={() => setSelected(null)}>
              <Maximize2 /> {t("showAll")}
            </Button>
          )}
        </div>

        {/* Same information as a list, for screen readers and keyboard users */}
        <Pane icon={LocateFixed} title={t("stations")} count={stations.length} className="lg:col-span-4" bodyClassName="px-2">
          <ul className="grid gap-2">
            {stations.map((s) => {
              const on = s.id === selected;
              return (
                <li key={s.id}>
                  <article className={cn("rounded-xl border bg-background p-3 transition-all", on ? "border-primary/50 ring-2 ring-primary/15" : "hover:border-primary/40")}>
                    <button type="button" aria-pressed={on} onClick={() => setSelected(on ? null : s.id)} className="flex w-full items-center gap-3 text-left">
                      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl border transition-colors", on ? "bg-primary text-primary-foreground" : "bg-gradient-to-br from-primary/15 to-aurora/15 text-primary")}>
                        <MapPin className="size-4" aria-hidden />
                      </span>
                      <span className="grid min-w-0 flex-1">
                        <span className="truncate text-sm font-semibold">{s.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{s.regionLabel}</span>
                      </span>
                      <Badge variant="secondary" className="shrink-0 tabular-nums">
                        {t("items", { count: s.count })}
                      </Badge>
                    </button>
                    <p className={cn("mt-2 text-sm text-muted-foreground", !on && "line-clamp-2")}>{s.description}</p>
                    <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
                      {coord(s.lat, "N", "S")}, {coord(s.lng, "E", "W")} ({t("approxShort")})
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {s.expeditions.map((code) => (
                        <Link key={code} href={`/expeditions/${code}`} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px] text-primary transition-colors hover:border-primary/40 hover:bg-primary/5">
                          <Ship className="size-3" aria-hidden /> {code}
                        </Link>
                      ))}
                      <Link href={`/explore?q=${encodeURIComponent(s.name)}`} className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline">
                        <Search className="size-3" aria-hidden /> {t("search")}
                      </Link>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </Pane>
      </FrameBody>
    </Frame>
  );
}
