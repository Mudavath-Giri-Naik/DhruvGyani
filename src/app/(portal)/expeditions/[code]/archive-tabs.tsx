"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Archive } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SampleBadge } from "@/components/items/badges";
import { formatDate } from "@/components/items/item-card";
import { TYPE_ICON, TYPE_TONE, TypeIcon } from "@/components/items/type-icon";
import { ITEM_TYPES } from "@/lib/constants";
import type { Item } from "@/lib/types";
import { cn } from "@/lib/utils";

const PLURAL: Record<string, string> = {
  report: "reports",
  dataset: "datasets",
  publication: "publications",
  photo: "photos",
  video: "videos",
  activity: "activities",
};

/** Everything linked to the expedition, one tab per content type; the list scrolls inside the card. */
export function ArchiveTabs({ byType, className }: { byType: Record<string, Item[]>; className?: string }) {
  const t = useTranslations("expeditions");
  const tn = useTranslations("nav");
  const first = ITEM_TYPES.find((type) => byType[type]?.length) ?? "report";
  return (
    <section aria-labelledby="archive-h" className={cn("flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-card shadow-xs", className)}>
      <Tabs defaultValue={first} className="min-h-0 flex-1 gap-0">
        <div className="shrink-0 space-y-2 px-4 pt-3 pb-2">
          <h2 id="archive-h" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-aurora/15 text-primary">
              <Archive className="size-4" aria-hidden />
            </span>
            {t("archive")}
          </h2>
          <TabsList className="w-full flex-wrap justify-start group-data-horizontal/tabs:h-auto">
            {ITEM_TYPES.map((type) => (
              <TabsTrigger key={type} value={type} className="h-7 flex-none gap-1.5 px-2">
                <TypeIcon type={type} className="size-3.5" />
                <span className="sr-only sm:not-sr-only lg:sr-only 2xl:not-sr-only">{tn(PLURAL[type] as "reports")}</span>
                <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums">{byType[type]?.length ?? 0}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {ITEM_TYPES.map((type) => {
          const Icon = TYPE_ICON[type];
          return (
            <TabsContent key={type} value={type} className="min-h-0">
              <ScrollArea className="h-full [&>[data-slot=scroll-area-viewport]>div]:block!">
                {byType[type]?.length ? (
                  <ul className="px-2 pb-4">
                    {byType[type].map((item) => (
                      <li key={item.id}>
                        <Link href={`/items/${item.id}`} className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/60">
                          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg border", TYPE_TONE[type])}>
                            <Icon className="size-4" aria-hidden />
                          </span>
                          <span className="grid min-w-0 flex-1">
                            <span className="truncate text-sm font-medium group-hover:text-primary" lang={item.language}>
                              {item.title}
                            </span>
                            <span className="truncate text-xs text-muted-foreground" lang={item.language}>
                              {[formatDate(item.event_date), item.description].filter(Boolean).join(" · ")}
                            </span>
                          </span>
                          {item.is_sample && <SampleBadge className="shrink-0 max-sm:hidden lg:max-xl:hidden" />}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 pb-4 text-sm text-muted-foreground">{t("noItems")}</p>
                )}
              </ScrollArea>
            </TabsContent>
          );
        })}
      </Tabs>
    </section>
  );
}
