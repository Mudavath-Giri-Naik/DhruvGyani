import { getTranslations } from "next-intl/server";
import { getRepo } from "@/lib/auth";
import { GlossaryList } from "./glossary-list";

export const metadata = { title: "Glossary" };

export default async function GlossaryPage() {
  const [t, repo] = await Promise.all([getTranslations("learn"), getRepo()]);
  const terms = (await repo.glossary()).sort((a, b) => a.term.localeCompare(b.term));
  return <GlossaryList terms={terms} description={`${t("glossaryBody")} ${t("hindiReview")}`} />;
}
