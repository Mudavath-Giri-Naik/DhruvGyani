"use client";

import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BookOpenCheck, BotOff, Database, GraduationCap, Loader2, Microscope, School, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CitedText } from "@/components/cited-text";
import type { Citation } from "@/lib/types";

type Level = "school" | "college" | "expert";
interface Result {
  text: string;
  citations: Citation[];
  source: "cache" | "ai" | "offline";
  language: "en" | "hi";
}

export function ExplainerPanel({ itemId, aiAllowed, hasText }: { itemId: string; aiAllowed: boolean; hasText: boolean }) {
  const t = useTranslations("item");
  const tu = useTranslations("ui");
  const tc = useTranslations("common");
  const locale = useLocale();
  const sp = useSearchParams();
  const initialLevel = (["school", "college", "expert"].includes(sp.get("explain") ?? "") ? sp.get("explain") : "school") as Level;
  const [level, setLevel] = useState<Level>(initialLevel);
  const [lang, setLang] = useState<"en" | "hi">(locale === "hi" ? "hi" : "en");
  const [cache, setCache] = useState<Record<string, Result>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const key = `${level}:${lang}`;
  const result = cache[key];

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/explain", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ itemId, level, lang }) });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) return setError(json.error ?? "Error");
    setCache((c) => ({ ...c, [`${level}:${lang}`]: json }));
  }, [itemId, level, lang]);

  useEffect(() => {
    if (!hasText || cache[key]) return;
    const id = setTimeout(load, 0);
    return () => clearTimeout(id);
  }, [key, hasText, cache, load]);

  if (!hasText) return null;
  const levels: { v: Level; icon: typeof School; label: string }[] = [
    { v: "school", icon: School, label: t("school") },
    { v: "college", icon: GraduationCap, label: t("college") },
    { v: "expert", icon: Microscope, label: t("expert") },
  ];

  return (
    <section id="explain" aria-labelledby="explain-h" className="scroll-mt-20 overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/5 via-card to-aurora/5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <h2 id="explain-h" className="flex items-center gap-2 font-semibold">
          <BookOpenCheck className="size-5 text-primary" /> {t("explainer")}
        </h2>
        <ToggleGroup type="single" size="sm" variant="outline" value={lang} onValueChange={(v) => v && setLang(v as "en" | "hi")} aria-label="Explainer language">
          <ToggleGroupItem value="en" className="px-3 text-xs">
            English
          </ToggleGroupItem>
          <ToggleGroupItem value="hi" className="px-3 text-xs" lang="hi">
            हिंदी
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="space-y-4 p-4">
        <ToggleGroup type="single" variant="outline" value={level} onValueChange={(v) => v && setLevel(v as Level)} aria-label="Explanation level" className="grid w-full grid-cols-3">
          {levels.map((l) => (
            <ToggleGroupItem key={l.v} value={l.v} className="gap-1.5">
              <l.icon className="size-4" /> <span className="truncate">{l.label}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="min-h-28" aria-live="polite" aria-busy={loading}>
          {loading && !result && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          )}
          {error && (
            <div className="flex items-center gap-3 text-sm text-destructive">
              {error}
              <Button size="sm" variant="outline" onClick={load}>
                Retry
              </Button>
            </div>
          )}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div key={key} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-3">
                <p className="text-base leading-relaxed" lang={result.language}>
                  <CitedText text={result.text} citations={result.citations} onCite={setActive} activeMarker={active} />
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {result.source === "offline" ? (
                    <Badge variant="outline" className="gap-1">
                      {aiAllowed ? <Database className="size-3" /> : <BotOff className="size-3" />}
                      {aiAllowed ? tu("offlineExtract") : tc("aiDisabled")}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <Sparkles className="size-3 text-aurora" /> {result.source === "cache" ? t("cached") : "AI"} · {tu("sourceCited")}
                    </Badge>
                  )}
                  {result.source === "offline" && lang === "hi" && <span>{tu("hindiNeedsAi")}</span>}
                  {loading && <Loader2 className="size-3 animate-spin" />}
                </div>
                {active && (
                  <blockquote className="rounded-lg border-l-4 border-primary bg-muted/50 p-3 text-sm">
                    {(() => {
                      const c = result.citations.find((x) => x.marker === active);
                      return c ? (
                        <>
                          <p className="text-xs font-medium text-primary">
                            [{active.slice(1)}] {c.item_title}
                            {c.page_no ? ` · p.${c.page_no}` : ""}
                          </p>
                          <p className="mt-1 text-muted-foreground">“{c.quote}…”</p>
                        </>
                      ) : null;
                    })()}
                  </blockquote>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
