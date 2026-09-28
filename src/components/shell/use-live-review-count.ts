"use client";

import { useEffect, useState } from "react";

/**
 * Live Review Queue badge. With Supabase: Realtime postgres_changes on
 * `generations`. In demo mode: light polling of the same count endpoint.
 */
export function useLiveReviewCount(initial: number, realtime: boolean, enabled = true) {
  const [count, setCount] = useState(initial);
  const [prevInitial, setPrevInitial] = useState(initial);
  if (prevInitial !== initial) {
    // server re-render delivered a fresh count
    setPrevInitial(initial);
    setCount(initial);
  }

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const refresh = async () => {
      try {
        const res = await fetch("/api/review/count", { cache: "no-store" });
        if (res.ok && !cancelled) setCount((await res.json()).count ?? 0);
      } catch {
        // offline: keep the last value
      }
    };
    if (realtime) {
      let cleanup = () => {};
      import("@/lib/supabase/client").then(({ createClient }) => {
        if (cancelled) return;
        const supabase = createClient();
        const channel = supabase
          .channel("review-queue")
          .on("postgres_changes", { event: "*", schema: "public", table: "generations" }, refresh)
          .subscribe();
        cleanup = () => void supabase.removeChannel(channel);
      });
      return () => {
        cancelled = true;
        cleanup();
      };
    }
    const id = setInterval(refresh, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [realtime, enabled]);

  return count;
}
