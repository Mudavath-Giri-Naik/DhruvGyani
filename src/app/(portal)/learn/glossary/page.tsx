import { getTranslations } from "next-intl/server";
import { PageHeader, PageShell } from "@/components/page-header";
import { getRepo } from "@/lib/auth";
import { GlossaryList } from "./glossary-list";

export const metadata = { title: "Glossary" };

export default async function GlossaryPage() {
  const [t, repo] = await Promise.all([getTranslations("learn"), getRepo()]);
  const terms = (await repo.glossary()).sort((a, b) => a.term.localeCompare(b.term));
  return (
    <PageShell className="max-w-5xl">
      <PageHeader title={t("glossary")} description={`${t("glossaryBody")} ${t("hindiReview")}`} />
      <GlossaryList terms={terms} />
    </PageShell>
  );
}
