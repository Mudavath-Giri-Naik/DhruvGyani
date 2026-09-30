"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Hash, Languages, Loader2, Palette, RotateCcw, Save, Settings, Timer } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Frame, FrameBody, FrameHeader, Pane } from "@/components/frame";
import { Logo } from "@/components/shell/logo";
import { saveSettings } from "@/app/actions/admin";
import type { OrgSettings } from "@/lib/types";

export function SettingsForm({ initial }: { initial: OrgSettings }) {
  const t = useTranslations("admin");
  const [s, setS] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [tags, setTags] = useState(initial.hashtags.join(" "));
  const [savedTags, setSavedTags] = useState(initial.hashtags.join(" "));
  const [pending, start] = useTransition();
  const set = <K extends keyof OrgSettings>(k: K, v: OrgSettings[K]) => setS((x) => ({ ...x, [k]: v }));
  const tagList = tags.split(/[\s,]+/).filter(Boolean);
  const dirty = JSON.stringify(s) !== JSON.stringify(saved) || tags !== savedTags;

  const save = () =>
    start(async () => {
      const res = await saveSettings({ ...s, hashtags: tagList });
      if (res.ok) {
        toast.success("Settings saved");
        setSaved(s);
        setSavedTags(tags);
      } else toast.error(res.error);
    });

  return (
    <form
      className="contents"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <Frame>
        <FrameHeader
          icon={Settings}
          title={t("settings")}
          description={t("settingsSub")}
          actions={
            <>
              {dirty && (
                <Badge variant="outline" className="border-warning/50 text-warning">
                  Unsaved changes
                </Badge>
              )}
              <Button
                type="button"
                variant="ghost"
                disabled={!dirty || pending}
                onClick={() => {
                  setS(saved);
                  setTags(savedTags);
                }}
              >
                <RotateCcw /> Reset
              </Button>
              <Button type="submit" disabled={pending || !dirty}>
                {pending ? <Loader2 className="animate-spin" /> : <Save />} Save settings
              </Button>
            </>
          }
        />
        <FrameBody className="lg:grid-cols-2 fit:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
          <Pane icon={Palette} title="Branding" description="How the portal names itself.">
            <div className="grid gap-3">
              <div className="flex items-center gap-3 rounded-xl border bg-gradient-to-br from-primary/10 to-aurora/10 p-3">
                <Logo className="size-10 shrink-0" />
                <div className="min-w-0">
                  <p className="truncate font-semibold tracking-tight">{s.displayName || "—"}</p>
                  <p className="truncate text-xs text-muted-foreground">{s.tagline || "—"}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="dn">Display name</Label>
                  <Input id="dn" value={s.displayName} onChange={(e) => set("displayName", e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="tl">Tagline</Label>
                  <Input id="tl" value={s.tagline} onChange={(e) => set("tagline", e.target.value)} />
                </div>
              </div>
            </div>
          </Pane>

          <Pane icon={Languages} title="Languages" description="Konkani output is on the roadmap.">
            <div className="grid gap-2">
              {(["en", "hi"] as const).map((l) => (
                <label key={l} className="flex items-center justify-between gap-3 rounded-xl border bg-background p-3 text-sm">
                  <span>
                    <span className="font-medium">{l === "en" ? "English" : "हिंदी (Hindi)"}</span>
                    <span className="block text-xs text-muted-foreground">{l === "en" ? "Interface and generated content" : "Interface and generated content; drafts need the AI service"}</span>
                  </span>
                  <Switch checked={s.languages[l]} onCheckedChange={(v) => set("languages", { ...s.languages, [l]: v })} />
                </label>
              ))}
            </div>
          </Pane>

          <Pane icon={Hash} title="Channel templates" description="Defaults the Content Studio starts from.">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="tags">Default hashtags</Label>
                <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} />
                {tagList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tagList.map((h, i) => (
                      <Badge key={`${h}-${i}`} variant="secondary">
                        {h.startsWith("#") ? h : `#${h}`}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="xl">X character limit</Label>
                <Input id="xl" type="number" min={100} max={280} value={s.xLimit} onChange={(e) => set("xLimit", Number(e.target.value))} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="aud">Default audience</Label>
                <Select value={s.defaultAudience} onValueChange={(v) => set("defaultAudience", v as OrgSettings["defaultAudience"])}>
                  <SelectTrigger id="aud" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["public", "school", "college", "expert"] as const).map((a) => (
                      <SelectItem key={a} value={a} className="capitalize">
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Pane>

          <Pane icon={Timer} title="Embargo defaults" description="What the upload release question starts with. Staff must still confirm it for every file.">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="rel">Default release answer</Label>
                <Select value={s.defaultRelease} onValueChange={(v) => set("defaultRelease", v as OrgSettings["defaultRelease"])}>
                  <SelectTrigger id="rel" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal (safest)</SelectItem>
                    <SelectItem value="embargo">Embargoed</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ed">Default embargo length (days)</Label>
                <Input id="ed" type="number" min={1} max={730} value={s.defaultEmbargoDays} onChange={(e) => set("defaultEmbargoDays", Number(e.target.value))} />
              </div>
            </div>
          </Pane>
        </FrameBody>
      </Frame>
    </form>
  );
}
