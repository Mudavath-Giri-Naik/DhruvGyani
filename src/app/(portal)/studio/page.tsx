import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Activity, ArrowRight, CalendarDays, FilePlus2, FileText, GitPullRequestArrow, LayoutDashboard, ListChecks, SearchX, Sparkles, Upload } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Frame, FrameBody, FrameHeader, Pane } from "@/components/frame";
import { TypeIcon } from "@/components/items/type-icon";
import { ItemFlags } from "@/components/items/badges";
import { getRepo, isReviewer, isStaff, requireRole } from "@/lib/auth";
import { releaseDueEmbargoes } from "@/lib/embargo";
import { cn } from "@/lib/utils";

export const metadata = { title: "Studio overview" };

const msAgo = (days: number) => Date.now() - days * 86400000;

function ago(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
}

const PIPELINE = [
  { status: "draft", label: "Drafts", tone: "bg-muted-foreground/60" },
  { status: "in_review", label: "In review", tone: "bg-warning" },
  { status: "approved", label: "Approved", tone: "bg-primary" },
  { status: "published", label: "Published", tone: "bg-success" },
  { status: "rejected", label: "Rejected", tone: "bg-destructive" },
] as const;

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
    repo.auditLog(12),
  ]);
  const weekAgo = msAgo(7);
  const kpis = [
    { label: t("kpiPublished"), value: items.filter((i) => i.status === "published").length, icon: FileText, href: "/library/reports" },
    { label: t("kpiReview"), value: gens.filter((g) => g.status === "in_review").length + items.filter((i) => i.status === "in_review").length, icon: ListChecks, href: "/studio/review" },
    { label: t("kpiDrafts"), value: gens.filter((g) => g.status === "draft").length + items.filter((i) => i.status === "draft").length, icon: FilePlus2, href: "/studio/review?status=draft" },
    { label: t("kpiPacks"), value: gens.filter((g) => new Date(g.created_at).getTime() > weekAgo).length, icon: Sparkles, href: "/studio/content" },
  ];
  const upcoming = calendar.filter((c) => c.date >= new Date().toISOString().slice(0, 10)).slice(0, 6);
  const recent = [...items].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 8);
  const pipeline = PIPELINE.map((p) => ({ ...p, count: gens.filter((g) => g.status === p.status).length }));
  const pipelineMax = Math.max(1, ...pipeline.map((p) => p.count));

  return (
    <Frame>
      <FrameHeader
        icon={LayoutDashboard}
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

      <div className="grid shrink-0 grid-cols-2 gap-3 xl:grid-cols-4 tall:gap-4">
        {kpis.map((k, i) => (
          <BlurFade key={k.label} delay={0.05 * i}>
            <Link href={k.href} className="group flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-aurora/15 text-primary">
                <k.icon className="size-5" aria-hidden />
              </span>
              <span className="grid min-w-0">
                <span className="text-2xl leading-tight font-semibold tracking-tight tabular-nums">
                  <NumberTicker value={k.value} className="text-foreground" />
                </span>
                <span className="truncate text-xs text-muted-foreground">{k.label}</span>
              </span>
              <ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden />
            </Link>
          </BlurFade>
        ))}
      </div>

      <FrameBody className="lg:grid-cols-12 fit:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
        <Pane icon={SearchX} title={t("gaps")} description="Searched in the last 14 days, nothing found." count={stats.noResult.length} className="lg:col-span-5 lg:row-span-2">
          {stats.noResult.length === 0 ? (
            <p className="text-sm text-muted-foreground">No gaps. Every search found something.</p>
          ) : (
            <ul className="space-y-2">
              {stats.noResult.slice(0, 8).map((g) => (
                <li key={g.query} className="rounded-xl border bg-background p-3">
                  <p className="text-sm font-medium">
                    “{g.query.replace(/^ask: /, "")}”{g.query.startsWith("ask: ") && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-normal text-muted-foreground">Ask NCPOR</span>}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">{t("gapLine", { count: g.count })}</p>
                    <div className="flex gap-1.5">
                      <Button asChild size="xs" variant="outline">
                        <Link href="/studio/upload">
                          <Upload /> Add material
                        </Link>
                      </Button>
                      <Button asChild size="xs">
                        <Link href="/studio/content">
                          <Sparkles /> {t("createExplainer")}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Pane>

        <Pane
          icon={GitPullRequestArrow}
          title="Draft pipeline"
          count={gens.length}
          className="lg:col-span-4"
          action={
            <Link href="/studio/review?status=all" className="inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap text-muted-foreground hover:text-foreground">
              Review Queue <ArrowRight className="size-3" aria-hidden />
            </Link>
          }
        >
          <ul className="grid gap-2">
            {pipeline.map((p) => (
              <li key={p.status}>
                <Link href={`/studio/review?status=${p.status}`} className="group grid grid-cols-[5.5rem_1fr_2rem] items-center gap-2 rounded-lg px-1 py-1 text-sm transition-colors hover:bg-muted/60">
                  <span className="truncate text-muted-foreground group-hover:text-foreground">{p.label}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-muted">
                    <span className={cn("block h-full rounded-full", p.tone)} style={{ width: `${(p.count / pipelineMax) * 100}%` }} />
                  </span>
                  <span className="text-right font-medium tabular-nums">{p.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Pane>

        <Pane
          icon={CalendarDays}
          title={t("upcoming")}
          className="lg:col-span-3"
          action={
            <Link href="/studio/calendar" aria-label="Open calendar" className="text-muted-foreground hover:text-foreground">
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          }
        >
          <ul className="space-y-2.5">
            {upcoming.map((c) => (
              <li key={c.id} className="flex gap-3">
                <div className="flex w-11 shrink-0 flex-col items-center rounded-lg border bg-muted/40 py-1 text-center">
                  <span className="text-[10px] text-muted-foreground uppercase">{new Date(c.date).toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" })}</span>
                  <span className="text-base leading-none font-semibold">{new Date(c.date).getUTCDate()}</span>
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm leading-snug font-medium">{c.occasion}</p>
                  <p className="text-xs text-muted-foreground">{c.suggested_item_ids.length} suggested item(s)</p>
                </div>
              </li>
            ))}
          </ul>
        </Pane>

        <Pane icon={Upload} title={t("recentUploads")} className="lg:col-span-4" bodyClassName="px-2">
          <ul>
            {recent.map((i) => (
              <li key={i.id}>
                <Link href={`/items/${i.id}`} className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/60">
                  <TypeIcon type={i.type} className="shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium group-hover:text-primary" lang={i.language}>
                    {i.title}
                  </span>
                  <span className="hidden shrink-0 gap-1 2xl:flex">
                    <ItemFlags item={i} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Pane>

        <Pane
          icon={Activity}
          title={t("activity")}
          className="lg:col-span-3"
          action={
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-aurora opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex size-2 rounded-full bg-aurora" />
            </span>
          }
        >
          <ol className="relative space-y-3 border-l pl-4">
            {audit.map((a) => (
              <li key={a.id} className="relative text-sm">
                <span className="absolute top-1.5 -left-[21px] size-2 rounded-full bg-primary ring-4 ring-card" />
                <p className="leading-snug">
                  <span className="font-medium">{a.actor_name ?? "System"}</span> <span className="text-muted-foreground">{a.action.replace(".", " → ")}</span>
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {typeof a.meta?.title === "string" ? `${a.meta.title} · ` : ""}
                  {ago(a.at)}
                </p>
              </li>
            ))}
          </ol>
        </Pane>
      </FrameBody>
    </Frame>
  );
}
