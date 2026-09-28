import { getTranslations } from "next-intl/server";
import { PageHeader, PageShell } from "@/components/page-header";
import { getRepo } from "@/lib/auth";
import { Explorer } from "./explorer";

export const metadata = { title: "Explore" };

export default async function ExplorePage({ searchParams }: PageProps<"/explore">) {
  const sp = await searchParams;
  const [t, repo] = await Promise.all([getTranslations("explore"), getRepo()]);
  const [expeditions, stations, items] = await Promise.all([repo.expeditions(), repo.stations(), repo.listItems()]);
  const disciplines = [...new Set(items.flatMap((i) => i.discipline))].sort();
  const years = [...new Set(items.map((i) => i.event_date?.slice(0, 4)).filter(Boolean) as string[])].sort().reverse();
  return (
    <PageShell>
      <PageHeader title={t("title")} description={t("subtitle")} />
      <Explorer
        initialQuery={typeof sp.q === "string" ? sp.q : ""}
        expeditions={expeditions.map((e) => ({ id: e.id, label: e.code }))}
        stations={stations.map((s) => ({ id: s.id, label: s.name }))}
        disciplines={disciplines}
        years={years}
      />
    </PageShell>
  );
}
