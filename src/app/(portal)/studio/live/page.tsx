import { PageHeader, PageShell } from "@/components/page-header";
import { getRepo, isStaff, requireRole } from "@/lib/auth";
import { LiveForm } from "./live-form";

export const metadata = { title: "Live Expedition" };

export default async function LivePage() {
  await requireRole(isStaff, "/studio/live");
  const repo = await getRepo();
  const expeditions = (await repo.expeditions()).map((e) => ({ id: e.id, code: e.code, start: e.start_date, status: e.status }));
  return (
    <PageShell className="max-w-xl">
      <PageHeader
        title="Live Expedition Mode"
        description="For field teams on a phone: snap a photo, add a note, send. It becomes a “Day N” update in the Review Queue — nothing goes public without a reviewer."
      />
      <LiveForm expeditions={expeditions} />
    </PageShell>
  );
}
