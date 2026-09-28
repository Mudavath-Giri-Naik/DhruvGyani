import { getTranslations } from "next-intl/server";
import { PageHeader, PageShell } from "@/components/page-header";
import { getRepo, isStaff, requireRole } from "@/lib/auth";
import { AnalyticsBoard } from "./analytics-board";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  await requireRole(isStaff, "/studio/analytics");
  const [t, repo] = await Promise.all([getTranslations("analytics"), getRepo()]);
  const [stats, views, items, gens] = await Promise.all([repo.searchStats(14), repo.viewCounts(), repo.listItems({ includeNonPublic: true }), repo.listGenerations()]);
  const reviewed = gens.filter((g) => ["approved", "published", "rejected"].includes(g.status));
  const approved = reviewed.filter((g) => g.status !== "rejected").length;
  const byStatus = ["published", "in_review", "draft"].map((s) => ({ status: s, count: items.filter((i) => i.status === s).length }));
  const byChannel = ["website_article", "x", "facebook", "instagram", "linkedin"].map((c) => ({
    channel: c,
    approved: gens.filter((g) => g.channel === c && (g.status === "approved" || g.status === "published")).length,
    total: gens.filter((g) => g.channel === c).length,
  }));
  const topItems = Object.entries(views)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id, n]) => ({ id, title: items.find((i) => i.id === id)?.title ?? id.slice(0, 8), views: n }));
  return (
    <PageShell wide>
      <PageHeader title={t("title")} description={t("subtitle")} />
      <AnalyticsBoard
        byDay={stats.byDay}
        top={stats.top}
        noResult={stats.noResult}
        totals={{ searches: stats.total, views: stats.byDay.reduce((a, d) => a + d.views, 0), approvalRate: reviewed.length ? Math.round((approved / reviewed.length) * 100) : 0, reviewed: reviewed.length }}
        byStatus={byStatus}
        byChannel={byChannel}
        topItems={topItems}
      />
    </PageShell>
  );
}
