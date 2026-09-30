import { getRepo, isStaff, requireRole } from "@/lib/auth";
import { CalendarBoard } from "./calendar-board";

export const metadata = { title: "Polar Calendar" };

export default async function CalendarPage() {
  await requireRole(isStaff, "/studio/calendar");
  const repo = await getRepo();
  const [entries, items] = await Promise.all([repo.calendar(), repo.listItems()]);
  const map = Object.fromEntries(items.map((i) => [i.id, { id: i.id, title: i.title, type: i.type }]));
  return <CalendarBoard entries={entries} items={map} />;
}
