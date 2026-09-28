"use client";

import { Fragment } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Citation } from "@/lib/types";

/**
 * Renders plain text with [c1]-style markers turned into accessible
 * superscript citation chips. Never renders HTML from model output.
 */
export function CitedText({ text, citations, onCite, activeMarker }: { text: string; citations: Citation[]; onCite?: (marker: string) => void; activeMarker?: string | null }) {
  const parts = text.split(/(\[\s*c\d+(?:\s*,\s*c\d+)*\s*\])/g);
  return (
    <>
      {parts.map((p, i) => {
        const m = p.match(/^\[\s*(c\d+(?:\s*,\s*c\d+)*)\s*\]$/);
        if (!m) return <Fragment key={i}>{p}</Fragment>;
        return (
          <sup key={i} className="mx-0.5 inline-flex gap-0.5 align-super">
            {m[1].split(/\s*,\s*/).map((marker) => {
              const c = citations.find((x) => x.marker === marker);
              const n = marker.slice(1);
              return (
                <Tooltip key={marker}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onCite?.(marker)}
                      aria-label={`Source ${n}${c ? `: ${c.item_title}${c.page_no ? `, page ${c.page_no}` : ""}` : ""}`}
                      className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold transition-colors ${
                        activeMarker === marker ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary hover:bg-primary/25"
                      }`}
                    >
                      {n}
                    </button>
                  </TooltipTrigger>
                  {c && (
                    <TooltipContent className="max-w-xs">
                      <p className="font-medium">
                        {c.item_title}
                        {c.page_no ? ` · p.${c.page_no}` : ""}
                      </p>
                      <p className="mt-1 opacity-80">“{c.quote}…”</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </sup>
        );
      })}
    </>
  );
}
