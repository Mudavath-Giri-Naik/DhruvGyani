import { getRepo } from "@/lib/auth";
import { Explorer } from "./explorer";

export const metadata = { title: "Explore" };

export default async function ExplorePage({ searchParams }: PageProps<"/explore">) {
  const sp = await searchParams;
  const repo = await getRepo();
  const [expeditions, stations, items] = await Promise.all([repo.expeditions(), repo.stations(), repo.listItems()]);
  const disciplines = [...new Set(items.flatMap((i) => i.discipline))].sort();
  const years = [...new Set(items.map((i) => i.event_date?.slice(0, 4)).filter(Boolean) as string[])].sort().reverse();
  // most-used tags become topic chips on the start screen
  const tagCounts = new Map<string, number>();
  for (const i of items) for (const tag of i.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  const topics = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([tag]) => tag);
  return (
    <Explorer
      initialQuery={typeof sp.q === "string" ? sp.q : ""}
      expeditions={expeditions.map((e) => ({ id: e.id, label: e.code }))}
      stations={stations.map((s) => ({ id: s.id, label: s.name }))}
      disciplines={disciplines}
      years={years}
      topics={topics}
      total={items.length}
    />
  );
}
