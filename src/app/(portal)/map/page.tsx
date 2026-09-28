import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { MapPin } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { getRepo } from "@/lib/auth";
import { StationMap } from "./station-map";

export const metadata = { title: "Stations map" };

export default async function MapPage() {
  const [t, tr, repo] = await Promise.all([getTranslations("map"), getTranslations("regions"), getRepo()]);
  const [stations, items, expeditions] = await Promise.all([repo.stations(), repo.listItems(), repo.expeditions()]);
  const data = stations.map((s) => ({
    ...s,
    regionLabel: tr(s.region),
    count: items.filter((i) => i.station_id === s.id).length,
    expeditions: expeditions.filter((e) => e.station_id === s.id).map((e) => e.code),
  }));
  return (
    <PageShell wide>
      <PageHeader title={t("title")} description={`${t("subtitle")} ${t("approx")}`} />
      <div className="overflow-hidden rounded-3xl border shadow-sm">
        <StationMap stations={data} attribution={t("attribution")} />
      </div>
      {/* Same information as a list, for screen readers and keyboard users */}
      <section aria-label="Stations list" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.map((s) => (
          <article key={s.id} className="rounded-2xl border bg-card p-4">
            <h2 className="flex items-center gap-2 font-semibold">
              <MapPin className="size-4 text-primary" /> {s.name}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {s.regionLabel} · {s.lat.toFixed(2)}°, {s.lng.toFixed(2)}° (approx.)
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{t("items", { count: s.count })}</Badge>
              {s.expeditions.map((code) => (
                <Link key={code} href={`/expeditions/${code}`} className="font-mono text-xs text-primary hover:underline">
                  {code}
                </Link>
              ))}
            </div>
          </article>
        ))}
      </section>
    </PageShell>
  );
}
