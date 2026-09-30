import { getRepo, isStaff, requireRole } from "@/lib/auth";
import { isLlmConfigured } from "@/lib/env";
import { isPubliclyVisible } from "@/lib/policy";
import { ContentStudio } from "./content-studio";

export const metadata = { title: "Content Studio" };

export default async function ContentStudioPage({ searchParams }: PageProps<"/studio/content">) {
  const viewer = await requireRole(isStaff, "/studio/content");
  const sp = await searchParams;
  const repo = await getRepo();
  const [items, expeditions] = await Promise.all([repo.listItems(), repo.expeditions()]);
  const sources = items
    .filter((i) => isPubliclyVisible(i))
    .map((i) => ({ id: i.id, title: i.title, type: i.type, language: i.language, is_sample: i.is_sample, code: expeditions.find((e) => e.id === i.expedition_id)?.code ?? null }));

  let initial = null;
  if (typeof sp.id === "string" && /^[0-9a-f-]{36}$/i.test(sp.id)) {
    const g = await repo.getGeneration(sp.id);
    if (g) initial = { generation: g, claims: await repo.claims(g.id), chunks: await repo.chunksFor([...new Set(g.citations.map((c) => c.item_id))]) };
  }
  const preselect = typeof sp.items === "string" ? sp.items.split(",").filter((id) => sources.some((s) => s.id === id)) : [];

  return <ContentStudio sources={sources} initial={initial} preselect={preselect} aiLive={isLlmConfigured()} role={viewer.role} />;
}
