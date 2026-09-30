"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface ItemTab {
  value: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  /** Let the content fill the pane instead of scrolling (PDF viewer). */
  fill?: boolean;
}

/** Main pane of the item page: one tab per view, each scrolling inside the card. `?explain=` opens the explainer. */
export function ItemTabs({ tabs }: { tabs: ItemTab[] }) {
  const sp = useSearchParams();
  const wanted = sp.get("explain") && tabs.some((t) => t.value === "explain") ? "explain" : tabs[0]?.value;
  const [tab, setTab] = useState(wanted);
  return (
    <Tabs value={tab} onValueChange={setTab} className="h-full min-h-0 gap-0 overflow-hidden rounded-2xl border bg-card shadow-xs">
      <div className="shrink-0 border-b px-3 py-2">
        <TabsList className="flex-wrap justify-start group-data-horizontal/tabs:h-auto">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="h-7 flex-none gap-1.5 px-3">
              {t.icon} {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {tabs.map((t) => (
        <TabsContent key={t.value} value={t.value} className="min-h-0">
          {t.fill ? (
            <div className="h-full">{t.content}</div>
          ) : (
            <ScrollArea className="h-full [&>[data-slot=scroll-area-viewport]>div]:block!">
              <div className="p-4">{t.content}</div>
            </ScrollArea>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
