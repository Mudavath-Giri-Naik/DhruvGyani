import { getRepo, isAdmin, requireRole } from "@/lib/auth";
import { AuditLog } from "./audit-log";

export const metadata = { title: "Audit Log" };

export default async function AuditPage() {
  await requireRole(isAdmin, "/admin/audit");
  const repo = await getRepo();
  const log = await repo.auditLog(200);
  return <AuditLog log={log} />;
}
