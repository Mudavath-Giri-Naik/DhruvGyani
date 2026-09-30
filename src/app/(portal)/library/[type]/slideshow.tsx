"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Item } from "@/lib/types";

/** Full-screen slideshow of the photographs in the current list, each with its caption and credit. */
export function Slideshow({ items }: { items: Item[] }) {
  const t = useTranslations("library");
  const photos = items.filter((i) => i.media_url && /\.(png|jpe?g|webp|gif)(\?|$)/i.test(i.media_url));
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const n = photos.length;
  const i = n ? index % n : 0;

  useEffect(() => {
    if (!open || !playing || n < 2) return;
    const id = setInterval(() => setIndex((x) => x + 1), 5000);
    return () => clearInterval(id);
  }, [open, playing, n]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIndex((x) => x + 1);
      if (e.key === "ArrowLeft") setIndex((x) => x + n - 1);
      if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, n]);

  if (!n) return null;
  const photo = photos[i];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Presentation /> {t("slideshow")}
        </Button>
      </DialogTrigger>
      <DialogContent className="dark h-[92svh] max-w-[96vw] gap-0 overflow-hidden border-0 bg-black p-0 text-white sm:max-w-[96vw]">
        <DialogTitle className="sr-only">{t("slideshow")}</DialogTitle>
        <DialogDescription className="sr-only">{t("slideshowHelp")}</DialogDescription>
        <div className="relative h-full w-full">
          {/* eslint-disable-next-line @next/next/no-img-element -- bundled photograph or storage upload */}
          <img key={photo.id} src={photo.media_url!} alt={photo.alt_text ?? ""} className="h-full w-full animate-in object-contain duration-700 fade-in motion-safe:zoom-in-95" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-5 pt-16">
            <p className="text-lg font-semibold tracking-tight md:text-xl" lang={photo.language}>
              {photo.title}
            </p>
            <p className="mt-1 max-w-4xl text-sm text-white/80" lang={photo.language}>
              {photo.description}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button size="icon-sm" variant="secondary" onClick={() => setIndex((x) => x + n - 1)} aria-label={t("prevPhoto")}>
                <ChevronLeft />
              </Button>
              <Button size="icon-sm" variant="secondary" onClick={() => setPlaying((p) => !p)} aria-label={playing ? t("pauseShow") : t("playShow")} aria-pressed={playing}>
                {playing ? <Pause /> : <Play />}
              </Button>
              <Button size="icon-sm" variant="secondary" onClick={() => setIndex((x) => x + 1)} aria-label={t("nextPhoto")}>
                <ChevronRight />
              </Button>
              <span className="text-xs text-white/70 tabular-nums" aria-live="polite">
                {i + 1} / {n}
              </span>
              <Button asChild size="sm" variant="secondary" className="ml-auto">
                <Link href={`/items/${photo.id}`}>{t("openItem")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
