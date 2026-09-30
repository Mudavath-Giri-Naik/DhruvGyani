"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ChevronLeft, ChevronRight, Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PolarArt } from "@/components/polar-art";
import type { QuizQuestion } from "@/lib/types";
import { cn } from "@/lib/utils";
import { QuizCard } from "./quiz-card";

interface Quiz {
  itemId: string;
  title: string;
  questions: QuizQuestion[];
  source: string;
}

export interface Lesson {
  title: string;
  paragraphs: string[];
  /** A bundled photograph with its credit, or an illustration variant (`art:…`). */
  image: string;
  credit?: { text: string; href: string };
  more: { label: string; href: string };
}

/** The primer as a short course: one lesson on screen, previous / next to move through them. */
export function Lessons({ lessons }: { lessons: Lesson[] }) {
  const t = useTranslations("learn");
  const [i, setI] = useState(0);
  const n = lessons.length;
  const lesson = lessons[i];
  const go = (d: number) => setI((x) => Math.min(n - 1, Math.max(0, x + d)));

  // left / right arrow keys turn the page, unless the reader is typing or answering a quiz
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.closest("input, textarea, select, button, [role=dialog]")) return;
      if (e.key === "ArrowRight") setI((x) => Math.min(n - 1, x + 1));
      if (e.key === "ArrowLeft") setI((x) => Math.max(0, x - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [n]);

  return (
    <section aria-labelledby="lesson-h" className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border bg-card shadow-xs">
      <div className="relative min-h-32 flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="absolute inset-0">
            {lesson.image.startsWith("art:") ? (
              <PolarArt variant={lesson.image.slice(4)} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- bundled photograph; its credit is shown below
              <img src={lesson.image} alt="" className="h-full w-full object-cover" />
            )}
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-x-4 bottom-3 text-white">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-white/80 uppercase">
            <Snowflake className="size-3.5" aria-hidden /> {t("lessonOf", { n: i + 1, total: n })}
          </p>
          <h2 id="lesson-h" className="text-xl font-semibold tracking-tight tall:text-2xl" aria-live="polite">
            {lesson.title}
          </h2>
        </div>
      </div>

      <div className="min-h-0 shrink space-y-2.5 overflow-y-auto p-4 text-sm leading-relaxed">
        {lesson.paragraphs.map((p, k) => (
          <p key={k} className={cn(k > 0 && "text-muted-foreground")}>
            {p}
          </p>
        ))}
        <p className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 pt-1">
          <Link href={lesson.more.href} className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline">
            {lesson.more.label} <ArrowRight className="size-3.5" aria-hidden />
          </Link>
          {lesson.credit && (
            <Link href={lesson.credit.href} className="text-[11px] text-muted-foreground underline-offset-2 hover:underline">
              {lesson.credit.text}
            </Link>
          )}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3 border-t p-3">
        <Button variant="outline" onClick={() => go(-1)} disabled={i === 0}>
          <ChevronLeft /> {t("previous")}
        </Button>
        <div className="flex flex-1 items-center justify-center gap-1.5">
          {lessons.map((l, k) => (
            <button key={l.title} type="button" onClick={() => setI(k)} aria-label={t("goToLesson", { n: k + 1, title: l.title })} aria-current={k === i ? "step" : undefined} className="group flex size-5 items-center justify-center">
              <span className={cn("rounded-full transition-all", k === i ? "h-2 w-5 bg-primary" : "size-2 bg-muted-foreground/40 group-hover:bg-foreground")} />
            </button>
          ))}
        </div>
        <Button onClick={() => go(1)} disabled={i === n - 1}>
          {t("next")} <ChevronRight />
        </Button>
      </div>
    </section>
  );
}

/** One quiz at a time, with numbered pills and previous / next. */
export function QuizDeck({ quizzes, signedIn }: { quizzes: Quiz[]; signedIn: boolean }) {
  const t = useTranslations("learn");
  const [i, setI] = useState(0);
  const quiz = quizzes[i];
  if (!quiz) return <p className="px-4 pb-4 text-sm text-muted-foreground">{t("noQuizzes")}</p>;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div role="group" aria-label={t("quizzes")} className="flex shrink-0 items-center gap-1.5 px-4 pb-2">
        <Button size="icon-sm" variant="outline" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0} aria-label={t("previous")}>
          <ChevronLeft />
        </Button>
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
        <Button size="icon-sm" variant="outline" onClick={() => setI((x) => Math.min(quizzes.length - 1, x + 1))} disabled={i === quizzes.length - 1} aria-label={t("next")}>
          <ChevronRight />
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1 [&>[data-slot=scroll-area-viewport]>div]:block!">
        <div className="px-4 pb-4">
          <QuizCard key={quiz.itemId} {...quiz} signedIn={signedIn} />
        </div>
      </ScrollArea>
    </div>
  );
}
