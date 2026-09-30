import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, BookOpen, GraduationCap, History, MapPin, Newspaper, Search, Ship, Sparkles, type LucideIcon } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import { BorderBeam } from "@/components/ui/border-beam";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NumberTicker } from "@/components/ui/number-ticker";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SampleBadge } from "@/components/items/badges";
import { formatDate } from "@/components/items/item-card";
import { TYPE_ICON, TYPE_TONE } from "@/components/items/type-icon";
import { Cover } from "@/components/polar-art";
import { DeniedToast } from "./denied-toast";
import { getRepo, getViewer } from "@/lib/auth";
import { LIBRARY_SEGMENTS } from "@/lib/constants";
import type { Expedition } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata = { title: "Home" };

const monthYear = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-IN", { month: "short", year: "numeric", timeZone: "UTC" }) : null);
const period = (e: Expedition) => [monthYear(e.start_date), monthYear(e.end_date)].filter(Boolean).join(" – ");

/** Dashboard card: fixed header, body scrolls inside the card when the frame is short. */
function Panel({
  id,
  icon: Icon,
  title,
  count,
  href,
  linkLabel,
  className,
  children,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  count?: number;
  href: string;
  linkLabel: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn(
        "relative flex min-h-0 flex-col rounded-2xl border bg-card shadow-xs after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-5 after:rounded-b-2xl after:bg-gradient-to-t after:from-card",
        className,
      )}
    >
      <div className="flex shrink-0 items-center gap-2 px-4 pt-3 pb-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-aurora/15 text-primary lg:max-xl:hidden">
          <Icon className="size-4" aria-hidden />
        </span>
        <h2 id={id} className="truncate text-sm font-semibold tracking-tight">
          {title}
        </h2>
        {count != null && (
          <Badge variant="secondary" className="tabular-nums">
            {count}
          </Badge>
        )}
        <Link
          href={href}
          aria-label={`${linkLabel}: ${title}`}
          className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-md text-xs whitespace-nowrap font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {linkLabel} <ArrowRight className="size-3" aria-hidden />
        </Link>
      </div>
      {/* Radix wraps content in a display:table div, which defeats `truncate`; force it back to block. */}
      <ScrollArea className="min-h-0 flex-1 [&>[data-slot=scroll-area-viewport]>div]:block!">{children}</ScrollArea>
    </section>
  );
}

export default async function PortalHome({ searchParams }: PageProps<"/portal">) {
  const sp = await searchParams;
  const [t, tn, tc, tr, ts, tt, tu, viewer, repo] = await Promise.all([
    getTranslations("portal"),
    getTranslations("nav"),
    getTranslations("common"),
    getTranslations("regions"),
    getTranslations("expStatus"),
    getTranslations("types"),
    getTranslations("ui"),
    getViewer(),
    getRepo(),
  ]);
  const [counts, recent, expeditions, stories] = await Promise.all([
    repo.counts(),
    repo.listItems({ limit: 8 }),
    repo.expeditions(),
    repo.publishedArticles(4),
  ]);
  const codeOf = (id: string | null) => expeditions.find((e) => e.id === id)?.code ?? null;
  const featured = expeditions.find((e) => e.status === "ongoing") ?? expeditions[0];

  const hl = (chunks: React.ReactNode) => <span className="text-gradient">{chunks}</span>;

  const quickLinks = [
    { href: "/ask", label: tn("ask"), icon: Sparkles },
    { href: "/map", label: tn("map"), icon: MapPin },
    { href: "/stories", label: tn("stories"), icon: Newspaper },
    { href: "/learn/glossary", label: tn("glossary"), icon: BookOpen },
  ];

  return (
    <div
      data-fit
      className="mx-auto grid w-full max-w-[1600px] gap-3 p-4 lg:grid-cols-12 fit:h-full fit:min-h-[30rem] fit:grid-rows-[minmax(auto,2fr)_minmax(0,3fr)] tall:gap-4 tall:p-6"
    >
      {sp.denied && <DeniedToast />}

      {/* hero: welcome, search, library at a glance */}
      <BlurFade className="lg:col-span-12 xl:col-span-8">
        <section className="@container relative h-full overflow-hidden rounded-2xl border bg-card shadow-xs">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-aurora/10" />
          <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]" />
          <div className="pointer-events-none absolute -top-28 -right-16 size-72 rounded-full bg-aurora/20 blur-3xl [.hc_&]:hidden" />
          <div className="pointer-events-none absolute -bottom-36 -left-20 size-72 rounded-full bg-primary/20 blur-3xl [.hc_&]:hidden" />

          <div className="relative grid h-full items-center gap-5 p-5 @2xl:grid-cols-[minmax(0,1fr)_19rem] tall:p-7 @4xl:gap-8 @4xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-2.5 py-0.5 text-xs font-medium text-muted-foreground backdrop-blur">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-aurora opacity-60 motion-reduce:hidden" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-aurora" />
                </span>
                {tc("org")} · {t("eyebrow")}
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-balance tall:mt-3 tall:text-3xl @4xl:text-4xl">
                {viewer.name
                  ? t.rich("welcomeBack", { name: viewer.name.split(" ")[0], hl })
                  : t.rich("welcome", { hl })}
              </h1>
              <p className="mt-1.5 max-w-xl text-sm text-pretty text-muted-foreground tall:text-base">{t("subtitle")}</p>
              <form
                action="/explore"
                method="get"
                role="search"
                className="relative mt-3.5 flex max-w-lg items-center gap-2 rounded-xl border bg-background/80 p-1.5 shadow-lg shadow-primary/5 backdrop-blur tall:mt-5"
              >
                <Search className="ml-2 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <label htmlFor="portal-q" className="sr-only">
                  {t("quickSearch")}
                </label>
                <input id="portal-q" name="q" placeholder={t("quickSearch")} className="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                <Button type="submit" size="sm" className="h-8 rounded-lg px-3.5">
                  {tn("search")}
                </Button>
                <BorderBeam size={70} duration={10} colorFrom="var(--primary)" colorTo="var(--aurora)" />
              </form>
              <nav aria-label={t("quickLinks")} className="mt-4 hidden flex-wrap gap-2 max-lg:flex tall:flex">
                {quickLinks.map((q) => (
                  <Link
                    key={q.href}
                    href={q.href}
                    className="inline-flex items-center gap-1.5 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    <q.icon className="size-3.5 text-primary" aria-hidden /> {q.label}
                  </Link>
                ))}
              </nav>
            </div>

            <ul aria-label={tn("library")} className="grid grid-cols-3 gap-2">
              {Object.entries(LIBRARY_SEGMENTS).map(([seg, type]) => {
                const Icon = TYPE_ICON[type];
                return (
                  <li key={seg}>
                    <Link
                      href={`/library/${seg}`}
                      className="glass group block rounded-xl px-3 py-2.5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md tall:py-3.5"
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-xl leading-none font-semibold tracking-tight tabular-nums tall:text-2xl">
                          <NumberTicker value={counts[type]} />
                        </span>
                        <span className={cn("flex size-7 items-center justify-center rounded-lg border", TYPE_TONE[type])}>
                          <Icon className="size-3.5" aria-hidden />
                        </span>
                      </span>
                      <span className="mt-1.5 block truncate text-xs text-muted-foreground">{tn(seg as "reports")}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </BlurFade>

      {/* featured expedition */}
      <BlurFade delay={0.06} className="min-h-0 lg:max-xl:hidden xl:col-span-4">
        {featured && (
          <Link
            href={`/expeditions/${featured.code}`}
            className="group relative flex h-full min-h-56 flex-col justify-end overflow-hidden rounded-2xl border shadow-xs transition-shadow hover:shadow-xl fit:min-h-0"
          >
            <div className="absolute inset-0">
              <Cover src={featured.cover_url} className="transition-transform duration-700 group-hover:scale-105" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
            <div className="absolute top-3 right-3 left-3 flex flex-wrap items-center gap-1.5">
              <Badge className="bg-black/55 font-mono text-white backdrop-blur">{featured.code}</Badge>
              <Badge className="gap-1.5 bg-black/55 text-white backdrop-blur">
                {featured.status === "ongoing" && <span className="size-1.5 rounded-full bg-aurora motion-safe:animate-pulse" />}
                {ts(featured.status)}
              </Badge>
              {featured.is_sample && <Badge className="ml-auto bg-black/55 text-white backdrop-blur">{tc("sample")}</Badge>}
            </div>
            <div className="relative p-4 text-white tall:p-5">
              <p className="text-[11px] font-medium tracking-wider text-white/75 uppercase">{t("featured")}</p>
              <h2 className="mt-1 line-clamp-2 text-lg leading-snug font-semibold tracking-tight tall:text-xl">{featured.title}</h2>
              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-white/80">
                <span className="truncate">
                  {tr(featured.region)}
                  {period(featured) && ` · ${period(featured)}`}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 font-medium text-white">
                  {tu("storyMode")} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </div>
            </div>
            <BorderBeam size={120} duration={12} colorFrom="var(--primary)" colorTo="var(--aurora)" />
          </Link>
        )}
      </BlurFade>

      {/* recently added */}
      <BlurFade delay={0.12} className="min-h-0 lg:col-span-5">
        <Panel id="recent-h" icon={History} title={t("recent")} href="/explore" linkLabel={tc("viewAll")} className="fit:h-full">
          <ul className="px-2 pb-4">
            {recent.map((item) => {
              const Icon = TYPE_ICON[item.type];
              const code = codeOf(item.expedition_id);
              return (
                <li key={item.id}>
                  <Link href={`/items/${item.id}`} className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/60">
                    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg border", TYPE_TONE[item.type])}>
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="grid min-w-0 flex-1">
                      <span className="truncate text-sm font-medium group-hover:text-primary" lang={item.language}>
                        {item.title}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {[tt(item.type), code, formatDate(item.event_date)].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    {item.is_sample && <SampleBadge className="shrink-0 lg:max-xl:hidden" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>
      </BlurFade>

      {/* expeditions */}
      <BlurFade delay={0.18} className="min-h-0 lg:col-span-4">
        <Panel id="exp-h" icon={Ship} title={t("expeditions")} count={counts.expeditions} href="/expeditions" linkLabel={tc("viewAll")} className="fit:h-full">
          <ul className="px-2 pb-4">
            {expeditions.map((e) => (
              <li key={e.id}>
                <Link href={`/expeditions/${e.code}`} className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/60">
                  <span className="relative h-9 w-14 shrink-0 overflow-hidden rounded-lg border">
                    <Cover src={e.cover_url} />
                  </span>
                  <span className="grid min-w-0 flex-1">
                    <span className="truncate text-sm font-medium group-hover:text-primary">{e.title}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      <span className="font-mono">{e.code}</span> · {tr(e.region)}
                    </span>
                  </span>
                  <Badge variant={e.status === "ongoing" ? "default" : e.status === "planned" ? "outline" : "secondary"} className="shrink-0 lg:max-xl:hidden">
                    {ts(e.status)}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </BlurFade>

      {/* stories + learn */}
      <BlurFade delay={0.24} className="flex min-h-0 flex-col gap-3 lg:col-span-3 tall:gap-4">
        <Panel id="stories-h" icon={Newspaper} title={t("stories")} href="/stories" linkLabel={tc("viewAll")} className="flex-1">
          {stories.length === 0 ? (
            <p className="px-4 pb-4 text-sm text-muted-foreground">{t("noStories")}</p>
          ) : (
            <ul className="px-2 pb-4">
              {stories.map((s) => (
                <li key={s.id}>
                  <Link href={`/stories/${s.slug}`} className="group grid gap-0.5 rounded-xl px-2 py-2 transition-colors hover:bg-muted/60">
                    <span className="line-clamp-2 text-sm leading-snug font-medium group-hover:text-primary" lang={s.language}>
                      {s.output.channel === "website_article" ? s.output.headline : ""}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {s.language.toUpperCase()} · {formatDate(s.published_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Link
          href="/learn"
          className="group relative flex shrink-0 items-center gap-3 overflow-hidden rounded-2xl border bg-gradient-to-br from-aurora/15 to-primary/10 p-3 transition-all hover:border-primary/40 hover:shadow-md tall:p-4"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <GraduationCap className="size-5" aria-hidden />
          </span>
          <span className="grid min-w-0 flex-1">
            <span className="truncate text-sm font-semibold">{t("learnCta")}</span>
            <span className="truncate text-xs text-muted-foreground">{t("startLearning")}</span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </BlurFade>
    </div>
  );
}
