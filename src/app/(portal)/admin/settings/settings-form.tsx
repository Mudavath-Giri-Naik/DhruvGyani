"use client";

import { useState, useTransition } from "react";
import { Hash, Languages, Loader2, Palette, Save, Timer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { saveSettings } from "@/app/actions/admin";
import type { OrgSettings } from "@/lib/types";

export function SettingsForm({ initial }: { initial: OrgSettings }) {
  const [s, setS] = useState(initial);
  const [tags, setTags] = useState(initial.hashtags.join(" "));
  const [pending, start] = useTransition();
  const set = <K extends keyof OrgSettings>(k: K, v: OrgSettings[K]) => setS((x) => ({ ...x, [k]: v }));

  const save = () =>
    start(async () => {
      const res = await saveSettings({ ...s, hashtags: tags.split(/[\s,]+/).filter(Boolean) });
      if (res.ok) toast.success("Settings saved");
      else toast.error(res.error);
    });

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="size-4 text-primary" /> Branding
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="dn">Display name</Label>
            <Input id="dn" value={s.displayName} onChange={(e) => set("displayName", e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tl">Tagline</Label>
            <Input id="tl" value={s.tagline} onChange={(e) => set("tagline", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Languages className="size-4 text-primary" /> Languages
          </CardTitle>
          <CardDescription>Konkani output is on the roadmap.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-6">
          {(["en", "hi"] as const).map((l) => (
            <label key={l} className="flex items-center gap-3 text-sm">
              <Switch checked={s.languages[l]} onCheckedChange={(v) => set("languages", { ...s.languages, [l]: v })} />
              {l === "en" ? "English" : "हिंदी (Hindi)"}
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Hash className="size-4 text-primary" /> Channel templates
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-1.5 md:col-span-2">
            <Label htmlFor="tags">Default hashtags</Label>
            <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="xl">X character limit</Label>
            <Input id="xl" type="number" min={100} max={280} value={s.xLimit} onChange={(e) => set("xLimit", Number(e.target.value))} />
          </div>
          <div className="grid gap-1.5">
            <Label>Default audience</Label>
            <Select value={s.defaultAudience} onValueChange={(v) => set("defaultAudience", v as OrgSettings["defaultAudience"])}>
              <SelectTrigger>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Timer className="size-4 text-primary" /> Embargo defaults
          </CardTitle>
          <CardDescription>What the upload release question starts with. Staff must still confirm it for every file.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-1.5">
            <Label>Default release answer</Label>
            <Select value={s.defaultRelease} onValueChange={(v) => set("defaultRelease", v as OrgSettings["defaultRelease"])}>
              <SelectTrigger>
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
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Save />} Save settings
        </Button>
      </div>
    </form>
  );
}
