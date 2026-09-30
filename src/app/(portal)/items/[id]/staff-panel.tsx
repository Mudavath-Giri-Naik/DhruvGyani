"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Pane } from "@/components/frame";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateItemRelease } from "@/app/actions/items";
import { isAiAllowed } from "@/lib/policy";
import type { Item, Role } from "@/lib/types";

export function StaffPanel({ item, role }: { item: Item; role: Role }) {
  const router = useRouter();
  const [status, setStatus] = useState(item.status);
  const [visibility, setVisibility] = useState(item.visibility);
  const [embargo, setEmbargo] = useState(item.embargo_until?.slice(0, 10) ?? "");
  const [pending, start] = useTransition();
  const canPublish = role === "reviewer" || role === "admin";
  const aiOk = isAiAllowed({ visibility, embargo_until: embargo ? new Date(embargo).toISOString() : null });

  const save = () =>
    start(async () => {
      const res = await updateItemRelease({
        itemId: item.id,
        status,
        visibility,
        embargo_until: embargo ? new Date(`${embargo}T00:00:00Z`).toISOString() : null,
      });
      if (res.ok) {
        toast.success("Release settings saved");
        router.refresh();
      } else toast.error(res.error);
    });

  return (
    <Pane icon={ShieldCheck} title="Staff controls" scroll={false} className="shrink-0 border-primary/30" bodyClassName="grid gap-3 px-4 pb-4 text-sm">
        <div className="grid gap-1.5">
          <Label htmlFor="st">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as Item["status"])}>
            <SelectTrigger id="st">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="in_review">In review</SelectItem>
              <SelectItem value="published" disabled={!canPublish}>
                Published {canPublish ? "" : "(reviewers only)"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="vis">Visibility</Label>
          <Select value={visibility} onValueChange={(v) => setVisibility(v as Item["visibility"])}>
            <SelectTrigger id="vis">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public (cleared for release)</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="emb">Embargo until</Label>
          <Input id="emb" type="date" value={embargo} onChange={(e) => setEmbargo(e.target.value)} />
        </div>
        <p className={aiOk ? "text-xs text-success" : "text-xs text-muted-foreground"}>
          {aiOk ? "AI features allowed for this item." : "AI disabled: not cleared for public release. Keyword search only."}
        </p>
        <Button onClick={save} disabled={pending}>
          {pending && <Loader2 className="animate-spin" />} Save
        </Button>
    </Pane>
  );
}
