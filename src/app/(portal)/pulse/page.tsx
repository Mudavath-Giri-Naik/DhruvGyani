import { getTranslations } from "next-intl/server";
import { getRepo } from "@/lib/auth";
import { ITEM } from "@/lib/seed/data";
import { SEA_ICE } from "@/lib/seed/seaice";
import { PulseBoard, type PulseSeries } from "./pulse-board";

export const metadata = { title: "Polar Pulse" };

// the NSIDC series bundled with the app, each linked to its dataset item in the library
const SERIES: [keyof typeof SEA_ICE, string][] = [
  ["arcticSep", ITEM.dArcticSep],
  ["arcticMar", ITEM.dArcticMar],
  ["antarcticFeb", ITEM.dAntarcticFeb],
  ["antarcticSep", ITEM.dAntarcticSep],
];

export default async function PulsePage() {
  const [tr, repo] = await Promise.all([getTranslations("regions"), getRepo()]);
  const stations = await repo.stations();
  const series: PulseSeries[] = SERIES.map(([key, itemId]) => ({
    key,
    itemId,
    points: SEA_ICE[key].flatMap(([year, extent]) => (extent == null ? [] : [{ year, value: extent }])),
  }));
  return <PulseBoard series={series} stations={stations.map((s) => ({ id: s.id, name: s.name, regionLabel: tr(s.region), lat: s.lat, lng: s.lng }))} />;
}
