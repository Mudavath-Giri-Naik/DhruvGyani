"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { CalendarHeart, Flag, Info, Loader2, PackagePlus, PenLine, SearchX } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { TypeIcon } from "@/components/items/type-icon";
import type { CalendarEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMounted } from "@/components/a11y/local-store";

function weekWindow() {
  const now = Date.now();
  return { today: new Date(now).toISOString().slice(0, 10), weekEnd: new Date(now + 7 * 86400000).toISOString().slice(0, 10) };
}

export function CalendarBoard({ entries, items }: { entries: CalendarEntry[]; items: Record<string, { id: string; title: string; type: string }> }) {
  const t = useTranslations("calendar");
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const mounted = useMounted();
  const [month, setMonth] = useState<Date>(new Date());
  const dates = useMemo(() => entries.map((e) => new Date(`${e.date}T00:00:00`)), [entries]);
  const { today, weekEnd } = weekWindow();

  const buildPack = async () => {
    setBusy(true);
    const res = await fetch("/api/calendar/suggest", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ days: 7 }) });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      toast.error(json.error ?? "Could not build the pack");
      return;
    }
    toast.success(t("packBuilt", { count: json.created.length }), {
      description: json.skipped.length ? json.skipped.join(" · ") : undefined,
      action: { label: "Review", onClick: () => router.push("/studio/review") },
    });
    router.refresh();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <div className="space-y-4">
        <div className="min-h-[300px] rounded-2xl border bg-card p-2">
          {mounted && (
          <Calendar
            mode="multiple"
            selected={dates}
            month={month}
            onMonthChange={setMonth}
            className="w-full"
            modifiersClassNames={{ selected: "!bg-primary/15 !text-primary font-semibold rounded-md" }}
          />
          )}
        </div>
        <Button size="lg" className="w-full" onClick={buildPack} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <PackagePlus />} {t("buildPack")}
        </Button>
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" /> {t("checkDates")} The pack drafts Instagram and X posts for this week&apos;s occasions and sends them to review.
        </p>
      </div>

      <ol className="space-y-3">
        {entries.map((e, i) => {
          const d = new Date(`${e.date}T00:00:00Z`);
          const thisWeek = e.date >= today && e.date <= weekEnd;
          return (
            <motion.li
              key={e.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={cn("flex gap-4 rounded-2xl border bg-card p-4", thisWeek && "border-primary/50 ring-2 ring-primary/10")}
              onMouseEnter={() => setMonth(d)}
            >
              <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-aurora/15 py-2 text-center">
                <span className="text-xs font-medium uppercase text-primary">{d.toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" })}</span>
                <span className="text-2xl font-semibold leading-none">{d.getUTCDate()}</span>
                <span className="text-[10px] text-muted-foreground">{d.getUTCFullYear()}</span>
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  {e.kind === "milestone" ? <Flag className="size-4 text-warning" /> : <CalendarHeart className="size-4 text-aurora" />}
                  <h2 className="font-semibold" lang={locale === "hi" && e.occasion_hi ? "hi" : undefined}>
                    {locale === "hi" && e.occasion_hi ? e.occasion_hi : e.occasion}
                  </h2>
                  {thisWeek && <Badge>This week</Badge>}
                  {e.status !== "idea" && (
                    <Badge variant="secondary" className="capitalize">
                      {e.status}
                    </Badge>
                  )}
                </div>
                {e.suggested_item_ids.length ? (
                  <div>
                    <p className="text-xs text-muted-foreground">{t("suggested")}</p>
                    <ul className="mt-1.5 flex flex-wrap gap-2">
                      {e.suggested_item_ids.map((id) =>
                        items[id] ? (
                          <li key={id}>
                            <Link href={`/items/${id}`} className="inline-flex max-w-72 items-center gap-1.5 rounded-lg border px-2 py-1 text-xs hover:border-primary/40">
                              <TypeIcon type={items[id].type} className="size-3.5 text-muted-foreground" />
                              <span className="truncate">{items[id].title}</span>
                            </Link>
                          </li>
                        ) : null,
                      )}
                    </ul>
                  </div>
                ) : (
                  <p className="flex items-center gap-1.5 text-xs text-warning">
                    <SearchX className="size-3.5" /> {t("noSuggestions")}
                  </p>
                )}
              </div>
              {e.suggested_item_ids.length > 0 && (
                <Button asChild size="sm" variant="outline" className="self-center">
                  <Link href={`/studio/content?items=${e.suggested_item_ids[0]}`}>
                    <PenLine /> <span className="hidden sm:inline">{t("draftPost")}</span>
                  </Link>
                </Button>
              )}
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
