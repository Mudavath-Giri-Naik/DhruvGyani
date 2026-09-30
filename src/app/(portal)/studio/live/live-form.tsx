"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { BotOff, Camera, CheckCircle2, Eye, Globe, ListChecks, Loader2, Lock, Radio, Send, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Frame, FrameBody, FrameHeader, Pane } from "@/components/frame";
import { PolarArt } from "@/components/polar-art";

interface Exp {
  id: string;
  code: string;
  start: string | null;
  status: string;
}

function daysSince(iso: string) {
  return Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) + 1);
}

const MIN_NOTE = 10;

export function LiveForm({ expeditions }: { expeditions: Exp[] }) {
  const active = expeditions.find((e) => e.status === "ongoing") ?? expeditions.find((e) => e.status === "planned") ?? expeditions[0];
  const [exp, setExp] = useState(active?.id ?? "");
  const startDay = useMemo(() => {
    const e = expeditions.find((x) => x.id === exp);
    if (!e?.start) return 1;
    return daysSince(e.start);
  }, [exp, expeditions]);
  const [day, setDay] = useState<number | "">("");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<"public" | "internal">("public");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ generationId: string; itemId: string } | null>(null);
  const code = expeditions.find((e) => e.id === exp)?.code ?? "—";
  const shownDay = day === "" ? startDay : day;
  const ready = note.trim().length >= MIN_NOTE && Boolean(exp);

  const pick = (f: File | undefined) => {
    if (!f) return;
    setPhoto(f);
    setPreview(URL.createObjectURL(f));
  };

  const send = async () => {
    setBusy(true);
    const fd = new FormData();
    fd.set("meta", JSON.stringify({ expedition_id: exp, day: shownDay, note, visibility }));
    if (photo) fd.set("photo", photo);
    const res = await fetch("/api/live", { method: "POST", body: fd });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      toast.error(json.error);
      return;
    }
    setDone(json);
  };

  const steps = [
    { icon: Camera, text: "Snap a photo and write what happened today." },
    { icon: ShieldCheck, text: "Numbers in the draft are checked against your note." },
    { icon: ListChecks, text: "A reviewer approves it — nothing goes public before that." },
  ];

  return (
    <Frame>
      <FrameHeader
        icon={Radio}
        title="Live Expedition Mode"
        description="For field teams on a phone: snap a photo, add a note, send. It becomes a “Day N” update in the Review Queue."
        actions={
          <Badge variant="outline" className="gap-1.5">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-aurora opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex size-2 rounded-full bg-aurora" />
            </span>
            {code} · Day {shownDay}
          </Badge>
        }
      />
      <FrameBody className="lg:grid-cols-12">
        {done ? (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center gap-3 rounded-2xl border bg-card p-8 text-center shadow-xs lg:col-span-5">
            <CheckCircle2 className="size-12 text-success" />
            <p className="text-lg font-semibold">Update sent for review</p>
            <p className="text-sm text-muted-foreground">A reviewer will check it before anything is published.</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link href={`/studio/review?id=${done.generationId}`}>Open in Review Queue</Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setDone(null);
                  setNote("");
                  setPhoto(null);
                  setPreview(null);
                }}
              >
                Send another
              </Button>
            </div>
          </motion.div>
        ) : (
          <form
            className="flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-card shadow-xs lg:col-span-5"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <div className="min-h-0 flex-1 space-y-4 p-4 fit:overflow-y-auto">
              <div className="grid grid-cols-[1fr_96px] gap-3">
                <div className="grid gap-1.5">
                  <Label>Expedition</Label>
                  <Select value={exp} onValueChange={setExp}>
                    <SelectTrigger className="h-11 w-full" aria-label="Expedition">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {expeditions.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="day">Day</Label>
                  <Input id="day" type="number" inputMode="numeric" min={1} className="h-11" placeholder={String(startDay)} value={day} onChange={(e) => setDay(e.target.value ? Number(e.target.value) : "")} />
                </div>
              </div>

              {preview ? (
                <div className="relative overflow-hidden rounded-xl border">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
                  <img src={preview} alt="Selected field photo preview" className="aspect-[16/9] w-full object-cover" />
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="secondary"
                    className="absolute top-2 right-2"
                    aria-label="Remove photo"
                    onClick={() => {
                      setPhoto(null);
                      setPreview(null);
                    }}
                  >
                    <X />
                  </Button>
                </div>
              ) : (
                <label className="flex aspect-[16/7] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
                  <Camera className="size-8" />
                  <span className="text-sm font-medium">Take or choose a photo</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
                </label>
              )}

              <div className="grid gap-1.5">
                <div className="flex items-baseline justify-between">
                  <Label htmlFor="note">Field note</Label>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {note.trim().length < MIN_NOTE ? `${MIN_NOTE - note.trim().length} more characters` : `${note.trim().split(/\s+/).length} words`}
                  </span>
                </div>
                <Textarea id="note" rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What happened today? Keep to facts — numbers are checked against this note." className="text-base" />
              </div>

              <div className="grid gap-1.5">
                <Label>Cleared for public release?</Label>
                <ToggleGroup type="single" variant="outline" value={visibility} onValueChange={(v) => v && setVisibility(v as "public" | "internal")} className="w-full">
                  <ToggleGroupItem value="public" className="h-10 flex-1">
                    <Globe className="size-4" /> Yes
                  </ToggleGroupItem>
                  <ToggleGroupItem value="internal" className="h-10 flex-1">
                    <Lock className="size-4" /> Internal
                  </ToggleGroupItem>
                </ToggleGroup>
                <p className="text-xs text-muted-foreground">Internal updates are never sent to AI; the note is used word for word.</p>
              </div>
            </div>
            <div className="shrink-0 border-t p-3">
              <Button type="submit" size="lg" className="h-11 w-full text-base" disabled={busy || !ready}>
                {busy ? <Loader2 className="animate-spin" /> : <Send />} Send for review
              </Button>
            </div>
          </form>
        )}

        <div className="flex min-h-0 flex-col gap-3 lg:col-span-7 tall:gap-4">
          {/* what the reviewer will receive */}
          <Pane icon={Eye} title="Preview" description="What lands in the Review Queue." className="fit:flex-[3]">
            <article className="overflow-hidden rounded-xl border bg-background">
              <div className="relative aspect-[16/6] overflow-hidden short:aspect-[16/3]">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
                  <img src={preview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <PolarArt variant="antarctic-coast" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute inset-x-3 bottom-2.5 flex flex-wrap items-center gap-1.5">
                  <Badge className="bg-black/55 font-mono text-white backdrop-blur">{code}</Badge>
                  <Badge className="bg-black/55 text-white backdrop-blur">Day {shownDay}</Badge>
                  <Badge className="ml-auto gap-1 bg-black/55 text-white backdrop-blur">
                    {visibility === "public" ? <Globe className="size-3" /> : <Lock className="size-3" />}
                    {visibility === "public" ? "Public once approved" : "Internal"}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2 p-3">
                <p className="text-sm font-semibold">
                  {code} · Day {shownDay} field update
                </p>
                <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{note.trim() || "Your field note appears here as you type."}</p>
                {visibility === "internal" && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <BotOff className="size-3.5" /> AI disabled: the note is used word for word.
                  </p>
                )}
              </div>
            </article>
          </Pane>
          <Pane icon={ListChecks} title="How it works" className="fit:flex-[2]">
            <ol className="grid gap-2.5 sm:grid-cols-3">
              {steps.map((s, i) => (
                <li key={i} className="flex items-start gap-2.5 rounded-xl border bg-background p-3 text-sm">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-aurora/15 text-primary">
                    <s.icon className="size-3.5" aria-hidden />
                  </span>
                  <span className="text-muted-foreground">{s.text}</span>
                </li>
              ))}
            </ol>
          </Pane>
        </div>
      </FrameBody>
    </Frame>
  );
}
