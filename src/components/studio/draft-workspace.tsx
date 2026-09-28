"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  Copy,
  Download,
  Hash,
  ImageIcon,
  Loader2,
  Pencil,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { CitedText } from "@/components/cited-text";
import type { Chunk, Generation, GenerationClaim } from "@/lib/types";
import { cn } from "@/lib/utils";

export const CHANNEL_LABEL: Record<string, string> = {
  website_article: "Website article",
  x: "X",
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
};

const strip = (s: string) => s.replace(/\s*\[\s*c\d+(?:\s*,\s*c\d+)*\s*\]/g, "").trim();

export function exportPlain(g: Generation) {
  const o = g.output;
  const sources = g.citations.map((c) => `[${c.marker.slice(1)}] ${c.item_title}${c.page_no ? `, p.${c.page_no}` : ""}`).join("\n");
  if (o.channel === "website_article") {
    return [o.headline, "", o.standfirst, "", ...o.body.map((p) => strip(p.text)), "", "Key facts:", ...o.key_facts.map((f) => `• ${strip(f.text)}`), "", "Sources:", sources].join("\n");
  }
  return `${strip(o.text)}${o.hashtags?.length ? `\n\n${o.hashtags.join(" ")}` : ""}`;
}

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

// ------------------------------------------------------------------------------------------ draft view

export function DraftView({ generation, active, onCite }: { generation: Generation; active: string | null; onCite: (m: string) => void }) {
  const o = generation.output;
  const lang = generation.language;
  if (o.channel === "website_article") {
    return (
      <article className="space-y-4" lang={lang}>
        <h3 className="text-xl font-semibold tracking-tight text-balance">{o.headline}</h3>
        <p className="text-muted-foreground">{o.standfirst}</p>
        {o.body.map((p, i) => (
          <p key={i} className="leading-relaxed">
            <CitedText text={p.text} citations={generation.citations} onCite={onCite} activeMarker={active} />
          </p>
        ))}
        {o.key_facts.length > 0 && (
          <div className="rounded-xl border bg-muted/40 p-4">
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">Key facts</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {o.key_facts.map((f, i) => (
                <li key={i} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-aurora" />
                  <span>
                    <CitedText text={f.text} citations={generation.citations} onCite={onCite} activeMarker={active} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>
    );
  }
  const plainLen = strip(o.text).length + (o.hashtags?.length ? o.hashtags.join(" ").length + 1 : 0);
  return (
    <div className="space-y-3" lang={lang}>
      <div className="rounded-2xl border bg-background p-4 shadow-sm">
        <p className="leading-relaxed whitespace-pre-line">
          <CitedText text={o.text} citations={generation.citations} onCite={onCite} activeMarker={active} />
        </p>
        {o.hashtags && o.hashtags.length > 0 && (
          <p className="mt-2 flex flex-wrap gap-1.5 text-sm text-primary">
            {o.hashtags.map((h) => (
              <span key={h}>{h.startsWith("#") ? h : `#${h}`}</span>
            ))}
          </p>
        )}
      </div>
      {o.channel === "x" && (
        <div className="flex items-center gap-3 text-xs">
          <Progress value={Math.min(100, (plainLen / 280) * 100)} className={cn("h-1.5 w-40", plainLen > 280 && "[&>div]:bg-destructive")} />
          <span className={cn("tabular-nums", plainLen > 280 ? "text-destructive" : "text-muted-foreground")}>{plainLen}/280 characters</span>
        </div>
      )}
      {o.channel === "instagram" && (o.alt_text || o.image_suggestion) && (
        <div className="grid gap-2 rounded-xl border bg-muted/40 p-3 text-sm">
          {o.image_suggestion && (
            <p className="flex gap-2">
              <ImageIcon className="mt-0.5 size-4 shrink-0 text-primary" /> <span>{o.image_suggestion}</span>
            </p>
          )}
          {o.alt_text && (
            <p className="flex gap-2 text-muted-foreground">
              <Hash className="mt-0.5 size-4 shrink-0" /> <span>Alt text: {o.alt_text}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------------------------------ sources

export function SourcePassages({ generation, chunks, active, onCite }: { generation: Generation; chunks: Chunk[]; active: string | null; onCite: (m: string) => void }) {
  const t = useTranslations("studio");
  const refs = useRef<Record<string, HTMLLIElement | null>>({});
  useEffect(() => {
    if (active) refs.current[active]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [active]);
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("sourcePassages")}</p>
      <ol className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
        {generation.citations.map((c) => {
          const chunk = chunks.find((x) => x.id === c.chunk_id);
          return (
            <li
              key={c.marker}
              ref={(el) => {
                refs.current[c.marker] = el;
              }}
            >
              <button
                type="button"
                onClick={() => onCite(c.marker)}
                className={cn(
                  "w-full rounded-xl border p-3 text-left text-sm transition-all",
                  active === c.marker ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "hover:border-primary/40",
                )}
              >
                <span className="flex items-center gap-2 text-xs font-medium">
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary/15 text-[10px] text-primary">{c.marker.slice(1)}</span>
                  <span className="truncate">{c.item_title}</span>
                  {c.page_no && <span className="text-muted-foreground">p.{c.page_no}</span>}
                </span>
                <span className="mt-1.5 block text-muted-foreground">{chunk?.content ?? c.quote}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ------------------------------------------------------------------------------------------ trust panel

const VERDICT = {
  supported: { icon: CheckCircle2, tone: "text-success", bg: "bg-success/10 border-success/30" },
  weak: { icon: CircleHelp, tone: "text-warning", bg: "bg-warning/10 border-warning/30" },
  unsupported: { icon: XCircle, tone: "text-destructive", bg: "bg-destructive/10 border-destructive/30" },
} as const;

export function TrustPanel({
  generation,
  claims,
  editable,
  onUpdated,
  onFocusClaim,
}: {
  generation: Generation;
  claims: GenerationClaim[];
  editable: boolean;
  onUpdated: (g: Generation, c: GenerationClaim[], chunks: Chunk[]) => void;
  onFocusClaim: (marker: string | null) => void;
}) {
  const t = useTranslations("studio");
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<number | "all" | null>(null);
  const counts = { supported: 0, weak: 0, unsupported: 0 } as Record<string, number>;
  for (const c of claims) counts[c.verdict]++;
  const flagged = claims.filter((c) => c.verdict === "unsupported" || c.number_misses.length > 0).length;

  const call = async (index: number | "all", edit?: { index: number; text: string }) => {
    setBusy(index);
    const res = await fetch("/api/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ generationId: generation.id, edit }) });
    const json = await res.json();
    setBusy(null);
    if (!res.ok) return toast.error(json.error ?? "Could not re-check");
    onUpdated(json.generation, json.claims, json.chunks);
    setEditing(null);
  };

  const markerOf = (c: GenerationClaim) => generation.citations.find((x) => x.chunk_id === c.chunk_id)?.marker ?? null;

  return (
    <section aria-labelledby={`trust-${generation.id}`} className="space-y-3 rounded-2xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={`trust-${generation.id}`} className="flex items-center gap-2 font-semibold">
          {flagged ? <ShieldAlert className="size-5 text-destructive" /> : <ShieldCheck className="size-5 text-success" />} {t("trust")}
        </h3>
        <div className="flex items-center gap-1.5 text-xs">
          <Badge variant="outline" className={VERDICT.supported.bg}>
            {counts.supported} {t("supported")}
          </Badge>
          <Badge variant="outline" className={VERDICT.weak.bg}>
            {counts.weak} {t("weak")}
          </Badge>
          <Badge variant="outline" className={VERDICT.unsupported.bg}>
            {counts.unsupported} {t("unsupported")}
          </Badge>
          {editable && (
            <Button size="icon-sm" variant="ghost" aria-label={t("recheck")} onClick={() => call("all")} disabled={busy !== null}>
              <RefreshCw className={cn("size-4", busy === "all" && "animate-spin")} />
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={flagged ? "blocked" : "ready"}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("flex items-start gap-2 rounded-lg border p-2.5 text-sm", flagged ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-success/30 bg-success/5 text-success")}
          role="status"
        >
          {flagged ? <AlertTriangle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}
          {flagged ? t("blocked", { count: flagged }) : t("ready")}
        </motion.div>
      </AnimatePresence>

      <ol className="space-y-2">
        {claims.map((c, i) => {
          const v = VERDICT[c.verdict];
          const bad = c.verdict === "unsupported" || c.number_misses.length > 0;
          return (
            <motion.li
              layout
              key={c.id}
              className={cn("rounded-xl border p-3 text-sm transition-colors", bad ? "border-destructive/40 bg-destructive/5" : "hover:bg-muted/40")}
              onMouseEnter={() => onFocusClaim(markerOf(c))}
              onMouseLeave={() => onFocusClaim(null)}
            >
              <div className="flex items-start gap-2">
                <v.icon className={cn("mt-0.5 size-4 shrink-0", v.tone)} aria-label={t(c.verdict)} />
                <div className="min-w-0 flex-1 space-y-1.5">
                  {editing === i ? (
                    <div className="space-y-2">
                      <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} lang={generation.language} autoFocus />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => call(i, { index: i, text: draft })} disabled={busy !== null}>
                          {busy === i && <Loader2 className="animate-spin" />} {t("recheck")}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p lang={generation.language}>{c.claim_text}</p>
                  )}
                  {c.number_misses.length > 0 && (
                    <p className="flex flex-wrap items-center gap-1 text-xs font-medium text-destructive">
                      <AlertTriangle className="size-3.5" /> {t("numbersMissing", { nums: c.number_misses.join(", ") })}
                    </p>
                  )}
                  {c.note && <p className="text-xs text-muted-foreground">{c.note}</p>}
                </div>
                {editable && editing !== i && (
                  <div className="flex shrink-0 gap-0.5">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={t("edit")}
                      onClick={() => {
                        setEditing(i);
                        setDraft(c.claim_text);
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button size="icon-sm" variant="ghost" aria-label={t("remove")} onClick={() => call(i, { index: i, text: "" })} disabled={busy !== null}>
                      {busy === i ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                    </Button>
                  </div>
                )}
              </div>
            </motion.li>
          );
        })}
      </ol>
      <p className="text-[11px] text-muted-foreground">Numbers and dates are checked by code against the cited passage (Devanagari digits, ordinals and separators normalised). Wording support is checked {generation.model?.includes("demo") || generation.model?.includes("offline") ? "offline" : "by the AI verifier"}.</p>
    </section>
  );
}

// ------------------------------------------------------------------------------------------ workspace

export function DraftWorkspace({
  generation: g0,
  claims: c0,
  chunks: ch0,
  editable,
  footer,
  onChange,
}: {
  generation: Generation;
  claims: GenerationClaim[];
  chunks: Chunk[];
  editable: boolean;
  footer?: (g: Generation, claims: GenerationClaim[]) => React.ReactNode;
  onChange?: (g: Generation, claims: GenerationClaim[]) => void;
}) {
  const t = useTranslations("studio");
  const tc = useTranslations("common");
  const [generation, setGeneration] = useState(g0);
  const [claims, setClaims] = useState(c0);
  const [chunks, setChunks] = useState(ch0);
  const [active, setActive] = useState<string | null>(null);
  const [prev, setPrev] = useState(g0);
  if (prev !== g0) {
    setPrev(g0);
    setGeneration(g0);
    setClaims(c0);
    setChunks(ch0);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-3 rounded-2xl border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="secondary">{CHANNEL_LABEL[generation.channel]}</Badge>
              <Badge variant="outline">{generation.language === "hi" ? "हिंदी" : "English"}</Badge>
              <Badge variant="outline" className="capitalize">
                {generation.audience}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {generation.status.replace("_", " ")}
              </Badge>
              {generation.model && <span className="text-muted-foreground">{generation.model}</span>}
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  await navigator.clipboard.writeText(exportPlain(generation));
                  toast.success(tc("copied"));
                }}
              >
                <Copy /> {tc("copy")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => download(`${generation.channel}-${generation.language}.txt`, exportPlain(generation), "text/plain")}>
                <Download /> .txt
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  download(
                    `${generation.channel}-${generation.language}.json`,
                    JSON.stringify({ channel: generation.channel, language: generation.language, audience: generation.audience, status: generation.status, output: generation.output, citations: generation.citations, prompt_version: generation.prompt_version, model: generation.model }, null, 2),
                    "application/json",
                  )
                }
              >
                <Download /> .json
              </Button>
            </div>
          </div>
          <DraftView generation={generation} active={active} onCite={setActive} />
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <SourcePassages generation={generation} chunks={chunks} active={active} onCite={setActive} />
        </div>
      </div>
      <TrustPanel
        generation={generation}
        claims={claims}
        editable={editable}
        onFocusClaim={setActive}
        onUpdated={(g, c, ch) => {
          setGeneration(g);
          setClaims(c);
          setChunks(ch);
          onChange?.(g, c);
          toast.success(t("recheck") + " ✓");
        }}
      />
      {footer?.(generation, claims)}
    </div>
  );
}
