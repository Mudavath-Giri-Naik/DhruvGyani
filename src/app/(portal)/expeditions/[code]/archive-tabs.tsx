"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItemCard } from "@/components/items/item-card";
import { TypeIcon } from "@/components/items/type-icon";
import { EmptyState } from "@/components/page-header";
import { ITEM_TYPES } from "@/lib/constants";
import type { Item } from "@/lib/types";

export function ArchiveTabs({ byType, code }: { byType: Record<string, Item[]>; code: string }) {
  const t = useTranslations("expeditions");
  const tn = useTranslations("nav");
  const first = ITEM_TYPES.find((type) => byType[type]?.length) ?? "report";
  const plural: Record<string, string> = {
    report: "reports",
    dataset: "datasets",
    publication: "publications",
    photo: "photos",
    video: "videos",
    activity: "activities",
  };
  return (
    <Tabs defaultValue={first} className="mt-6">
      <TabsList className="h-auto w-full flex-wrap justify-start">
        {ITEM_TYPES.map((type) => (
          <TabsTrigger key={type} value={type} className="gap-1.5">
            <TypeIcon type={type} className="size-3.5" />
            {tn(plural[type] as "reports")}
            <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums">{byType[type]?.length ?? 0}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      {ITEM_TYPES.map((type) => (
        <TabsContent key={type} value={type} className="mt-6">
          {byType[type]?.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {byType[type].map((item) => (
                <ItemCard key={item.id} item={item} expeditionCode={code} />
              ))}
            </div>
          ) : (
            <EmptyState title={t("noItems")} />
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
