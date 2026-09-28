import { getTranslations } from "next-intl/server";
import { ScrollText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState, PageHeader, PageShell } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getRepo, isAdmin, requireRole } from "@/lib/auth";

export const metadata = { title: "Audit Log" };

const TONE: Record<string, string> = {
  publish: "bg-success/15 text-success",
  approve: "bg-primary/15 text-primary",
  reject: "bg-destructive/15 text-destructive",
  role: "bg-warning/15 text-warning",
  embargo: "bg-aurora/15 text-aurora",
};

export default async function AuditPage() {
  await requireRole(isAdmin, "/admin/audit");
  const [t, repo] = await Promise.all([getTranslations("admin"), getRepo()]);
  const log = await repo.auditLog(200);
  const tone = (a: string) => Object.entries(TONE).find(([k]) => a.includes(k))?.[1] ?? "bg-muted text-muted-foreground";
  return (
    <PageShell>
      <PageHeader title={t("audit")} description={t("auditSub")} />
      {log.length === 0 ? (
        <EmptyState icon={<ScrollText className="size-5" />} title="No activity yet" />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>{t("when")}</TableHead>
                  <TableHead>{t("who")}</TableHead>
                  <TableHead>{t("action")}</TableHead>
                  <TableHead>{t("entity")}</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {log.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-xs whitespace-nowrap tabular-nums">{new Date(a.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</TableCell>
                    <TableCell className="text-sm">{a.actor_name ?? "System"}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-0.5 font-mono text-[11px] ${tone(a.action)}`}>{a.action}</span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {a.entity}
                      {a.entity_id ? ` · ${a.entity_id.slice(0, 8)}` : ""}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                      {Object.entries(a.meta ?? {})
                        .filter(([, v]) => v !== null && v !== undefined && v !== "")
                        .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
                        .join(" · ")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ul className="space-y-2 md:hidden">
            {log.map((a) => (
              <li key={a.id} className="rounded-xl border bg-card p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {a.action}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{new Date(a.at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</span>
                </div>
                <p className="mt-1">{a.actor_name ?? "System"}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </PageShell>
  );
}
