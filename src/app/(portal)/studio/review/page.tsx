import { getTranslations } from "next-intl/server";
import { ListChecks } from "lucide-react";
import { EmptyState, PageHeader, PageShell } from "@/components/page-header";
import { getRepo, isStaff, requireRole } from "@/lib/auth";
import { ReviewQueue } from "./review-queue";

export const metadata = { title: "Review Queue" };

export default async function ReviewPage({ searchParams }: PageProps<"/studio/review">) {
  const viewer = await requireRole(isStaff, "/studio/review");
  const sp = await searchParams;
  const [t, repo] = await Promise.all([getTranslations("review"), getRepo()]);
  const all = await repo.listGenerations();
  const filter = typeof sp.status === "string" ? sp.status : "in_review";
  const wanted = typeof sp.id === "string" ? all.find((g) => g.id === sp.id) : undefined;
  const list = filter === "all" ? all : all.filter((g) => g.status === filter);
  const current = wanted ?? list[0] ?? null;
  const detail = current
    ? {
        generation: current,
        claims: await repo.claims(current.id),
        chunks: await repo.chunksFor([...new Set(current.citations.map((c) => c.item_id))]),
        comments: await repo.comments(current.id),
      }
    : null;
  const counts: Record<string, number> = {};
  for (const g of all) counts[g.status] = (counts[g.status] ?? 0) + 1;

  return (
    <PageShell wide>
      <PageHeader title={t("title")} description={t("subtitle")} />
      {all.length === 0 ? (
        <EmptyState icon={<ListChecks className="size-5" />} title={t("empty")} />
      ) : (
        <ReviewQueue list={list} counts={counts} total={all.length} filter={filter} detail={detail} viewer={{ id: viewer.id, role: viewer.role }} />
      )}
    </PageShell>
  );
}
