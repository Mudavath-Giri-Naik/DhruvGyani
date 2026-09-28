"use client";

import { useTranslations } from "next-intl";
import { BadgeCheck, FileSearch, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Citation } from "@/lib/types";

/** "Source-cited · Reviewed by [name] · [date]" with a "How this was made" drawer. */
export function Provenance({
  reviewer,
  date,
  citations,
  promptVersion,
  model,
}: {
  reviewer: string | null;
  date: string | null;
  citations: Citation[];
  promptVersion: string;
  model: string | null;
}) {
  const t = useTranslations("stories");
  const tu = useTranslations("ui");
  const when = date ? new Date(date).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-medium text-success">
        <ShieldCheck className="size-3.5" />
        {t("provenance", { name: reviewer ?? "NCPOR reviewer", date: when })}
      </span>
      <Sheet>
        <SheetTrigger asChild>
          <Button size="sm" variant="ghost" className="h-7 rounded-full text-xs">
            <FileSearch className="size-3.5" /> {t("howMade")}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <BadgeCheck className="size-5 text-primary" /> {t("howMade")}
            </SheetTitle>
            <SheetDescription>{t("howMadeBody")}</SheetDescription>
          </SheetHeader>
          <div className="space-y-5 px-4 pb-6 text-sm">
            <dl className="grid grid-cols-[120px_1fr] gap-2 rounded-xl border p-3">
              <dt className="text-muted-foreground">{t("model")}</dt>
              <dd>{model ?? "—"}</dd>
              <dt className="text-muted-foreground">{t("promptVersion")}</dt>
              <dd className="font-mono text-xs">{promptVersion}</dd>
              <dt className="text-muted-foreground">{tu("reviewedBy")}</dt>
              <dd>{reviewer ?? "—"}</dd>
              <dt className="text-muted-foreground">{tu("published")}</dt>
              <dd>{when}</dd>
            </dl>
            <div>
              <p className="mb-2 font-medium">{t("sources")}</p>
              <ol className="space-y-2">
                {citations.map((c) => (
                  <li key={c.marker} className="rounded-xl border p-3">
                    <p className="text-xs font-medium">
                      [{c.marker.slice(1)}] {c.item_title}
                      {c.page_no ? ` · p.${c.page_no}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">“{c.quote}…”</p>
                    <a href={`/items/${c.item_id}`} className="mt-1 inline-block text-xs text-primary hover:underline">
                      {tu("openSource")}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
