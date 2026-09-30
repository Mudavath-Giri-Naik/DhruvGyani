import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getRepo, isStaff } from "@/lib/auth";
import { LIBRARY_SEGMENTS } from "@/lib/constants";
import { LibraryBrowser } from "./library-browser";

export async function generateMetadata({ params }: PageProps<"/library/[type]">) {
  const { type } = await params;
  const t = await getTranslations("nav");
  return { title: type in LIBRARY_SEGMENTS ? t(type as "reports") : "Library" };
}

export default async function LibraryPage({ params }: PageProps<"/library/[type]">) {
  const { type: seg } = await params;
  if (!(seg in LIBRARY_SEGMENTS)) notFound();
  const type = LIBRARY_SEGMENTS[seg as keyof typeof LIBRARY_SEGMENTS];
  const repo = await getRepo();
  const staff = isStaff(repo.viewer.role);
  const [items, expeditions, counts] = await Promise.all([repo.listItems({ type, includeNonPublic: staff }), repo.expeditions(), repo.counts()]);
  return (
    <LibraryBrowser
      segment={seg}
      type={type}
      items={items}
      expeditions={expeditions.map((e) => ({ id: e.id, code: e.code }))}
      counts={Object.fromEntries(Object.values(LIBRARY_SEGMENTS).map((k) => [k, counts[k]]))}
    />
  );
}
