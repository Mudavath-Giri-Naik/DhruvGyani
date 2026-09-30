"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState, useSyncExternalStore } from "react";
import { motion } from "motion/react";
import { BookA, Check, ChevronLeft, ChevronRight, Copy, MessageCircleQuestion, Search, SearchX, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Frame, FrameBody, FrameHeader, MetaChip, Pane } from "@/components/frame";
import type { GlossaryTerm } from "@/lib/types";
import { cn } from "@/lib/utils";

// `#term` in the URL selects that term (glossary hover cards link here)
const subscribeHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
const readHash = () => {
  try {
    return decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return "";
  }
};

function speak(text: string, lang: string) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export function GlossaryList({ terms, description }: { terms: GlossaryTerm[]; description: string }) {
  const t = useTranslations("learn");
  const tu = useTranslations("ui");
  const tc = useTranslations("common");
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const hash = useSyncExternalStore(subscribeHash, readHash, () => "");

  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return terms.filter((g) => !n || `${g.term} ${g.term_hi} ${g.meaning_en} ${g.meaning_hi}`.toLowerCase().includes(n));
  }, [q, terms]);
  const letters = [...new Set(terms.map((g) => g.term[0].toUpperCase()))];
  const available = new Set(list.map((g) => g.term[0].toUpperCase()));

  const index = Math.max(
    0,
    list.findIndex((g) => (picked ? g.id === picked : g.term.toLowerCase() === hash.toLowerCase())),
  );
  const active = list[index] ?? null;
  const step = (d: number) => list.length && setPicked(list[(index + d + list.length) % list.length].id);

  return (
    <Frame>
      <FrameHeader icon={BookA} title={t("glossary")} description={description} actions={<MetaChip icon={BookA}>{tu("allTerms", { count: terms.length })}</MetaChip>} />
      <FrameBody className="lg:grid-cols-12">
        <Pane label={t("glossary")} scroll={false} className="lg:col-span-5">
          <div className="shrink-0 space-y-2 border-b p-3">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchGlossary")} aria-label={t("searchGlossary")} className="pl-9" />
            </div>
            <nav aria-label={tu("letters")} className="flex flex-wrap gap-1">
              {letters.map((l) => (
                <button
                  key={l}
                  type="button"
                  disabled={!available.has(l)}
                  onClick={() => document.getElementById(`letter-${l}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="flex size-6 items-center justify-center rounded-md text-xs font-medium transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-35"
                >
                  {l}
                </button>
              ))}
            </nav>
          </div>
          <ScrollArea className="min-h-0 flex-1 [&>[data-slot=scroll-area-viewport]>div]:block!">
            {list.length === 0 ? (
              <p className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
                <SearchX className="size-4" aria-hidden /> {t("noTerms")}
              </p>
            ) : (
              <ul className="p-2">
                {list.map((g, i) => {
                  const letter = g.term[0].toUpperCase();
                  const firstOfLetter = i === 0 || list[i - 1].term[0].toUpperCase() !== letter;
                  const on = active?.id === g.id;
                  return (
                    <li key={g.id} id={firstOfLetter ? `letter-${letter}` : undefined} className="scroll-mt-2">
                      {firstOfLetter && <p className="px-2 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-primary uppercase">{letter}</p>}
                      <button
                          type="button"
                          aria-pressed={on}
                          onClick={() => setPicked(g.id)}
                          className={cn("flex w-full items-baseline gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/60", on && "lg:bg-primary/10 lg:text-primary")}
                        >
                          <span className="text-sm font-medium">{g.term}</span>
                          <span className="truncate text-xs text-muted-foreground" lang="hi">
                            {g.term_hi}
                          </span>
                      </button>
                      {/* phones have no detail pane, so the meaning sits under the term */}
                      <div className="space-y-1 px-2 pb-2 text-sm lg:hidden">
                        <p lang="en">{g.meaning_en}</p>
                        <p className="text-muted-foreground" lang="hi">
                          {g.meaning_hi}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </ScrollArea>
        </Pane>

        {/* selected term (desktop) */}
        <div className="hidden min-h-0 lg:col-span-7 lg:flex">
          {active ? (
            <motion.article
              key={active.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="relative flex min-h-0 w-full flex-col overflow-hidden rounded-2xl border bg-card shadow-xs"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-aurora/10" />
              <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_65%)]" />
              <div className="relative min-h-0 flex-1 space-y-5 overflow-y-auto p-6 tall:p-10">
                <div>
                  <p className="text-[11px] font-semibold tracking-wider text-primary uppercase">
                    {index + 1} / {list.length}
                  </p>
                  <h2 className="mt-1 text-3xl font-semibold tracking-tight tall:text-5xl">{active.term}</h2>
                  <p className="mt-1 text-xl text-muted-foreground tall:text-2xl" lang="hi">
                    {active.term_hi}
                  </p>
                </div>
                <div className="grid gap-3 xl:grid-cols-2">
                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">English</p>
                      <Button size="icon-xs" variant="ghost" aria-label={t("listenEn")} onClick={() => speak(`${active.term}. ${active.meaning_en}`, "en-IN")}>
                        <Volume2 />
                      </Button>
                    </div>
                    <p className="mt-1 text-base leading-relaxed" lang="en">
                      {active.meaning_en}
                    </p>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase" lang="hi">
                        हिंदी
                      </p>
                      <Button size="icon-xs" variant="ghost" aria-label={t("listenHi")} onClick={() => speak(`${active.term_hi}. ${active.meaning_hi}`, "hi-IN")}>
                        <Volume2 />
                      </Button>
                    </div>
                    <p className="mt-1 text-base leading-relaxed" lang="hi">
                      {active.meaning_hi}
                    </p>
                    <p className="mt-2 text-[11px] text-muted-foreground">{t("hindiReview")}</p>
                  </div>
                </div>
              </div>
              <div className="relative flex shrink-0 flex-wrap items-center gap-2 border-t bg-card/80 p-3 backdrop-blur">
                <Button size="icon-sm" variant="outline" onClick={() => step(-1)} aria-label={t("prevTerm")}>
                  <ChevronLeft />
                </Button>
                <Button size="icon-sm" variant="outline" onClick={() => step(1)} aria-label={t("nextTerm")}>
                  <ChevronRight />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    await navigator.clipboard.writeText(`${active.term} (${active.term_hi}): ${active.meaning_en}`);
                    setCopied(true);
                    toast.success(tc("copied"));
                    setTimeout(() => setCopied(false), 1500);
                  }}
                >
                  {copied ? <Check className="text-success" /> : <Copy />} {tc("copy")}
                </Button>
                <span className="ml-auto flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/ask?q=${encodeURIComponent(t("askTerm", { term: active.term }))}`}>
                      <MessageCircleQuestion /> {t("askQuestion")}
                    </Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href={`/explore?q=${encodeURIComponent(active.term)}`}>
                      <Search /> {t("findTerm")}
                    </Link>
                  </Button>
                </span>
              </div>
            </motion.article>
          ) : (
            <div className="flex w-full items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground">{t("noTerms")}</div>
          )}
        </div>
      </FrameBody>
    </Frame>
  );
}
