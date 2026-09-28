"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { GlossaryTerm } from "@/lib/types";

export function GlossaryList({ terms }: { terms: GlossaryTerm[] }) {
  const t = useTranslations("learn");
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return terms.filter((g) => !n || `${g.term} ${g.term_hi} ${g.meaning_en} ${g.meaning_hi}`.toLowerCase().includes(n));
  }, [q, terms]);
  const letters = [...new Set(terms.map((g) => g.term[0].toUpperCase()))];

  return (
    <div className="space-y-5">
      <div className="sticky top-16 z-10 space-y-3 rounded-2xl border bg-background/85 p-3 backdrop-blur">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchGlossary")} aria-label={t("searchGlossary")} className="pl-9" />
        </div>
        <nav aria-label="Letters" className="flex flex-wrap gap-1">
          {letters.map((l) => (
            <a key={l} href={`#letter-${l}`} className="flex size-7 items-center justify-center rounded-md text-xs font-medium hover:bg-accent">
              {l}
            </a>
          ))}
        </nav>
      </div>
      <dl className="grid gap-3 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {list.map((g, i) => {
            const firstOfLetter = i === 0 || list[i - 1].term[0].toUpperCase() !== g.term[0].toUpperCase();
            return (
              <motion.div
                layout
                key={g.id}
                id={g.term}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="scroll-mt-40 rounded-2xl border bg-card p-4 target:border-primary target:ring-2 target:ring-primary/20"
              >
                {firstOfLetter && <span id={`letter-${g.term[0].toUpperCase()}`} className="block scroll-mt-40" />}
                <dt className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-lg font-semibold">{g.term}</span>
                  <span className="text-muted-foreground" lang="hi">
                    {g.term_hi}
                  </span>
                </dt>
                <dd className="mt-2 space-y-1.5 text-sm">
                  <p lang="en">{g.meaning_en}</p>
                  <p className="text-muted-foreground" lang="hi">
                    {g.meaning_hi}
                  </p>
                  <Link href={`/explore?q=${encodeURIComponent(g.term)}`} className="inline-block pt-1 text-xs text-primary hover:underline">
                    Find in the archive →
                  </Link>
                </dd>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </dl>
    </div>
  );
}
