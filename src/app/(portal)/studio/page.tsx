import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Activity, ArrowRight, CalendarDays, FilePlus2, FileText, ListChecks, SearchX, Sparkles, Upload } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NumberTicker } from "@/components/ui/number-ticker";
import { PageHeader, PageShell } from "@/components/page-header";
import { TypeIcon } from "@/components/items/type-icon";
import { ItemFlags } from "@/components/items/badges";
import { getRepo, isReviewer, isStaff, requireRole } from "@/lib/auth";
import { releaseDueEmbargoes } from "@/lib/embargo";

export const metadata = { title: "Studio overview" };

const msAgo = (days: number) => Date.now() - days * 86400000;

function ago(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
}

export default async function StudioOverview() {
  const viewer = await requireRole(isStaff, "/studio");
  const [t, repo] = await Promise.all([getTranslations("studio"), getRepo()]);
  // Lazy embargo check: release anything whose date has passed.
  if (isReviewer(viewer.role)) await releaseDueEmbargoes(repo).catch(() => []);
  const [items, gens, calendar, stats, audit] = await Promise.all([
    repo.listItems({ includeNonPublic: true }),
    repo.listGenerations(),
    repo.calendar(),
    repo.searchStats(14),
    repo.auditLog(8),
  ]);
  const weekAgo = msAgo(7);
  const kpis = [
    { label: t("kpiPublished"), value: items.filter((i) => i.status === "published").length, icon: FileText, href: "/library/reports" },
    { label: t("kpiReview"), value: gens.filter((g) => g.status === "in_review").length + items.filter((i) => i.status === "in_review").length, icon: ListChecks, href: "/studio/review" },
    { label: t("kpiDrafts"), value: gens.filter((g) => g.status === "draft").length + items.filter((i) => i.status === "draft").length, icon: FilePlus2, href: "/studio/review?status=draft" },
    { label: t("kpiPacks"), value: gens.filter((g) => new Date(g.created_at).getTime() > weekAgo).length, icon: Sparkles, href: "/studio/content" },
  ];
  const upcoming = calendar.filter((c) => c.date >= new Date().toISOString().slice(0, 10)).slice(0, 4);
  const recent = [...items].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);

  return (
    <PageShell>
      <PageHeader
        title={t("overview")}
        description={`${t("overviewSub")} · ${viewer.name}`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/studio/upload">
                <Upload /> Upload
              </Link>
            </Button>
            <Button asChild>
              <Link href="/studio/content">
                <Sparkles /> {t("contentTitle")}
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <BlurFade key={k.label} delay={0.05 * i}>
            <Link href={k.href} className="group block rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{k.label}</p>
                <span className="rounded-lg bg-gradient-to-br from-primary/15 to-aurora/15 p-2 text-primary">
                  <k.icon className="size-4" />
                </span>
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
                <NumberTicker value={k.value} />
              </p>
            </Link>
          </BlurFade>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SearchX className="size-5 text-warning" /> {t("gaps")}
            </CardTitle>
            <CardDescription>What people searched for in the last 14 days but couldn&apos;t find.</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.noResult.length === 0 ? (
              <p className="text-sm text-muted-foreground">No gaps. Every search found something.</p>
            ) : (
              <ul className="space-y-2">
                {stats.noResult.slice(0, 5).map((g) => (
                  <li key={g.query} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3">
                    <div>
                      <p className="font-medium">
                        “{g.query.replace(/^ask: /, "")}”{g.query.startsWith("ask: ") && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-normal text-muted-foreground">Ask NCPOR</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{t("gapLine", { count: g.count })} No explainer exists.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/studio/upload`}>
                          <Upload className="size-3.5" /> Add material
                        </Link>
                      </Button>
                      <Button asChild size="sm">
                        <Link href={`/studio/content`}>
                          <Sparkles className="size-3.5" /> {t("createExplainer")}
                        </Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="size-5 text-primary" /> {t("upcoming")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {upcoming.map((c) => (
                <li key={c.id} className="flex gap-3">
                  <div className="flex w-12 shrink-0 flex-col items-center rounded-lg border bg-muted/40 py-1 text-center">
                    <span className="text-[10px] uppercase text-muted-foreground">{new Date(c.date).toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" })}</span>
                    <span className="text-lg font-semibold leading-none">{new Date(c.date).getUTCDate()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-medium">{c.occasion}</p>
                    <p className="text-xs text-muted-foreground">{c.suggested_item_ids.length} suggested item(s)</p>
                  </div>
                </li>
              ))}
            </ul>
            <Button asChild variant="ghost" size="sm" className="mt-3 w-full">
              <Link href="/studio/calendar">
                Open calendar <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("recentUploads")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {recent.map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-2.5">
                  <TypeIcon type={i.type} className="text-muted-foreground" />
                  <Link href={`/items/${i.id}`} className="min-w-0 flex-1 truncate text-sm font-medium hover:text-primary" lang={i.language}>
                    {i.title}
                  </Link>
                  <div className="hidden flex-wrap gap-1 sm:flex">
                    <ItemFlags item={i} />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-5 text-aurora" /> {t("activity")}
              <span className="relative ml-1 flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-aurora opacity-60 motion-reduce:hidden" />
                <span className="relative inline-flex size-2 rounded-full bg-aurora" />
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="relative space-y-4 border-l pl-4">
              {audit.map((a) => (
                <li key={a.id} className="text-sm">
                  <span className="absolute -left-1 mt-1.5 size-2 rounded-full bg-primary" />
                  <p>
                    <span className="font-medium">{a.actor_name ?? "System"}</span> <span className="text-muted-foreground">{a.action.replace(".", " → ")}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {typeof a.meta?.title === "string" ? `${a.meta.title} · ` : ""}
                    {ago(a.at)}
                  </p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
