import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader, PageShell } from "@/components/page-header";
import { TypeBadge } from "@/components/items/badges";
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
  const [t, tn, repo] = await Promise.all([getTranslations("library"), getTranslations("nav"), getRepo()]);
  const staff = isStaff(repo.viewer.role);
  const [items, expeditions] = await Promise.all([repo.listItems({ type, includeNonPublic: staff }), repo.expeditions()]);
  const label = tn(seg as "reports");
  return (
    <PageShell>
      <PageHeader
        eyebrow={<TypeBadge type={type} />}
        title={t("title", { type: label })}
        description={t("subtitle", { type: label.toLowerCase() })}
      />
      <LibraryBrowser items={items} expeditions={expeditions.map((e) => ({ id: e.id, code: e.code }))} />
    </PageShell>
  );
}
