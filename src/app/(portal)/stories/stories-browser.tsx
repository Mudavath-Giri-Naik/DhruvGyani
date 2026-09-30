"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, CheckCircle2, Clock, FileSearch, Newspaper, Search, SearchX, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FrameBody, MetaChip, Pane } from "@/components/frame";
import { formatDate } from "@/components/items/item-card";
import { MediaThumb } from "@/components/items/media-thumb";
import { EmptyState } from "@/components/page-header";
import { PolarArt } from "@/components/polar-art";
import { cn } from "@/lib/utils";

export interface StoryCard {
  id: string;
  slug: string;
  language: string;
  headline: string;
  standfirst: string;
  facts: string[];
  published_at: string | null;
  reviewer: string | null;
  minutes: number;
  sources: number;
  thumb: { type: string; media_url: string | null; alt_text: string | null } | null;
}

function Thumb({ story, className }: { story: StoryCard; className?: string }) {
  return story.thumb ? (
    <MediaThumb item={story.thumb as Parameters<typeof MediaThumb>[0]["item"]} className={className} />
  ) : (
    <div className={cn("relative overflow-hidden", className)}>
      <PolarArt variant="aurora" />
    </div>
  );
}

export function StoriesBrowser({ stories }: { stories: StoryCard[] }) {
  const t = useTranslations("stories");
  const te = useTranslations("explore");
  const [q, setQ] = useState("");
  const [lang, setLang] = useState("all");
  const [activeId, setActiveId] = useState<string | null>(null);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return stories.filter((s) => (lang === "all" || s.language === lang) && (!needle || `${s.headline} ${s.standfirst}`.toLowerCase().includes(needle)));
  }, [stories, q, lang]);
  const active = list.find((s) => s.id === activeId) ?? list[0] ?? null;

  return (
    <>
      <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-2xl border bg-card/70 p-2 shadow-xs backdrop-blur">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPlaceholder")} aria-label={t("searchPlaceholder")} className="border-transparent bg-transparent pl-9 shadow-none" />
        </div>
        <ToggleGroup type="single" variant="outline" size="sm" value={lang} onValueChange={(v) => v && setLang(v)} aria-label={te("language")}>
          <ToggleGroupItem value="all" className="px-3">
            {t("allLanguages")}
          </ToggleGroupItem>
          <ToggleGroupItem value="en" className="px-3">
            English
          </ToggleGroupItem>
          <ToggleGroupItem value="hi" className="px-3" lang="hi">
            हिंदी
          </ToggleGroupItem>
        </ToggleGroup>
        <p className="px-1 text-xs text-muted-foreground tabular-nums" aria-live="polite">
          {t("count", { count: list.length })}
        </p>
      </div>

      <FrameBody className="lg:grid-cols-12">
        {/* spotlight: the hovered / focused story (desktop) */}
        <div className="hidden min-h-0 lg:col-span-5 lg:flex">
          {active ? (
            <motion.article
              key={active.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className="flex min-h-0 w-full flex-col overflow-hidden rounded-2xl border bg-card shadow-xs"
              lang={active.language}
            >
              <div className="relative min-h-28 flex-1 overflow-hidden">
                <Thumb story={active} className="absolute inset-0 h-full w-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                <p className="absolute inset-x-4 bottom-3 text-lg leading-snug font-semibold text-balance text-white tall:text-2xl">{active.headline}</p>
              </div>
              <div className="min-h-0 shrink space-y-3 overflow-y-auto p-4">
                <div className="flex flex-wrap gap-1.5" lang="en">
                  <MetaChip icon={ShieldCheck} className="border-success/30 bg-success/10 text-success [&_svg]:text-success">
                    {t("badgeReviewed", { name: active.reviewer ?? "NCPOR" })}
                  </MetaChip>
                  <MetaChip icon={Clock}>{t("minutes", { count: active.minutes })}</MetaChip>
                  <MetaChip icon={FileSearch}>{t("sourceCount", { count: active.sources })}</MetaChip>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{active.standfirst}</p>
                {active.facts.length > 0 && (
                  <ul className="space-y-1.5 text-sm">
                    {active.facts.map((f) => (
                      <li key={f} className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-aurora" aria-hidden /> <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex shrink-0 items-center justify-between gap-3 border-t p-3" lang="en">
                <span className="text-xs text-muted-foreground">{formatDate(active.published_at)}</span>
                <Button asChild>
                  <Link href={`/stories/${active.slug}`}>
                    {t("read")} <ArrowRight />
                  </Link>
                </Button>
              </div>
            </motion.article>
          ) : (
            <div className="flex w-full items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground">{t("empty")}</div>
          )}
        </div>

        <Pane icon={Newspaper} title={t("all")} count={list.length} className="lg:col-span-7" bodyClassName="px-2">
          {list.length === 0 ? (
            <EmptyState icon={<SearchX className="size-5" />} title={t("noMatch")} />
          ) : (
            <ul>
              {list.map((s, i) => (
                <motion.li key={s.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Link
                    href={`/stories/${s.slug}`}
                    onMouseEnter={() => setActiveId(s.id)}
                    onFocus={() => setActiveId(s.id)}
                    className={cn("group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/60", active?.id === s.id && "lg:bg-primary/5")}
                    lang={s.language}
                  >
                    <Thumb story={s} className="h-16 w-24 shrink-0 rounded-lg border [&_.absolute]:hidden" />
                    <span className="grid min-w-0 flex-1 gap-0.5">
                      <span className="line-clamp-1 text-sm font-semibold tracking-tight group-hover:text-primary">{s.headline}</span>
                      <span className="line-clamp-1 text-xs text-muted-foreground">{s.standfirst}</span>
                      <span className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground" lang="en">
                        <span className="inline-flex items-center gap-1 text-success">
                          <ShieldCheck className="size-3" aria-hidden /> {t("badgeCited")}
                        </span>
                        <span>{s.language === "hi" ? "हिंदी" : "English"}</span>
                        <span>{formatDate(s.published_at)}</span>
                        <span>{t("minutes", { count: s.minutes })}</span>
                      </span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
                  </Link>
                </motion.li>
              ))}
            </ul>
          )}
        </Pane>
      </FrameBody>
    </>
  );
}
