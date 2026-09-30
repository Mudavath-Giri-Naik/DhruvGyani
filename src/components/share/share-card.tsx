"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, Download, ImageDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const SIZES = {
  square: { w: 1080, h: 1080, label: "Square · Instagram" },
  wide: { w: 1200, h: 630, label: "Wide · X, Facebook, LinkedIn" },
  story: { w: 1080, h: 1920, label: "Story" },
} as const;
type SizeKey = keyof typeof SIZES;

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else line = next;
  }
  if (lines.length < maxLines && line) lines.push(line);
  else if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, "") + "…";
  return lines;
}

/**
 * Social card maker: draws a branded, credited image for an item or a
 * published story in the sizes social channels use, entirely in the browser.
 * The photo credit is always drawn onto the card.
 */
export function ShareCard({
  title,
  text,
  image,
  credit,
  url,
  tags = [],
  kicker,
  lang,
}: {
  title: string;
  text: string;
  /** Same-origin image to use as the background; a gradient is drawn when absent. */
  image?: string | null;
  credit?: string | null;
  url: string;
  tags?: string[];
  kicker: string;
  lang?: string;
}) {
  const t = useTranslations("share");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState<SizeKey>("square");
  const [headline, setHeadline] = useState(title);
  const hashtags = tags.slice(0, 4).map((x) => `#${x.replace(/[^\p{L}\p{N}]+/gu, "")}`).filter((x) => x.length > 1);
  const [caption, setCaption] = useState([title, text, credit, url, hashtags.join(" ")].filter(Boolean).join("\n\n"));

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { w, h } = SIZES[size];
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const css = getComputedStyle(document.documentElement);
    const primary = css.getPropertyValue("--primary").trim() || "#1d6fb8";
    const aurora = css.getPropertyValue("--aurora").trim() || "#2dd4a7";
    const family = getComputedStyle(document.body).fontFamily || "sans-serif";
    const pad = Math.round(w * 0.07);

    // background: the photograph, cover-fitted, or a night-sky gradient
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#061226");
    bg.addColorStop(1, "#0d2a4a");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    if (image) {
      try {
        const img = new Image();
        img.src = image;
        await img.decode();
        const scale = Math.max(w / img.width, h / img.height);
        ctx.drawImage(img, (w - img.width * scale) / 2, (h - img.height * scale) / 2, img.width * scale, img.height * scale);
      } catch {
        // keep the gradient if the image cannot be loaded
      }
    } else {
      const glow = ctx.createRadialGradient(w * 0.8, h * 0.15, 0, w * 0.8, h * 0.15, w * 0.8);
      glow.addColorStop(0, primary);
      glow.addColorStop(1, "transparent");
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
    }
    const shade = ctx.createLinearGradient(0, h * 0.25, 0, h);
    shade.addColorStop(0, "rgba(3,10,22,0)");
    shade.addColorStop(0.55, "rgba(3,10,22,0.78)");
    shade.addColorStop(1, "rgba(3,10,22,0.94)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, w, h);

    // brand strip
    ctx.fillStyle = "rgba(3,10,22,0.6)";
    const tagH = Math.round(w * 0.05);
    ctx.font = `600 ${Math.round(w * 0.024)}px ${family}`;
    const brand = "DhruvGyani · NCPOR";
    const bw = ctx.measureText(brand).width + tagH;
    ctx.beginPath();
    ctx.roundRect(pad, pad, bw, tagH, tagH / 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.fillText(brand, pad + tagH / 2, pad + tagH / 2 + 1);

    // text block, laid out upwards from the bottom
    ctx.textBaseline = "alphabetic";
    let y = h - pad;
    if (credit) {
      ctx.font = `400 ${Math.round(w * 0.02)}px ${family}`;
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      const lines = wrap(ctx, credit, w - pad * 2, 2).reverse();
      for (const l of lines) {
        ctx.fillText(l, pad, y);
        y -= Math.round(w * 0.028);
      }
      y -= Math.round(w * 0.012);
    }
    const bar = ctx.createLinearGradient(pad, 0, pad + w * 0.18, 0);
    bar.addColorStop(0, primary);
    bar.addColorStop(1, aurora);
    ctx.fillStyle = bar;
    ctx.fillRect(pad, y - Math.round(w * 0.008), Math.round(w * 0.18), Math.round(w * 0.008));
    y -= Math.round(w * 0.045);

    const headSize = Math.round(w * (size === "wide" ? 0.05 : 0.064));
    ctx.font = `600 ${headSize}px ${family}`;
    ctx.fillStyle = "#ffffff";
    const head = wrap(ctx, headline, w - pad * 2, size === "story" ? 6 : 4).reverse();
    for (const l of head) {
      ctx.fillText(l, pad, y);
      y -= Math.round(headSize * 1.16);
    }
    ctx.font = `600 ${Math.round(w * 0.022)}px ${family}`;
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillText(kicker.toUpperCase(), pad, y - Math.round(w * 0.004));
  }, [size, headline, image, credit, kicker]);

  useEffect(() => {
    if (!open) return;
    // the canvas mounts with the dialog; draw on the next frame
    const id = requestAnimationFrame(() => void draw());
    return () => cancelAnimationFrame(id);
  }, [open, draw]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `dhruvgyani-${size}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) || "card"}.png`;
      a.click();
      URL.revokeObjectURL(href);
    }, "image/png");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ImageDown /> <span className="max-xl:sr-only">{t("button")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("body")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="flex items-center justify-center rounded-xl border bg-muted/40 p-3">
            <canvas ref={canvasRef} role="img" aria-label={t("preview", { title: headline })} className="max-h-[56svh] max-w-full rounded-lg shadow-lg" />
          </div>
          <div className="grid content-start gap-3">
            <div className="grid gap-1.5">
              <Label>{t("size")}</Label>
              <ToggleGroup type="single" variant="outline" size="sm" value={size} onValueChange={(v) => v && setSize(v as SizeKey)} className="flex-wrap justify-start">
                {(Object.keys(SIZES) as SizeKey[]).map((k) => (
                  <ToggleGroupItem key={k} value={k} className="px-2.5 text-xs" title={SIZES[k].label}>
                    {SIZES[k].w}×{SIZES[k].h}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <p className="text-[11px] text-muted-foreground">{SIZES[size].label}</p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="share-headline">{t("headline")}</Label>
              <Input id="share-headline" value={headline} onChange={(e) => setHeadline(e.target.value)} lang={lang} maxLength={140} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="share-caption">{t("caption")}</Label>
              <Textarea id="share-caption" rows={6} value={caption} onChange={(e) => setCaption(e.target.value)} lang={lang} className="text-xs" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={download} className="flex-1">
                <Download /> PNG
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  await navigator.clipboard.writeText(caption);
                  toast.success(t("copied"));
                }}
              >
                <Copy /> {t("copyCaption")}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">{t("creditNote")}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
