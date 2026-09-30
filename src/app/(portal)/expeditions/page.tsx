import { getRepo } from "@/lib/auth";
import { ExpeditionBrowser } from "./expedition-browser";

export const metadata = { title: "Expeditions" };

export default async function ExpeditionsPage() {
  const repo = await getRepo();
  const [expeditions, items, stations] = await Promise.all([repo.expeditions(), repo.listItems(), repo.stations()]);
  // expedition id -> item type -> count
  const counts: Record<string, Record<string, number>> = {};
  for (const i of items) {
    if (!i.expedition_id) continue;
    const c = (counts[i.expedition_id] ??= {});
    c[i.type] = (c[i.type] ?? 0) + 1;
  }
  return <ExpeditionBrowser expeditions={expeditions} counts={counts} stations={Object.fromEntries(stations.map((s) => [s.id, s.name]))} />;
}
