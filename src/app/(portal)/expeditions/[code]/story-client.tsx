"use client";

import { useTranslations } from "next-intl";
import { motion, useScroll, useSpring } from "motion/react";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Thin aurora progress bar that tracks scrolling through the story. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed top-0 right-0 left-0 z-50 h-1 origin-left bg-gradient-to-r from-primary via-aurora to-primary"
    />
  );
}

export function ShareButton({ title }: { title: string }) {
  const t = useTranslations("common");
  const te = useTranslations("expeditions");
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // cancelled — fall back to copy
      }
    }
    await navigator.clipboard.writeText(url);
    toast.success(te("shareCopied"));
  };
  return (
    <Button size="sm" variant="secondary" onClick={share} className="h-7 rounded-full">
      <Share2 className="size-3.5" /> {t("share")}
    </Button>
  );
}
