import { getTranslations } from "next-intl/server";
import { PageHeader, PageShell } from "@/components/page-header";
import { getRepo, isStaff, requireRole } from "@/lib/auth";
import { CalendarBoard } from "./calendar-board";

export const metadata = { title: "Polar Calendar" };

export default async function CalendarPage() {
  await requireRole(isStaff, "/studio/calendar");
  const [t, repo] = await Promise.all([getTranslations("calendar"), getRepo()]);
  const [entries, items] = await Promise.all([repo.calendar(), repo.listItems()]);
  const map = Object.fromEntries(items.map((i) => [i.id, { id: i.id, title: i.title, type: i.type }]));
  return (
    <PageShell>
      <PageHeader title={t("title")} description={t("subtitle")} />
      <CalendarBoard entries={entries} items={map} />
    </PageShell>
  );
}
