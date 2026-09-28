import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, GraduationCap, Newspaper, Search, Ship } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NumberTicker } from "@/components/ui/number-ticker";
import { ItemCard, formatDate } from "@/components/items/item-card";
import { TYPE_ICON, TYPE_TONE } from "@/components/items/type-icon";
import { PolarArt, artVariant } from "@/components/polar-art";
import { PageShell } from "@/components/page-header";
import { DeniedToast } from "./denied-toast";
import { getRepo, getViewer } from "@/lib/auth";
import { LIBRARY_SEGMENTS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata = { title: "Home" };

export default async function PortalHome({ searchParams }: PageProps<"/portal">) {
  const sp = await searchParams;
  const [t, tn, tr, ts, viewer, repo] = await Promise.all([
    getTranslations("portal"),
    getTranslations("nav"),
    getTranslations("regions"),
    getTranslations("expStatus"),
    getViewer(),
    getRepo(),
  ]);
  const [counts, recent, expeditions, stories] = await Promise.all([
    repo.counts(),
    repo.listItems({ limit: 6 }),
    repo.expeditions(),
    repo.publishedArticles(3),
  ]);
  const codeOf = (id: string | null) => expeditions.find((e) => e.id === id)?.code ?? null;

  return (
    <PageShell>
      {sp.denied && <DeniedToast />}

      {/* welcome banner */}
      <BlurFade>
        <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-aurora/10 p-6 md:p-10">
          <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]" />
          <div className="relative max-w-2xl">
            <h1 className="text-2xl font-semibold tracking-tight md:text-4xl">
              {viewer.name ? t("welcomeBack", { name: viewer.name.split(" ")[0] }) : t("welcome")}
            </h1>
            <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
            <form action="/explore" method="get" role="search" className="mt-6 flex max-w-lg items-center gap-2 rounded-xl border bg-background/80 p-1.5 shadow-sm backdrop-blur">
              <Search className="ml-2 size-4 text-muted-foreground" aria-hidden />
              <label htmlFor="portal-q" className="sr-only">
                {t("quickSearch")}
              </label>
              <input id="portal-q" name="q" placeholder={t("quickSearch")} className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none" />
              <Button type="submit" size="sm">
                {tn("search")}
              </Button>
            </form>
          </div>
        </section>
      </BlurFade>

      {/* library shortcuts with counts */}
      <section aria-label={tn("library")} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Object.entries(LIBRARY_SEGMENTS).map(([seg, type], i) => {
          const Icon = TYPE_ICON[type];
          return (
            <BlurFade key={seg} delay={0.04 * i}>
              <Link
                href={`/library/${seg}`}
                className="group flex items-center gap-3 rounded-xl border bg-card p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <span className={cn("flex size-9 items-center justify-center rounded-lg border", TYPE_TONE[type])}>
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="grid">
                  <span className="text-lg font-semibold leading-none tabular-nums">
                    <NumberTicker value={counts[type]} />
                  </span>
                  <span className="text-xs text-muted-foreground">{tn(seg as "reports")}</span>
                </span>
              </Link>
            </BlurFade>
          );
        })}
      </section>

      {/* expeditions */}
      <section aria-labelledby="exp-h" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="exp-h" className="flex items-center gap-2 text-lg font-semibold">
            <Ship className="size-5 text-primary" /> {t("expeditions")}
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/expeditions">
              {tn("expeditions")} <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 xl:grid-cols-5">
          {expeditions.map((e, i) => (
            <BlurFade key={e.id} delay={0.05 * i} className="w-64 shrink-0 snap-start md:w-auto">
              <Link href={`/expeditions/${e.code}`} className="group block overflow-hidden rounded-xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <div className="relative aspect-[16/10]">
                  <PolarArt variant={artVariant(e.cover_url) ?? "aurora"} className="transition-transform duration-500 group-hover:scale-105" />
                  <Badge className="absolute top-2 left-2 bg-black/55 font-mono text-white backdrop-blur">{e.code}</Badge>
                </div>
                <div className="space-y-1 p-3">
                  <p className="line-clamp-1 text-sm font-medium">{e.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {tr(e.region)} · {ts(e.status)}
                  </p>
                </div>
              </Link>
            </BlurFade>
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* recent */}
        <section aria-labelledby="recent-h" className="space-y-4 lg:col-span-2">
          <h2 id="recent-h" className="text-lg font-semibold">
            {t("recent")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {recent.map((item, i) => (
              <BlurFade key={item.id} delay={0.04 * i} inView>
                <ItemCard item={item} expeditionCode={codeOf(item.expedition_id)} />
              </BlurFade>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <section aria-labelledby="stories-h" className="rounded-xl border bg-card p-4">
            <h2 id="stories-h" className="flex items-center gap-2 font-semibold">
              <Newspaper className="size-4 text-primary" /> {t("stories")}
            </h2>
            <ul className="mt-3 divide-y">
              {stories.map((s) => (
                <li key={s.id} className="py-3">
                  <Link href={`/stories/${s.slug}`} className="group grid gap-1">
                    <span className="line-clamp-2 text-sm font-medium group-hover:text-primary" lang={s.language}>
                      {s.output.channel === "website_article" ? s.output.headline : ""}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {s.language.toUpperCase()} · {formatDate(s.published_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <section className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-aurora/15 to-primary/10 p-5">
            <GraduationCap className="size-8 text-primary" />
            <h2 className="mt-3 font-semibold">{t("learnCta")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("learnCtaBody")}</p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/learn">{t("startLearning")}</Link>
            </Button>
          </section>
        </aside>
      </div>
    </PageShell>
  );
}
