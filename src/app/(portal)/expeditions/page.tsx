import { getTranslations } from "next-intl/server";
import { PageHeader, PageShell } from "@/components/page-header";
import { getRepo } from "@/lib/auth";
import { ExpeditionBrowser } from "./expedition-browser";

export const metadata = { title: "Expeditions" };

export default async function ExpeditionsPage() {
  const [t, repo] = await Promise.all([getTranslations("expeditions"), getRepo()]);
  const [expeditions, items] = await Promise.all([repo.expeditions(), repo.listItems()]);
  const counts: Record<string, number> = {};
  for (const i of items) if (i.expedition_id) counts[i.expedition_id] = (counts[i.expedition_id] ?? 0) + 1;
  return (
    <PageShell>
      <PageHeader title={t("title")} description={t("subtitle")} />
      <ExpeditionBrowser expeditions={expeditions} counts={counts} />
    </PageShell>
  );
}
