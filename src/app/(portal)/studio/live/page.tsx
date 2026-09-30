import { getRepo, isStaff, requireRole } from "@/lib/auth";
import { LiveForm } from "./live-form";

export const metadata = { title: "Live Expedition" };

export default async function LivePage() {
  await requireRole(isStaff, "/studio/live");
  const repo = await getRepo();
  const expeditions = (await repo.expeditions()).map((e) => ({ id: e.id, code: e.code, start: e.start_date, status: e.status }));
  return <LiveForm expeditions={expeditions} />;
}
