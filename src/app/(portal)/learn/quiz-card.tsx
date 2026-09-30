"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2, RotateCcw, Trophy, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { QuizQuestion } from "@/lib/types";
import { cn } from "@/lib/utils";

export function QuizCard({ itemId, title, questions, source, signedIn }: { itemId: string; title: string; questions: QuizQuestion[]; source: string; signedIn: boolean }) {
  const t = useTranslations("learn");
  const [answers, setAnswers] = useState<(number | null)[]>(questions.map(() => null));
  const [checked, setChecked] = useState(false);
  const score = answers.filter((a, i) => a === questions[i].answer).length;

  const check = async () => {
    setChecked(true);
    if (signedIn) {
      await fetch("/api/quiz", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ itemId, score }) }).catch(() => {});
    }
  };

  return (
    <div className="flex flex-col">
      <p className="text-xs text-muted-foreground">
        {t("source")}:{" "}
        <Link href={`/items/${itemId}`} className="text-primary hover:underline">
          {title}
        </Link>{" "}
        ({source})
      </p>
      <ol className="mt-4 flex-1 space-y-4">
        {questions.map((q, qi) => (
          <li key={qi}>
            <fieldset>
              <legend className="text-sm font-medium">
                {qi + 1}. {q.q}
              </legend>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {q.options.map((opt, oi) => {
                  const picked = answers[qi] === oi;
                  const right = checked && oi === q.answer;
                  const wrong = checked && picked && oi !== q.answer;
                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={checked}
                      aria-pressed={picked}
                      onClick={() => setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))}
                      className={cn(
                        "rounded-lg border py-2 text-sm font-semibold tabular-nums transition-all",
                        picked && !checked && "border-primary bg-primary/10 text-primary",
                        right && "border-success bg-success/15 text-success",
                        wrong && "border-destructive bg-destructive/10 text-destructive",
                        !checked && "hover:border-primary/50",
                      )}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </li>
        ))}
      </ol>
      {checked ? (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex items-center justify-between rounded-xl bg-muted/50 p-3" role="status">
          <span className="flex items-center gap-2 font-medium">
            {score === questions.length ? <Trophy className="size-5 text-warning" /> : score > 0 ? <CheckCircle2 className="size-5 text-success" /> : <XCircle className="size-5 text-destructive" />}
            {t("score", { score, total: questions.length })}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setChecked(false);
              setAnswers(questions.map(() => null));
            }}
          >
            <RotateCcw /> {t("tryAgain")}
          </Button>
        </motion.div>
      ) : (
        <Button className="mt-4" onClick={check} disabled={answers.some((a) => a === null)}>
          {t("check")}
        </Button>
      )}
    </div>
  );
}
