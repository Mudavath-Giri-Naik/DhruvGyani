import { getTranslations } from "next-intl/server";
import { PageHeader, PageShell } from "@/components/page-header";
import { AskChat } from "./ask-chat";

export const metadata = { title: "Ask NCPOR" };

export default async function AskPage({ searchParams }: PageProps<"/ask">) {
  const sp = await searchParams;
  const t = await getTranslations("ask");
  return (
    <PageShell className="max-w-4xl">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <AskChat initial={typeof sp.q === "string" ? sp.q.slice(0, 300) : ""} />
    </PageShell>
  );
}
