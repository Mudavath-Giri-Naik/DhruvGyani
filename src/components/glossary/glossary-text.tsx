"use client";

import { Fragment, useMemo } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import type { GlossaryTerm } from "@/lib/types";

/**
 * Auto-detects glossary terms in text and adds bilingual hover/focus cards.
 * Each term is marked once per block to avoid visual noise.
 */
export function GlossaryText({ text, terms, lang = "en" }: { text: string; terms: GlossaryTerm[]; lang?: string }) {
  const { re, lookup } = useMemo(() => {
    const lookup = new Map<string, GlossaryTerm>();
    const words: string[] = [];
    for (const g of terms) {
      lookup.set(g.term.toLowerCase(), g);
      words.push(g.term);
      if (g.term_hi) {
        lookup.set(g.term_hi, g);
        words.push(g.term_hi);
      }
    }
    words.sort((a, b) => b.length - a.length);
    const esc = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    // Latin terms need word boundaries; Devanagari terms match as-is.
    const re = esc.length ? new RegExp(`(${esc.map((w) => (/^[\x00-\x7F]+$/.test(w) ? `\\b${w}s?\\b` : w)).join("|")})`, "gi") : null;
    return { re, lookup };
  }, [terms]);

  if (!re) return <>{text}</>;
  const seen = new Set<string>();
  const parts = text.split(re);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
        const g = lookup.get(part.toLowerCase()) ?? lookup.get(part.toLowerCase().replace(/s$/, "")) ?? lookup.get(part);
        if (!g || seen.has(g.id)) return <Fragment key={i}>{part}</Fragment>;
        seen.add(g.id);
        return (
          <HoverCard key={i} openDelay={150} closeDelay={80}>
            <HoverCardTrigger asChild>
              <span
                tabIndex={0}
                className="cursor-help rounded-sm underline decoration-aurora decoration-dotted decoration-2 underline-offset-4 outline-none focus-visible:bg-aurora/15"
              >
                {part}
              </span>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 text-sm" side="top">
              <p className="font-semibold">
                {g.term} <span className="font-normal text-muted-foreground" lang="hi">· {g.term_hi}</span>
              </p>
              <p className="mt-1.5 text-muted-foreground" lang="en">
                {g.meaning_en}
              </p>
              <p className="mt-1.5 text-muted-foreground" lang="hi">
                {g.meaning_hi}
              </p>
              {lang === "hi" && <p className="mt-2 text-[10px] text-muted-foreground">Hindi meaning: draft, awaiting expert review</p>}
            </HoverCardContent>
          </HoverCard>
        );
      })}
    </>
  );
}
