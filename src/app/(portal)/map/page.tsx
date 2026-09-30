import { getTranslations } from "next-intl/server";
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
  return <StationMap stations={data} attribution={t("attribution")} />;
}
