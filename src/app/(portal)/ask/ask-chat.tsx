"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, Bot, Database, SearchX, Sparkles, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CitedText } from "@/components/cited-text";
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

export function AskChat({ initial }: { initial: string }) {
  const t = useTranslations("ask");
  const tu = useTranslations("ui");
  const locale = useLocale();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const asked = useRef(false);

  const send = async (question: string) => {
    const q = question.trim();
    if (q.length < 3 || busy) return;
    const lang = /[ऀ-ॿ]/.test(q) || locale === "hi" ? "hi" : "en";
    setMsgs((m) => [...m, { id: Date.now(), role: "user", text: q, lang }]);
    setInput("");
    setBusy(true);
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
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, busy]);

  const suggestions = [t("s1"), t("s2"), t("s3")];

  return (
    <div className="flex min-h-[60vh] flex-col rounded-3xl border bg-card shadow-sm">
      <div className="flex-1 space-y-6 p-4 md:p-6" role="log" aria-live="polite" aria-busy={busy}>
        {msgs.length === 0 && (
          <div className="flex flex-col items-center py-10 text-center">
            <Logo className="size-14" />
            <p className="mt-4 font-medium">{t("suggestions")}</p>
            <div className="mt-4 flex max-w-xl flex-wrap justify-center gap-2">
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
            <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
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
        className="sticky bottom-0 rounded-b-3xl border-t bg-card/90 p-3 backdrop-blur"
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
            maxLength={300}
            className="max-h-32 min-h-10 resize-none border-0 shadow-none focus-visible:ring-0"
          />
          <Button type="submit" size="icon" className="shrink-0 rounded-xl" disabled={busy || input.trim().length < 3} aria-label={t("send")}>
            <ArrowUp />
          </Button>
        </div>
        <p className="mt-2 px-1 text-[11px] text-muted-foreground">{t("disclaimer")}</p>
      </form>
    </div>
  );
}
