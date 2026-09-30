"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Download, ScrollText, Search, UserRound, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Frame, FrameBody, FrameHeader, MetaChip, Pane } from "@/components/frame";
import { EmptyState } from "@/components/page-header";
import type { AuditEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  publish: "bg-success/15 text-success",
  approve: "bg-primary/15 text-primary",
  reject: "bg-destructive/15 text-destructive",
  role: "bg-warning/15 text-warning",
  embargo: "bg-aurora/15 text-aurora",
};
const tone = (a: string) => Object.entries(TONE).find(([k]) => a.includes(k))?.[1] ?? "bg-muted text-muted-foreground";
const details = (a: AuditEntry) =>
  Object.entries(a.meta ?? {})
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
    .join(" · ");
const COLS = "md:grid-cols-[10.5rem_9rem_10rem_10rem_minmax(0,1fr)]";

export function AuditLog({ log }: { log: AuditEntry[] }) {
  const t = useTranslations("admin");
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("all");
  const [actor, setActor] = useState("all");
  // "item.publish" -> "item": the part before the dot groups related actions
  const groups = useMemo(() => [...new Set(log.map((a) => a.action.split(".")[0]))].sort(), [log]);
  const actors = useMemo(() => [...new Set(log.map((a) => a.actor_name ?? "System"))].sort(), [log]);

  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return log.filter(
      (a) =>
        (group === "all" || a.action.startsWith(`${group}.`) || a.action === group) &&
        (actor === "all" || (a.actor_name ?? "System") === actor) &&
        (!n || `${a.action} ${a.entity} ${a.actor_name ?? "system"} ${details(a)}`.toLowerCase().includes(n)),
    );
  }, [log, q, group, actor]);

  const exportCsv = () => {
    const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = ["when,who,action,entity,entity_id,details", ...list.map((a) => [a.at, a.actor_name ?? "System", a.action, a.entity, a.entity_id ?? "", details(a)].map(cell).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const el = document.createElement("a");
    el.href = url;
    el.download = "dhruvgyani-audit-log.csv";
    el.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Frame>
      <FrameHeader
        icon={ScrollText}
        title={t("audit")}
        description={t("auditSub")}
        actions={
          <>
            <MetaChip icon={Zap}>{log.length} events</MetaChip>
            <MetaChip icon={UserRound} className="max-sm:hidden">
              {actors.length} people
            </MetaChip>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={list.length === 0}>
              <Download /> CSV
            </Button>
          </>
        }
      />

      <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-2xl border bg-card/70 p-2 shadow-xs backdrop-blur">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search actions, people, details…" aria-label="Search the audit log" className="border-transparent bg-transparent pl-9 shadow-none" />
        </div>
        <Select value={group} onValueChange={setGroup}>
          <SelectTrigger size="sm" className="w-40" aria-label={t("action")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("action")}: any</SelectItem>
            {groups.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={actor} onValueChange={setActor}>
          <SelectTrigger size="sm" className="w-40" aria-label={t("who")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("who")}: anyone</SelectItem>
            {actors.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="px-1 text-xs text-muted-foreground tabular-nums" aria-live="polite">
          {list.length} of {log.length}
        </p>
      </div>

      <FrameBody>
        <Pane label={t("audit")} scroll={false}>
          {list.length === 0 ? (
            <div className="p-4">
              <EmptyState icon={<ScrollText className="size-5" />} title={log.length === 0 ? "No activity yet" : "Nothing matches these filters"} />
            </div>
          ) : (
            <div role="table" aria-label={t("audit")} className="flex min-h-0 flex-1 flex-col">
              <div role="rowgroup" className="hidden shrink-0 border-b bg-muted/40 md:block">
                <div role="row" className={cn("grid gap-3 px-4 py-2 text-xs font-medium text-muted-foreground", COLS)}>
                  <span role="columnheader">{t("when")}</span>
                  <span role="columnheader">{t("who")}</span>
                  <span role="columnheader">{t("action")}</span>
                  <span role="columnheader">{t("entity")}</span>
                  <span role="columnheader">Details</span>
                </div>
              </div>
              <div role="rowgroup" tabIndex={0} className="min-h-0 flex-1 divide-y outline-none fit:overflow-y-auto">
                {list.map((a) => (
                  <div key={a.id} role="row" className={cn("grid items-center gap-x-3 gap-y-1 px-4 py-2 text-sm transition-colors hover:bg-muted/40", COLS)}>
                    <span role="cell" className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                      {new Date(a.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                    <span role="cell" className="truncate">
                      {a.actor_name ?? "System"}
                    </span>
                    <span role="cell">
                      <span className={cn("rounded-full px-2 py-0.5 font-mono text-[11px]", tone(a.action))}>{a.action}</span>
                    </span>
                    <span role="cell" className="truncate font-mono text-xs text-muted-foreground">
                      {a.entity}
                      {a.entity_id ? ` · ${a.entity_id.slice(0, 8)}` : ""}
                    </span>
                    <span role="cell" className="truncate text-xs text-muted-foreground" title={details(a)}>
                      {details(a)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Pane>
      </FrameBody>
    </Frame>
  );
}
