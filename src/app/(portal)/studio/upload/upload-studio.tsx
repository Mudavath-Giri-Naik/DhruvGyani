"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  Bot,
  BotOff,
  CheckCircle2,
  CloudUpload,
  Cog,
  FileCheck2,
  Globe,
  Link2,
  Loader2,
  Lock,
  RotateCcw,
  Sparkles,
  Timer,
  Wand2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Frame, FrameBody, FrameHeader, Pane } from "@/components/frame";
import { ITEM_TYPES } from "@/lib/constants";
import { dHash } from "@/lib/phash";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

type Release = "public" | "internal" | "embargo";
interface Exp {
  id: string;
  code: string;
  title: string;
  station_id: string | null;
}
interface Analysis {
  kind: "pdf" | "csv" | "image" | "video" | "docx";
  pages: number;
  textPreview: string;
  suggestion: { title: string; authors: string[]; year: number | null; expedition_code: string | null; keywords: string[]; language: "en" | "hi"; alt_text: string | null };
  source: "ai" | "heuristic";
  aiAllowed: boolean;
  aiAvailable: boolean;
  warning?: string;
  exifDate?: string;
  duplicates?: { id: string; title: string }[];
  csv?: { row_count: number; columns: { name: string; kind: string }[] };
}

const KIND_TYPE: Record<string, (typeof ITEM_TYPES)[number]> = { pdf: "report", csv: "dataset", image: "photo", video: "video", docx: "report" };

function releaseValue(r: Release, date: string) {
  return {
    visibility: r === "internal" ? ("internal" as const) : ("public" as const),
    embargo_until: r === "embargo" && date ? new Date(`${date}T00:00:00Z`).toISOString() : null,
  };
}

export function UploadStudio({ role, expeditions, stations }: { role: Role; expeditions: Exp[]; stations: { id: string; name: string }[] }) {
  const t = useTranslations("upload");
  const [mode, setMode] = useState("single");
  return (
    <Frame>
      <FrameHeader
        icon={CloudUpload}
        title={t("title")}
        description={t("subtitle")}
        actions={
          <ToggleGroup type="single" variant="outline" size="sm" value={mode} onValueChange={(v) => v && setMode(v)} aria-label="Upload mode">
            <ToggleGroupItem value="single" className="gap-1.5 px-3">
              <CloudUpload className="size-4" /> Single file
            </ToggleGroupItem>
            <ToggleGroupItem value="bulk" className="gap-1.5 px-3">
              <FileCheck2 className="size-4" /> {t("bulk")}
            </ToggleGroupItem>
          </ToggleGroup>
        }
      />
      <FrameBody className="xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-h-0 min-w-0">{mode === "single" ? <SingleUpload role={role} expeditions={expeditions} stations={stations} /> : <BulkImport />}</div>
        <JobsPanel />
      </FrameBody>
    </Frame>
  );
}

// ---------------------------------------------------------------------------------------------- single

function StepHeader({ n, title, done }: { n: number; title: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
          done ? "border-success bg-success text-white" : "border-primary/40 bg-primary/10 text-primary",
        )}
      >
        {done ? <CheckCircle2 className="size-4" /> : n}
      </span>
      <h2 className="font-semibold">{title}</h2>
    </div>
  );
}

function SingleUpload({ role, expeditions, stations }: { role: Role; expeditions: Exp[]; stations: { id: string; name: string }[] }) {
  const t = useTranslations("upload");
  const tt = useTranslations("types");
  const [release, setRelease] = useState<Release | null>(null);
  const [embargoDate, setEmbargoDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [phash, setPhash] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ id: string; title: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    type: "report" as (typeof ITEM_TYPES)[number],
    title: "",
    description: "",
    expedition_id: "none",
    station_id: "none",
    discipline: "",
    tags: "",
    authors: "",
    event_date: "",
    language: "en" as "en" | "hi",
    license: "CC BY 4.0",
    source_url: "",
    alt_text: "",
    status: "in_review" as "draft" | "in_review" | "published",
  });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const releaseReady = release === "public" || release === "internal" || (release === "embargo" && Boolean(embargoDate));

  const analyze = useCallback(
    async (f: File) => {
      if (!release) return;
      setAnalyzing(true);
      setAnalysis(null);
      const hash = f.type.startsWith("image/") ? await dHash(f) : null;
      setPhash(hash);
      const fd = new FormData();
      fd.set("file", f);
      fd.set("release", JSON.stringify(releaseValue(release, embargoDate)));
      if (hash) fd.set("phash", hash);
      const res = await fetch("/api/ingest/analyze", { method: "POST", body: fd });
      const json = await res.json();
      setAnalyzing(false);
      if (!res.ok) {
        toast.error(json.error ?? "Could not read this file");
        setFile(null);
        return;
      }
      const a = json as Analysis;
      setAnalysis(a);
      const exp = a.suggestion.expedition_code ? expeditions.find((e) => e.code.toLowerCase() === a.suggestion.expedition_code!.toLowerCase()) : null;
      setForm((prev) => ({
        ...prev,
        type: KIND_TYPE[a.kind] ?? prev.type,
        title: a.suggestion.title || prev.title,
        authors: a.suggestion.authors.join(", "),
        tags: a.suggestion.keywords.join(", "),
        language: a.suggestion.language,
        expedition_id: exp?.id ?? prev.expedition_id,
        station_id: exp?.station_id ?? prev.station_id,
        event_date: a.exifDate ?? (a.suggestion.year ? `${a.suggestion.year}-01-01` : prev.event_date),
        alt_text: a.suggestion.alt_text ?? prev.alt_text,
      }));
    },
    [release, embargoDate, expeditions],
  );

  const pick = (f: File | undefined | null) => {
    if (!f) return;
    setFile(f);
    setSaved(null);
    void analyze(f);
  };

  const save = async () => {
    if (!release) return;
    setSaving(true);
    setErrors({});
    const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
    const meta = {
      ...releaseValue(release, embargoDate),
      type: form.type,
      title: form.title,
      description: form.description,
      expedition_id: form.expedition_id === "none" ? null : form.expedition_id,
      station_id: form.station_id === "none" ? null : form.station_id,
      discipline: list(form.discipline),
      tags: list(form.tags),
      authors: list(form.authors),
      event_date: form.event_date || null,
      language: form.language,
      license: form.license || null,
      source_url: form.source_url,
      external_url: file ? "" : link,
      alt_text: form.alt_text || null,
      status: form.status,
      phash,
    };
    const fd = new FormData();
    fd.set("meta", JSON.stringify(meta));
    if (file) fd.set("file", file);
    const res = await fetch("/api/ingest", { method: "POST", body: fd });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      if (json.issues) setErrors(Object.fromEntries(json.issues.map((i: { path: string; message: string }) => [i.path, i.message])));
      toast.error(json.error ?? "Could not save");
      return;
    }
    setSaved(json.item);
    toast.success("Saved. Processing has started.");
    window.dispatchEvent(new Event("dg:jobs"));
  };

  const reset = () => {
    setFile(null);
    setLink("");
    setAnalysis(null);
    setSaved(null);
    setForm((f) => ({ ...f, title: "", description: "", tags: "", authors: "", alt_text: "", source_url: "" }));
  };

  const releaseOptions: { value: Release; icon: typeof Globe; label: string; hint: string }[] = [
    { value: "public", icon: Globe, label: t("releasePublic"), hint: "Shown publicly once published. AI features allowed." },
    { value: "internal", icon: Lock, label: t("releaseInternal"), hint: "Staff only. Never sent to AI; keyword search only." },
    { value: "embargo", icon: Timer, label: t("releaseEmbargo"), hint: "Hidden and AI-disabled until the date, then released." },
  ];

  if (saved) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="fit:h-full">
        <Card className="border-success/40 fit:h-full fit:justify-center">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="rounded-full bg-success/15 p-3 text-success">
              <CheckCircle2 className="size-8" />
            </div>
            <p className="text-lg font-semibold">“{saved.title}” saved</p>
            <p className="max-w-md text-sm text-muted-foreground">Text extraction, chunking and (if allowed) embeddings run in the background. Follow progress under Processing jobs.</p>
            <div className="flex gap-2">
              <Button asChild>
                <Link href={`/items/${saved.id}`}>Open item</Link>
              </Button>
              <Button variant="outline" onClick={reset}>
                Upload another
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="grid min-h-0 gap-3 lg:grid-cols-2 fit:h-full fit:grid-rows-[minmax(0,1fr)]">
      <div className="min-h-0 space-y-3 fit:overflow-y-auto fit:p-0.5">
        {/* step 1 */}
        <Card>
          <CardHeader>
            <StepHeader n={1} title={t("release")} done={releaseReady} />
          </CardHeader>
          <CardContent className="space-y-3">
            <div role="radiogroup" aria-label={t("release")} className="grid gap-2">
              {releaseOptions.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={release === o.value}
                  onClick={() => {
                    setRelease(o.value);
                    setAnalysis(null);
                    setFile(null);
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 text-left transition-all hover:border-primary/50",
                    release === o.value && "border-primary bg-primary/5 ring-2 ring-primary/20",
                  )}
                >
                  <o.icon className={cn("size-5 shrink-0", release === o.value ? "text-primary" : "text-muted-foreground")} />
                  <span className="grid">
                    <span className="text-sm font-medium">{o.label}</span>
                    <span className="text-xs text-muted-foreground">{o.hint}</span>
                  </span>
                </button>
              ))}
            </div>
            {release === "embargo" && (
              <div className="grid max-w-xs gap-1.5">
                <Label htmlFor="emb-date">Release date</Label>
                <Input id="emb-date" type="date" value={embargoDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setEmbargoDate(e.target.value)} />
              </div>
            )}
            {release && release !== "public" && (
              <Alert>
                <BotOff />
                <AlertTitle>AI disabled: not cleared for public release</AlertTitle>
                <AlertDescription>This file will not be sent to any AI service. Metadata suggestions use offline rules only.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* step 2 */}
        <Card className={cn(!releaseReady && "pointer-events-none opacity-50")} aria-disabled={!releaseReady}>
          <CardHeader>
            <StepHeader n={2} title={t("file")} done={Boolean(analysis || link)} />
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                pick(e.dataTransfer.files?.[0]);
              }}
              className={cn(
                "relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition-all",
                drag ? "scale-[1.01] border-primary bg-primary/5" : "border-border hover:border-primary/50",
              )}
            >
              {analyzing ? <Loader2 className="size-8 animate-spin text-primary" /> : <CloudUpload className="size-8 text-primary" />}
              <p className="text-sm font-medium">{file ? file.name : t("drop")}</p>
              <p className="text-xs text-muted-foreground">PDF, CSV, JPG/PNG/WebP, MP4, DOCX · max 25 MB</p>
              <Button type="button" variant="outline" size="sm" className="mt-1" onClick={() => inputRef.current?.click()}>
                Choose file
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.csv,.jpg,.jpeg,.png,.webp,.mp4,.docx"
                capture={undefined}
                className="sr-only"
                aria-label={t("drop")}
                onChange={(e) => pick(e.target.files?.[0])}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ext-link" className="flex items-center gap-1.5 text-muted-foreground">
                <Link2 className="size-3.5" /> {t("orLink")}
              </Label>
              <Input id="ext-link" type="url" placeholder="https://…" value={link} disabled={Boolean(file)} onChange={(e) => setLink(e.target.value)} />
            </div>

            <AnimatePresence>
              {analysis && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3 rounded-xl border bg-muted/30 p-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="uppercase">
                      {analysis.kind}
                    </Badge>
                    {analysis.pages > 0 && <Badge variant="outline">{analysis.pages} pages</Badge>}
                    {analysis.csv && (
                      <Badge variant="outline">
                        {analysis.csv.row_count} rows · {analysis.csv.columns.length} columns
                      </Badge>
                    )}
                    {analysis.exifDate && <Badge variant="outline">EXIF date {analysis.exifDate}</Badge>}
                    {analysis.source === "ai" ? (
                      <Badge className="gap-1 bg-aurora text-aurora-foreground">
                        <Bot className="size-3" /> {t("autofill")}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <Wand2 className="size-3" /> Suggested by offline rules{!analysis.aiAllowed ? " (AI disabled)" : !analysis.aiAvailable ? " (no AI key)" : ""}
                      </Badge>
                    )}
                  </div>
                  {analysis.warning && (
                    <p className="flex items-start gap-2 text-warning">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {analysis.warning}
                    </p>
                  )}
                  {analysis.duplicates && analysis.duplicates.length > 0 && (
                    <p className="flex items-start gap-2 text-warning">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                      Possible duplicate of:{" "}
                      {analysis.duplicates.map((d) => (
                        <Link key={d.id} href={`/items/${d.id}`} className="underline" target="_blank">
                          {d.title}
                        </Link>
                      ))}
                    </p>
                  )}
                  {analysis.textPreview && <p className="line-clamp-3 text-xs text-muted-foreground">{analysis.textPreview}</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>

      <div className="min-h-0 fit:overflow-y-auto fit:p-0.5">
        {/* step 3 */}
        <Card className={cn(!(analysis || link) && "pointer-events-none opacity-50")}>
          <CardHeader>
            <StepHeader n={3} title="Confirm metadata" />
            <CardDescription className="flex items-center gap-1.5 pl-10">
              <Sparkles className="size-3.5 text-aurora" /> Suggestions are pre-filled — check every field before saving.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                void save();
              }}
            >
              <Field label="Title" error={errors.title} className="md:col-span-2">
                <Input value={form.title} onChange={(e) => set("title", e.target.value)} required minLength={3} aria-invalid={Boolean(errors.title)} />
              </Field>
              <Field label="Type">
                <Select value={form.type} onValueChange={(v) => set("type", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_TYPES.map((x) => (
                      <SelectItem key={x} value={x}>
                        {tt(x)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Language">
                <Select value={form.language} onValueChange={(v) => set("language", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">हिंदी</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Expedition">
                <Select value={form.expedition_id} onValueChange={(v) => set("expedition_id", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {expeditions.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Station">
                <Select value={form.station_id} onValueChange={(v) => set("station_id", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {stations.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Description" className="md:col-span-2">
                <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
              </Field>
              <Field label="Authors (comma-separated)">
                <Input value={form.authors} onChange={(e) => set("authors", e.target.value)} />
              </Field>
              <Field label="Date" error={errors.event_date}>
                <Input type="date" value={form.event_date} onChange={(e) => set("event_date", e.target.value)} />
              </Field>
              <Field label="Discipline (comma-separated)">
                <Input value={form.discipline} onChange={(e) => set("discipline", e.target.value)} placeholder="Glaciology, Meteorology" />
              </Field>
              <Field label="Tags (comma-separated)">
                <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} />
              </Field>
              <Field label="Licence">
                <Input value={form.license} onChange={(e) => set("license", e.target.value)} />
              </Field>
              <Field label="Source URL" error={errors.source_url}>
                <Input type="url" value={form.source_url} onChange={(e) => set("source_url", e.target.value)} placeholder="https://" />
              </Field>
              {form.type === "photo" && (
                <Field label="Alt text (describe what is visible)" className="md:col-span-2">
                  <Textarea rows={2} value={form.alt_text} onChange={(e) => set("alt_text", e.target.value)} />
                </Field>
              )}
              <Field label="Workflow status">
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="in_review">Submit for review</SelectItem>
                    <SelectItem value="published" disabled={role !== "reviewer" && role !== "admin"}>
                      Publish now {role !== "reviewer" && role !== "admin" ? "(reviewers only)" : ""}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <div className="flex items-end justify-end md:col-span-2">
                <Button type="submit" size="lg" disabled={saving || !(file || link) || analyzing}>
                  {saving ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} {t("confirm")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, error, className, children }: { label: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------- bulk

const BULK_SAMPLE = `title,type,expedition_code,date,source_url,tags
NCPOR Antarctic programme overview,activity,,,https://ncpor.res.in/antarcticas,Antarctica;programme
46-ISEA advertisement,activity,46-ISEA,,http://isea.ncpor.res.in/forms/46-ISEA%20Webpage%20Advertisment.pdf,46-ISEA
Broken row example,poster,99-ISEA,2026-13-01,not-a-url,`;

function BulkImport() {
  const t = useTranslations("upload");
  const [text, setText] = useState(BULK_SAMPLE);
  const [visibility, setVisibility] = useState<"public" | "internal">("public");
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [results, setResults] = useState<{ index: number; ok: boolean; errors: string[] }[] | null>(null);
  const [busy, setBusy] = useState(false);

  const preview = async () => {
    const parsed = Papa.parse<Record<string, string>>(text.trim(), { header: true, skipEmptyLines: true });
    setRows(parsed.data);
    setBusy(true);
    const res = await fetch("/api/ingest/bulk", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ rows: parsed.data, visibility, commit: false }) });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) return toast.error(json.error);
    setResults(json.results);
  };
  const commit = async () => {
    setBusy(true);
    const res = await fetch("/api/ingest/bulk", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ rows, visibility, commit: true }) });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) return toast.error(json.error);
    toast.success(`Imported ${json.created} item(s) for review`);
    setResults(null);
    window.dispatchEvent(new Event("dg:jobs"));
  };
  const valid = results?.filter((r) => r.ok).length ?? 0;

  return (
    <Card className="fit:max-h-full fit:overflow-y-auto">
      <CardHeader>
        <CardTitle>{t("bulk")}</CardTitle>
        <CardDescription>{t("bulkBody")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea rows={7} className="font-mono text-xs" value={text} onChange={(e) => setText(e.target.value)} aria-label="CSV metadata" />
        <div className="flex flex-wrap items-center gap-3">
          <Select value={visibility} onValueChange={(v) => setVisibility(v as "public" | "internal")}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">{t("releasePublic")}</SelectItem>
              <SelectItem value="internal">{t("releaseInternal")}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={preview} disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} {t("preview")}
          </Button>
          <Button onClick={commit} disabled={busy || !valid}>
            {t("import")} ({valid})
          </Button>
        </div>
        {results && (
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Validation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r) => (
                  <TableRow key={r.index} className={r.ok ? "" : "bg-destructive/5"}>
                    <TableCell>{r.index + 1}</TableCell>
                    <TableCell className="max-w-xs truncate">{rows[r.index]?.title}</TableCell>
                    <TableCell>{rows[r.index]?.type}</TableCell>
                    <TableCell>
                      {r.ok ? (
                        <span className="inline-flex items-center gap-1 text-success">
                          <CheckCircle2 className="size-4" /> OK
                        </span>
                      ) : (
                        <span className="inline-flex items-start gap-1 text-destructive">
                          <XCircle className="mt-0.5 size-4 shrink-0" /> {r.errors.join("; ")}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------------------------- jobs

interface JobRow {
  id: string;
  type: string;
  status: "queued" | "running" | "done" | "failed";
  error: string | null;
  attempts: number;
  title: string | null;
  item_id: string | null;
  updated_at: string;
}

function JobsPanel() {
  const t = useTranslations("upload");
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const load = useCallback(async () => {
    const res = await fetch("/api/ingest", { cache: "no-store" });
    if (res.ok) setJobs((await res.json()).jobs);
  }, []);
  useEffect(() => {
    const first = setTimeout(load, 0);
    const onEvt = () => void load();
    window.addEventListener("dg:jobs", onEvt);
    const id = setInterval(load, 3000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
      window.removeEventListener("dg:jobs", onEvt);
    };
  }, [load]);

  const tone = { queued: "text-muted-foreground", running: "text-primary", done: "text-success", failed: "text-destructive" };
  return (
    <Pane icon={Cog} title={t("jobs")} description="Extraction → chunking → embeddings." count={jobs.length || undefined}>
      {jobs.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No jobs yet.</p>
      ) : (
        <ul className="space-y-3">
          {jobs.map((j) => (
            <li key={j.id} className="rounded-xl border bg-background p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-medium">{j.title ?? j.type}</span>
                <span className={cn("inline-flex items-center gap-1 text-xs font-medium capitalize", tone[j.status])}>
                  {j.status === "running" && <Loader2 className="size-3 animate-spin" />}
                  {j.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {j.type.replace("_", " ")} · attempt {j.attempts}
              </p>
              {j.error && <p className={cn("mt-1 text-xs", j.status === "failed" ? "text-destructive" : "text-muted-foreground")}>{j.error}</p>}
              <div className="mt-2 flex gap-2">
                {j.item_id && (
                  <Link href={`/items/${j.item_id}`} className="text-xs text-primary hover:underline">
                    Open item
                  </Link>
                )}
                {(j.status === "failed" || j.status === "queued") && (
                  <button
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    onClick={async () => {
                      await fetch(`/api/ingest?retry=${j.id}`, { method: "POST" });
                      void load();
                    }}
                  >
                    <RotateCcw className="size-3" /> Retry
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Pane>
  );
}
