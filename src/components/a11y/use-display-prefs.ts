"use client";

import { useCallback } from "react";
import { useLocalValue, writeLocal } from "./local-store";

export type TextSize = "sm" | "md" | "lg" | "xl";
const ORDER: TextSize[] = ["sm", "md", "lg", "xl"];

/** Text size (A- A A+) and high-contrast mode, persisted per browser. */
export function useDisplayPrefs() {
  const size = (useLocalValue("dg-text-size") as TextSize | null) ?? "md";
  const contrast = useLocalValue("dg-hc") === "1";

  const applySize = useCallback((s: TextSize) => {
    const d = document.documentElement;
    if (s === "md") delete d.dataset.textSize;
    else d.dataset.textSize = s;
    writeLocal("dg-text-size", s === "md" ? null : s);
  }, []);

  const step = useCallback(
    (dir: -1 | 0 | 1) => applySize(dir === 0 ? "md" : ORDER[Math.min(ORDER.length - 1, Math.max(0, ORDER.indexOf(size) + dir))]),
    [applySize, size],
  );

  const toggleContrast = useCallback(() => {
    const next = !contrast;
    document.documentElement.classList.toggle("hc", next);
    writeLocal("dg-hc", next ? "1" : null);
  }, [contrast]);

  return { size, step, contrast, toggleContrast };
}
