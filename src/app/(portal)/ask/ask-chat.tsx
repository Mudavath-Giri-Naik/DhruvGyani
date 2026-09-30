"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, Bot, Copy, Database, FileSearch, History, Lightbulb, MessageCircleQuestion, RotateCcw, SearchX, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLocalValue, writeLocal } from "@/components/a11y/local-store";
import { CitedText } from "@/components/cited-text";
import { Frame, FrameBody, FrameHeader, Pane } from "@/components/frame";
import { Logo } from "@/components/shell/logo";
import type { Citation } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Msg {
  id: number;
  role: "user" | "assistant";
  text: string;
  found?: boolean;
  citations?: (Citation & { href: string })[];
  mode?: "ai" | "offline";
  lang?: string;
}

const RECENT_KEY = "dg-recent-questions";
const MAX = 300;
const strip = (s: string) => s.replace(/\s*\[\s*c\d+(?:\s*,\s*c\d+)*\s*\]/g, "").trim();

function parseRecent(raw: string | null): string[] {
  try {
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 5) : [];
  } catch {
    return [];
  }
}

export function AskChat({ initial }: { initial: string }) {
  const t = useTranslations("ask");
  const tu = useTranslations("ui");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const asked = useRef(false);
  const recent = parseRecent(useLocalValue(RECENT_KEY));

  const send = async (question: string) => {
    const q = question.trim();
    if (q.length < 3 || busy) return;
    const lang = /[ऀ-ॿ]/.test(q) || locale === "hi" ? "hi" : "en";
    setMsgs((m) => [...m, { id: Date.now(), role: "user", text: q, lang }]);
    setInput("");
    setBusy(true);
    writeLocal(RECENT_KEY, JSON.stringify([q, ...parseRecent(localStorage.getItem(RECENT_KEY)).filter((x) => x !== q)].slice(0, 5)));
    try {
      const res = await fetch("/api/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: q, lang }) });
      const json = await res.json();
      setMsgs((m) => [
        ...m,
        res.ok
          ? { id: Date.now() + 1, role: "assistant", text: json.answer, found: json.found, citations: json.citations, mode: json.mode, lang }
          : { id: Date.now() + 1, role: "assistant", text: json.error ?? "Error", found: false, lang },
      ]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (initial && !asked.current) {
      asked.current = true;
      const id = setTimeout(() => void send(initial), 0);
      return () => clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once for ?q=
  }, [initial]);

  useEffect(() => {
    if (msgs.length || busy) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, busy]);

  const suggestions = [t("s1"), t("s2"), t("s3")];
  const steps = [
    { icon: FileSearch, text: t("how1") },
    { icon: ShieldCheck, text: t("how2") },
    { icon: SearchX, text: t("how3") },
  ];

  return (
    <Frame>
      <FrameHeader
        icon={MessageCircleQuestion}
        title={t("title")}
        description={t("subtitle")}
        actions={
          msgs.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setMsgs([])} disabled={busy}>
              <RotateCcw /> {t("newChat")}
            </Button>
          )
        }
      />
      <FrameBody className="lg:grid-cols-12">
        {/* conversation */}
        <div className="flex min-h-[60vh] flex-col overflow-hidden rounded-2xl border bg-card shadow-xs lg:col-span-8 fit:min-h-0">
          <div tabIndex={0} className="min-h-0 flex-1 space-y-5 p-4 outline-none md:p-5 fit:overflow-y-auto" role="log" aria-live="polite" aria-busy={busy} aria-label={t("conversation")}>
            {msgs.length === 0 && !busy && (
              <div className="flex h-full flex-col items-center justify-center py-8 text-center">
                <span className="relative flex">
                  <span className="absolute inset-0 rounded-full bg-aurora/30 blur-2xl [.hc_&]:hidden" />
                  <Logo className="relative size-14" />
                </span>
                <p className="mt-4 text-lg font-semibold tracking-tight">{t("emptyTitle")}</p>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">{t("emptyBody")}</p>
                <div className="mt-4 flex max-w-xl flex-wrap justify-center gap-2 lg:hidden">
                  {suggestions.map((s) => (
                    <Button key={s} variant="outline" size="sm" className="h-auto rounded-full py-1.5 whitespace-normal" onClick={() => send(s)}>
                      <Sparkles className="size-3.5 text-aurora" /> {s}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <AnimatePresence initial={false}>
              {msgs.map((m) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn("group flex gap-3", m.role === "user" && "flex-row-reverse")}>
                  <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", m.role === "user" ? "bg-primary text-primary-foreground" : "bg-gradient-to-br from-primary/20 to-aurora/20 text-primary")}>
                    {m.role === "user" ? <UserRound className="size-4" /> : <Bot className="size-4" />}
                  </div>
                  <div className={cn("max-w-[85%] space-y-2", m.role === "user" && "text-right")}>
                    <div
                      lang={m.lang}
                      className={cn(
                        "inline-block rounded-2xl px-4 py-2.5 text-left leading-relaxed",
                        m.role === "user" ? "rounded-tr-sm bg-primary text-primary-foreground" : m.found === false ? "rounded-tl-sm border border-dashed bg-muted/40" : "rounded-tl-sm bg-muted/60",
                      )}
                    >
                      {m.found === false && <SearchX className="mr-1.5 mb-0.5 inline size-4 text-muted-foreground" />}
                      {m.citations ? <CitedText text={m.text} citations={m.citations} /> : m.text}
                    </div>
                    {m.citations && m.citations.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground">{t("sources")}</p>
                        <ol className="flex flex-wrap gap-2">
                          {m.citations.map((c) => (
                            <li key={c.marker}>
                              <Link href={c.href} className="inline-flex max-w-72 items-center gap-1.5 rounded-lg border bg-background px-2 py-1 text-xs hover:border-primary/40">
                                <span className="flex size-4 items-center justify-center rounded-full bg-primary/15 text-[9px] font-semibold text-primary">{c.marker.slice(1)}</span>
                                <span className="truncate">{c.item_title}</span>
                              </Link>
                            </li>
                          ))}
                        </ol>
                        {m.mode === "offline" && (
                          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Database className="size-3" /> {tu("offlineAnswer")}
                          </p>
                        )}
                      </div>
                    )}
                    {m.role === "assistant" && m.found !== false && (
                      <Button
                        size="xs"
                        variant="ghost"
                        className="text-muted-foreground"
                        onClick={async () => {
                          await navigator.clipboard.writeText(strip(m.text));
                          toast.success(tc("copied"));
                        }}
                      >
                        <Copy /> {tc("copy")}
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {busy && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-aurora/20">
                  <Bot className="size-4 animate-pulse text-primary" />
                </div>
                {t("thinking")}
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="size-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </span>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <form
            className="shrink-0 border-t bg-card/90 p-3 backdrop-blur max-lg:sticky max-lg:bottom-0"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <div className="flex items-end gap-2 rounded-2xl border bg-background p-2 focus-within:ring-2 focus-within:ring-ring/40">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                placeholder={t("placeholder")}
                aria-label={t("placeholder")}
                rows={1}
                maxLength={MAX}
                className="max-h-32 min-h-10 resize-none border-0 shadow-none focus-visible:ring-0"
              />
              <Button type="submit" size="icon" className="shrink-0 rounded-xl" disabled={busy || input.trim().length < 3} aria-label={t("send")}>
                <ArrowUp />
              </Button>
            </div>
            <p className="mt-2 flex justify-between gap-3 px-1 text-[11px] text-muted-foreground">
              <span>{t("disclaimer")}</span>
              <span className="shrink-0 tabular-nums">
                {input.length}/{MAX}
              </span>
            </p>
          </form>
        </div>

        {/* side rail */}
        <aside className="flex min-h-0 flex-col gap-3 max-lg:hidden lg:col-span-4 tall:gap-4">
          <Pane icon={Lightbulb} title={t("suggestions")} className="fit:flex-[3]" bodyClassName="px-2">
            <ul className="grid gap-1">
              {suggestions.map((s) => (
                <li key={s}>
                  <button type="button" onClick={() => send(s)} disabled={busy} className="flex w-full items-start gap-2 rounded-lg p-2 text-left text-sm transition-colors hover:bg-muted/60 disabled:opacity-50">
                    <Sparkles className="mt-0.5 size-4 shrink-0 text-aurora" aria-hidden /> {s}
                  </button>
                </li>
              ))}
              {recent.length > 0 && (
                <li className="mt-1 flex items-center justify-between border-t px-2 pt-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                  {t("recent")}
                  <button type="button" className="font-medium tracking-normal normal-case underline underline-offset-2 hover:text-foreground" onClick={() => writeLocal(RECENT_KEY, null)}>
                    {t("clearRecent")}
                  </button>
                </li>
              )}
              {recent.map((r) => (
                <li key={r}>
                  <button type="button" onClick={() => send(r)} disabled={busy} className="flex w-full items-start gap-2 rounded-lg p-2 text-left text-sm transition-colors hover:bg-muted/60 disabled:opacity-50">
                    <History className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden /> <span className="line-clamp-2">{r}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Pane>
          <Pane icon={ShieldCheck} title={t("howTitle")} className="fit:flex-[2]">
            <ol className="grid gap-2.5">
              {steps.map((s, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border bg-background text-primary">
                    <s.icon className="size-3.5" aria-hidden />
                  </span>
                  <span className="pt-0.5 text-muted-foreground">{s.text}</span>
                </li>
              ))}
            </ol>
          </Pane>
        </aside>
      </FrameBody>
    </Frame>
  );
}
