"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, RotateCw, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { GlossaryTerm, QuizQuestion } from "@/lib/types";
import { cn } from "@/lib/utils";
import { QuizCard } from "./quiz-card";

interface Quiz {
  itemId: string;
  title: string;
  questions: QuizQuestion[];
  source: string;
}

/** One quiz at a time; the numbered pills switch between them. */
export function QuizDeck({ quizzes, signedIn }: { quizzes: Quiz[]; signedIn: boolean }) {
  const t = useTranslations("learn");
  const [i, setI] = useState(0);
  const quiz = quizzes[i];
  if (!quiz) return <p className="px-4 pb-4 text-sm text-muted-foreground">{t("noQuizzes")}</p>;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div role="group" aria-label={t("quizzes")} className="flex shrink-0 gap-1.5 px-4 pb-2">
        {quizzes.map((q, n) => (
          <button
            key={q.itemId}
            type="button"
            aria-pressed={n === i}
            title={q.title}
            onClick={() => setI(n)}
            className={cn(
              "min-w-0 flex-1 truncate rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
              n === i ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {t("quizN", { n: n + 1 })}
          </button>
        ))}
      </div>
      <ScrollArea className="min-h-0 flex-1 [&>[data-slot=scroll-area-viewport]>div]:block!">
        <div className="px-4 pb-4">
          <QuizCard key={quiz.itemId} {...quiz} signedIn={signedIn} />
        </div>
      </ScrollArea>
    </div>
  );
}

/** Bilingual glossary flashcards: tap to flip between the term and its meaning. */
export function Flashcards({ terms }: { terms: GlossaryTerm[] }) {
  const t = useTranslations("learn");
  const [order, setOrder] = useState(() => terms.map((_, n) => n));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const term = terms[order[pos]];
  if (!term) return null;
  const go = (d: number) => {
    setFlipped(false);
    setPos((p) => (p + d + order.length) % order.length);
  };
  const shuffle = () => {
    const next = [...order];
    for (let n = next.length - 1; n > 0; n--) {
      const k = Math.floor(Math.random() * (n + 1));
      [next[n], next[k]] = [next[k], next[n]];
    }
    setOrder(next);
    setPos(0);
    setFlipped(false);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4">
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-label={flipped ? t("showTerm") : t("showMeaning")}
        className="group relative min-h-36 flex-1 overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-aurora/10 p-4 text-left transition-shadow hover:shadow-md"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={`${term.id}-${flipped}`} initial={{ opacity: 0, rotateX: -35 }} animate={{ opacity: 1, rotateX: 0 }} exit={{ opacity: 0, rotateX: 35 }} transition={{ duration: 0.18 }} className="flex h-full flex-col justify-center">
            {flipped ? (
              <>
                <p className="text-sm leading-relaxed" lang="en">
                  {term.meaning_en}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground" lang="hi">
                  {term.meaning_hi}
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-semibold tracking-tight">{term.term}</p>
                <p className="mt-1 text-lg text-muted-foreground" lang="hi">
                  {term.term_hi}
                </p>
              </>
            )}
          </motion.div>
        </AnimatePresence>
        <span className="absolute right-3 bottom-3 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <RotateCw className="size-3 transition-transform group-hover:rotate-90" aria-hidden /> {flipped ? t("showTerm") : t("showMeaning")}
        </span>
      </button>
      <div className="flex shrink-0 items-center gap-2">
        <Button size="icon-sm" variant="outline" onClick={() => go(-1)} aria-label={t("prevCard")}>
          <ChevronLeft />
        </Button>
        <Button size="icon-sm" variant="outline" onClick={() => go(1)} aria-label={t("nextCard")}>
          <ChevronRight />
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
          {pos + 1} / {order.length}
        </span>
        <Button size="icon-sm" variant="ghost" onClick={shuffle} aria-label={t("shuffle")} className="ml-auto">
          <Shuffle />
        </Button>
        <Link href={`/learn/glossary#${encodeURIComponent(term.term)}`} className="text-xs font-medium text-primary underline-offset-4 hover:underline">
          {t("openTerm")}
        </Link>
      </div>
    </div>
  );
}
