"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bot, Check, CheckCircle2, FlaskConical, Loader2, Search, Send, Sparkles, X as XIcon } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BorderBeam } from "@/components/ui/border-beam";
import { TypeIcon } from "@/components/items/type-icon";
import { CHANNEL_LABEL, DraftWorkspace } from "@/components/studio/draft-workspace";
import { transitionGeneration } from "@/app/actions/review";
import { approvalBlockers } from "@/lib/trust/claims";
import type { Chunk, Generation, GenerationClaim, Role } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Source {
  id: string;
  title: string;
  type: string;
  language: string;
  is_sample: boolean;
  code: string | null;
}
interface Result {
  generation: Generation;
  claims: GenerationClaim[];
  chunks: Chunk[];
  mode?: string;
}

const AUDIENCES = ["public", "school", "college", "expert"] as const;
const CHANNELS = ["website_article", "x", "facebook", "instagram", "linkedin"] as const;

export function ContentStudio({ sources, initial, preselect, aiLive, role }: { sources: Source[]; initial: Result | null; preselect: string[]; aiLive: boolean; role: Role }) {
  const t = useTranslations("studio");
  const router = useRouter();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string[]>(initial?.generation.item_ids ?? preselect);
  const [audience, setAudience] = useState<(typeof AUDIENCES)[number]>(initial?.generation.audience ?? "public");
  const [language, setLanguage] = useState<"en" | "hi">(initial?.generation.language ?? "en");
  const [channels, setChannels] = useState<string[]>(initial ? [initial.generation.channel] : ["website_article", "instagram"]);
  const [results, setResults] = useState<Result[]>(initial ? [initial] : []);
  const [errors, setErrors] = useState<{ channel: string; message: string }[]>([]);
  const [stage, setStage] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [tab, setTab] = useState(initial?.generation.id ?? "");
  const [pending, start] = useTransition();

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    return sources.filter((s) => !n || `${s.title} ${s.code ?? ""} ${s.type}`.toLowerCase().includes(n));
  }, [q, sources]);

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 5 ? s : [...s, id]));

  const generate = async () => {
    setRunning(true);
    setResults([]);
    setErrors([]);
    setStage("retrieving");
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ itemIds: selected, audience, language, channels }),
    });
    if (!res.ok || !res.body) {
      setRunning(false);
      setStage(null);
      return toast.error((await res.json().catch(() => ({}))).error ?? "Generation failed");
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let first = true;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        const evt = JSON.parse(line);
        if (evt.type === "stage") setStage(evt.channel ? `${evt.stage}:${evt.channel}` : evt.stage);
        if (evt.type === "generation") {
          setResults((r) => [...r, { generation: evt.generation, claims: evt.claims, chunks: evt.chunks, mode: evt.mode }]);
          if (first) {
            setTab(evt.generation.id);
            first = false;
          }
        }
        if (evt.type === "error") setErrors((e) => [...e, { channel: evt.channel, message: evt.message }]);
      }
    }
    setRunning(false);
    setStage(null);
  };

  const submit = (g: Generation) =>
    start(async () => {
      const r = await transitionGeneration(g.id, "submit");
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(t("submitted"));
      setResults((list) => list.map((x) => (x.generation.id === g.id ? { ...x, generation: { ...x.generation, status: r.status } } : x)));
      router.refresh();
    });

  const stageLabel = (s: string) => {
    const [st, ch] = s.split(":");
    return `${st === "retrieving" ? "Retrieving source passages" : st === "drafting" ? "Drafting" : "Verifying claims & numbers"}${ch ? ` · ${CHANNEL_LABEL[ch]}` : ""}`;
  };

  return (
    <div className="space-y-6">
      {!aiLive && (
        <Alert className="border-warning/40 bg-warning/5">
          <FlaskConical className="text-warning" />
          <AlertDescription>
            No AI key configured. Sources with a pre-generated pack (the 45-ISEA sample field log) return that pack; other English sources get an <strong>offline template</strong> made of cited source sentences. Hindi needs the AI service.
          </AlertDescription>
        </Alert>
      )}

      <Card className="relative overflow-hidden">
        {running && <BorderBeam size={220} duration={6} colorFrom="#3BA7E0" colorTo="#2DD4A7" />}
        <CardContent className="grid gap-6 p-5 lg:grid-cols-[1.3fr_1fr]">
          {/* sources */}
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">1</span> {t("step1")}
              <span className="font-normal text-muted-foreground">· {t("pickSources")} (max 5)</span>
            </p>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter sources…" className="pl-9" aria-label="Filter sources" />
            </div>
            <ScrollArea className="h-64 rounded-xl border">
              <ul className="divide-y">
                {filtered.map((s) => {
                  const on = selected.includes(s.id);
                  return (
                    <li key={s.id}>
                      <label className={cn("flex cursor-pointer items-start gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-muted/50", on && "bg-primary/5")}>
                        <Checkbox checked={on} onCheckedChange={() => toggle(s.id)} className="mt-0.5" aria-label={s.title} />
                        <TypeIcon type={s.type} className="mt-0.5 text-muted-foreground" />
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-1 font-medium" lang={s.language}>
                            {s.title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {s.code ?? "—"} · {s.type}
                            {s.is_sample ? " · sample" : ""}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
            <p className="text-xs text-muted-foreground">{t("onlyPublic")}</p>
          </div>

          {/* options */}
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">2</span> {t("step2")}
              </p>
              <ToggleGroup type="single" variant="outline" value={audience} onValueChange={(v) => v && setAudience(v as typeof audience)} className="flex-wrap justify-start">
                {AUDIENCES.map((a) => (
                  <ToggleGroupItem key={a} value={a} className="px-3 capitalize">
                    {a}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">3</span> {t("step3")}
              </p>
              <ToggleGroup type="single" variant="outline" value={language} onValueChange={(v) => v && setLanguage(v as "en" | "hi")} className="justify-start">
                <ToggleGroupItem value="en" className="px-4">
                  English
                </ToggleGroupItem>
                <ToggleGroupItem value="hi" className="px-4" lang="hi">
                  हिंदी
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">4</span> {t("step4")}
              </p>
              <ToggleGroup type="multiple" variant="outline" value={channels} onValueChange={(v) => v.length && setChannels(v)} className="flex-wrap justify-start">
                {CHANNELS.map((c) => (
                  <ToggleGroupItem key={c} value={c} className="px-3">
                    {channels.includes(c) && <Check className="size-3.5" />} {CHANNEL_LABEL[c]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t pt-4">
              {selected.map((id) => {
                const s = sources.find((x) => x.id === id);
                return s ? (
                  <Badge key={id} variant="secondary" className="max-w-full gap-1">
                    <span className="max-w-48 truncate">{s.title}</span>
                    <button onClick={() => toggle(id)} aria-label={`Remove ${s.title}`}>
                      <XIcon className="size-3" />
                    </button>
                  </Badge>
                ) : null;
              })}
            </div>
            <Button size="lg" className="w-full" disabled={!selected.length || running} onClick={generate}>
              {running ? <Loader2 className="animate-spin" /> : <Sparkles />} {running ? t("generating") : t("generate")}
            </Button>
            <AnimatePresence>
              {stage && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
                  <Bot className="size-4 animate-pulse text-aurora" /> {stageLabel(stage)}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {errors.map((e) => (
        <Alert key={e.channel} variant="destructive">
          <AlertDescription>
            {CHANNEL_LABEL[e.channel]}: {e.message}
          </AlertDescription>
        </Alert>
      ))}

      {results.length > 0 && (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-auto flex-wrap">
            {results.map((r) => {
              const b = approvalBlockers(r.claims);
              return (
                <TabsTrigger key={r.generation.id} value={r.generation.id} className="gap-2">
                  {CHANNEL_LABEL[r.generation.channel]}
                  <span className={cn("size-2 rounded-full", b.blocked ? "bg-destructive" : "bg-success")} aria-label={b.blocked ? "has flagged claims" : "all claims pass"} />
                </TabsTrigger>
              );
            })}
          </TabsList>
          {results.map((r) => (
            <TabsContent key={r.generation.id} value={r.generation.id} className="mt-4">
              {r.mode && r.mode !== "ai" && (
                <p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <FlaskConical className="size-3.5 text-warning" /> {r.mode === "demo-pack" ? t("demoPack") : "Offline template: verbatim cited source sentences (AI unavailable)."}
                </p>
              )}
              <DraftWorkspace
                generation={r.generation}
                claims={r.claims}
                chunks={r.chunks}
                editable={r.generation.status === "draft" || r.generation.status === "in_review"}
                onChange={(g, c) => setResults((list) => list.map((x) => (x.generation.id === g.id ? { ...x, generation: g, claims: c } : x)))}
                footer={(g) => (
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {g.status === "draft" ? (
                      <Button onClick={() => submit(g)} disabled={pending}>
                        {pending ? <Loader2 className="animate-spin" /> : <Send />} {t("submit")}
                      </Button>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="size-3.5" /> {g.status.replace("_", " ")}
                      </Badge>
                    )}
                    <Button asChild variant="outline">
                      <Link href={`/studio/review?id=${g.id}`}>{role === "curator" ? "View in Review Queue" : "Open in Review Queue"}</Link>
                    </Button>
                  </div>
                )}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
