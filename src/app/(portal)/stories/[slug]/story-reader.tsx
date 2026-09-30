"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import { Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/components/a11y/local-store";

/** Article pane: scrolls inside the card on desktop, with an aurora progress bar tracking the read position. */
export function StoryReader({ header, children }: { header: React.ReactNode; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: ref });
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border bg-card shadow-xs">
      <motion.div aria-hidden style={{ scaleX }} className="absolute inset-x-0 top-0 z-10 hidden h-1 origin-left bg-gradient-to-r from-primary via-aurora to-primary fit:block" />
      <div ref={ref} tabIndex={0} className="min-h-0 flex-1 outline-none fit:overflow-y-auto">
        <div className="mx-auto max-w-3xl px-5 py-6 md:px-8 tall:py-10">
          {header}
          {children}
        </div>
      </div>
    </div>
  );
}

/** Reads the story aloud with the browser's speech engine. Nothing leaves the device. */
export function ListenButton({ text, lang }: { text: string; lang: string }) {
  const t = useTranslations("stories");
  const mounted = useMounted();
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  if (!mounted || typeof window === "undefined" || !("speechSynthesis" in window)) return null;

  const toggle = () => {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "hi" ? "hi-IN" : "en-IN";
    u.rate = 0.95;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    synth.cancel();
    synth.speak(u);
    setSpeaking(true);
  };

  return (
    <Button size="sm" variant="secondary" onClick={toggle} className="h-7 rounded-full" aria-pressed={speaking}>
      {speaking ? <Square className="size-3.5" /> : <Volume2 className="size-3.5" />} {speaking ? t("stop") : t("listen")}
    </Button>
  );
}
