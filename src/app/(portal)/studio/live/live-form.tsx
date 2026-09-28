"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Camera, CheckCircle2, Globe, Loader2, Lock, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface Exp {
  id: string;
  code: string;
  start: string | null;
  status: string;
}

function daysSince(iso: string) {
  return Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) + 1);
}

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

  const pick = (f: File | undefined) => {
    if (!f) return;
    setPhoto(f);
    setPreview(URL.createObjectURL(f));
  };

  const send = async () => {
    setBusy(true);
    const fd = new FormData();
    fd.set("meta", JSON.stringify({ expedition_id: exp, day: day === "" ? startDay : day, note, visibility }));
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

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3 rounded-3xl border bg-card p-8 text-center">
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
    );
  }

  return (
    <form
      className="space-y-5 rounded-3xl border bg-card p-5"
      onSubmit={(e) => {
        e.preventDefault();
        void send();
      }}
    >
      <div className="grid grid-cols-[1fr_110px] gap-3">
        <div className="grid gap-1.5">
          <Label>Expedition</Label>
          <Select value={exp} onValueChange={setExp}>
            <SelectTrigger className="h-12">
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
          <Input id="day" type="number" inputMode="numeric" min={1} className="h-12" placeholder={String(startDay)} value={day} onChange={(e) => setDay(e.target.value ? Number(e.target.value) : "")} />
        </div>
      </div>

      <div>
        {preview ? (
          <div className="relative overflow-hidden rounded-2xl border">
            {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
            <img src={preview} alt="Selected field photo preview" className="aspect-[4/3] w-full object-cover" />
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
          <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
            <Camera className="size-10" />
            <span className="text-sm font-medium">Take or choose a photo</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
          </label>
        )}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="note">Field note</Label>
        <Textarea id="note" rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What happened today? Keep to facts — numbers are checked against this note." className="text-base" />
      </div>

      <div className="grid gap-1.5">
        <Label>Cleared for public release?</Label>
        <ToggleGroup type="single" variant="outline" value={visibility} onValueChange={(v) => v && setVisibility(v as "public" | "internal")} className="w-full">
          <ToggleGroupItem value="public" className="h-11 flex-1">
            <Globe className="size-4" /> Yes
          </ToggleGroupItem>
          <ToggleGroupItem value="internal" className="h-11 flex-1">
            <Lock className="size-4" /> Internal
          </ToggleGroupItem>
        </ToggleGroup>
        <p className="text-xs text-muted-foreground">Internal updates are never sent to AI; the note is used word for word.</p>
      </div>

      <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={busy || note.trim().length < 10 || !exp}>
        {busy ? <Loader2 className="animate-spin" /> : <Send />} Send for review
      </Button>
    </form>
  );
}
