import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CalendarRange, ChevronLeft, ChevronRight, Clock, Compass, MapPin, Quote, Route, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BlurFade } from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import { Frame, FrameBody, MetaChip, Pane } from "@/components/frame";
import { PolarArt, artVariant } from "@/components/polar-art";
import { SetCrumb } from "@/components/shell/breadcrumbs";
import { SampleBadge } from "@/components/items/badges";
import { TYPE_ICON, TYPE_TONE, TypeIcon } from "@/components/items/type-icon";
import { formatDate } from "@/components/items/item-card";
import { getRepo } from "@/lib/auth";
import { ITEM_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ShareButton } from "./story-client";
import { ArchiveTabs } from "./archive-tabs";

export async function generateMetadata({ params }: PageProps<"/expeditions/[code]">) {
  const { code } = await params;
  return { title: decodeURIComponent(code) };
}

export default async function ExpeditionStory({ params }: PageProps<"/expeditions/[code]">) {
  const { code } = await params;
  const [t, tr, ts, tt, tu, repo] = await Promise.all([
    getTranslations("expeditions"),
    getTranslations("regions"),
    getTranslations("expStatus"),
    getTranslations("types"),
    getTranslations("ui"),
    getRepo(),
  ]);
  const exp = await repo.expeditionByCode(decodeURIComponent(code));
  if (!exp) notFound();

  const [items, stations, stories, all] = await Promise.all([
    repo.listItems({ expeditionId: exp.id, sort: "oldest", includeNonPublic: false }),
    repo.stations(),
    repo.publishedArticles(50),
    repo.expeditions(),
  ]);
  const station = stations.find((s) => s.id === exp.station_id) ?? null;
  const itemIds = new Set(items.map((i) => i.id));
  const linkedStories = stories.filter((s) => s.item_ids.some((id) => itemIds.has(id)));
  const facts = linkedStories
    .flatMap((s) => (s.output.channel === "website_article" ? s.output.key_facts.map((f) => ({ text: f.text.replace(/\s*\[c\d+\]/g, ""), slug: s.slug, lang: s.language })) : []))
    .filter((f) => f.lang === "en")
    .slice(0, 4);

  // Timeline: expedition bounds + dated items, oldest first.
  const timeline = [
    ...(exp.start_date ? [{ date: exp.start_date, label: tu("expeditionBegins"), type: null as string | null, href: null as string | null }] : []),
    ...items.filter((i) => i.event_date).map((i) => ({ date: i.event_date!, label: i.title, type: i.type as string | null, href: `/items/${i.id}` })),
    ...(exp.end_date ? [{ date: exp.end_date, label: exp.status === "completed" ? tu("expeditionConcludes") : tu("plannedEnd"), type: null, href: null }] : []),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const byType = Object.fromEntries(ITEM_TYPES.map((type) => [type, items.filter((i) => i.type === type)]));
  const days = exp.start_date && exp.end_date ? Math.max(1, Math.round((new Date(exp.end_date).getTime() - new Date(exp.start_date).getTime()) / 86400000) + 1) : null;

  // neighbours, newest first, for the previous / next buttons
  const ordered = [...all].sort((a, b) => (b.start_date ?? "").localeCompare(a.start_date ?? ""));
  const pos = ordered.findIndex((e) => e.id === exp.id);
  const prev = pos > 0 ? ordered[pos - 1] : null;
  const next = pos >= 0 && pos < ordered.length - 1 ? ordered[pos + 1] : null;

  return (
    <Frame>
      <SetCrumb label={exp.code} />
      <FrameBody className="lg:grid-cols-12">
        {/* hero */}
        <BlurFade className="min-h-0 lg:col-span-4">
          <article className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border bg-card shadow-xs">
            <header className="relative flex min-h-44 flex-1 flex-col justify-end overflow-hidden short:min-h-36 tall:min-h-56">
              <div className="absolute inset-0">
                <PolarArt variant={artVariant(exp.cover_url) ?? "aurora"} />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/15" />
              <div className="absolute inset-x-3 top-3 flex flex-wrap items-center gap-1.5">
                <Badge className="bg-black/55 font-mono text-white backdrop-blur">{exp.code}</Badge>
                <Badge className="gap-1.5 bg-black/55 text-white backdrop-blur">
                  {exp.status === "ongoing" && <span className="size-1.5 rounded-full bg-aurora motion-safe:animate-pulse" />}
                  {ts(exp.status)}
                </Badge>
                {exp.is_sample && <SampleBadge className="bg-background" />}
                <span className="ml-auto flex gap-1">
                  {prev ? (
                    <Button asChild size="icon-sm" variant="secondary" className="rounded-full">
                      <Link href={`/expeditions/${prev.code}`} aria-label={t("newer", { code: prev.code })} title={prev.code}>
                        <ChevronLeft />
                      </Link>
                    </Button>
                  ) : null}
                  {next ? (
                    <Button asChild size="icon-sm" variant="secondary" className="rounded-full">
                      <Link href={`/expeditions/${next.code}`} aria-label={t("older", { code: next.code })} title={next.code}>
                        <ChevronRight />
                      </Link>
                    </Button>
                  ) : null}
                </span>
              </div>
              <div className="relative p-4 text-white">
                <p className="text-[11px] font-medium tracking-wider text-white/75 uppercase">{t("storyMode")}</p>
                <h1 className="mt-1 text-xl leading-snug font-semibold tracking-tight text-balance tall:text-2xl">{exp.title}</h1>
              </div>
            </header>
            <div className="min-h-0 shrink space-y-3 overflow-y-auto p-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <MetaChip icon={Compass}>{tr(exp.region)}</MetaChip>
                <MetaChip icon={CalendarRange}>{exp.start_date ? `${formatDate(exp.start_date)} – ${exp.end_date ? formatDate(exp.end_date) : t("tbd")}` : t("tbd")}</MetaChip>
                {days && <MetaChip icon={Clock}>{t("days", { count: days })}</MetaChip>}
                <ShareButton title={exp.title} />
              </div>
              <section aria-labelledby="summary-h">
                <h2 id="summary-h" className="text-[11px] font-semibold tracking-wider text-primary uppercase">
                  {t("summary")}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-pretty">{exp.summary}</p>
              </section>
              <dl className="grid grid-cols-3 gap-2">
                {ITEM_TYPES.map((type) => {
                  const Icon = TYPE_ICON[type];
                  return (
                    <div key={type} className="rounded-xl border bg-background p-2">
                      <dd className="flex items-center justify-between">
                        <span className="text-base leading-none font-semibold tabular-nums">{byType[type].length}</span>
                        <span className={cn("flex size-6 items-center justify-center rounded-md border", TYPE_TONE[type])}>
                          <Icon className="size-3" aria-hidden />
                        </span>
                      </dd>
                      <dt className="mt-1 truncate text-[11px] text-muted-foreground">{tt(type)}</dt>
                    </div>
                  );
                })}
              </dl>
              {station && (
                <section aria-labelledby="station-h" className="rounded-xl border bg-gradient-to-br from-primary/10 to-aurora/10 p-3">
                  <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{t("station")}</p>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <h2 id="station-h" className="flex items-center gap-1.5 text-sm font-semibold">
                      <MapPin className="size-4 text-primary" aria-hidden /> {station.name}
                    </h2>
                    <Link href="/map" className="shrink-0 text-xs font-medium text-primary underline-offset-4 hover:underline">
                      {tu("openMap")}
                    </Link>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{station.description}</p>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    {station.lat.toFixed(2)}°, {station.lng.toFixed(2)}° ({tu("approx")})
                  </p>
                </section>
              )}
            </div>
          </article>
        </BlurFade>

        {/* journey timeline */}
        <BlurFade delay={0.08} className="min-h-0 lg:col-span-3">
          <Pane icon={Route} title={t("journey")} count={timeline.length} className="h-full">
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("tbd")}</p>
            ) : (
              <ol className="relative space-y-4 pt-1 before:absolute before:top-2 before:bottom-2 before:left-[7px] before:w-0.5 before:bg-gradient-to-b before:from-primary before:via-aurora before:to-primary/10">
                {timeline.map((ev, i) => (
                  <li key={`${ev.date}-${i}`} className="relative pl-7">
                    <span className="absolute top-1 left-0 flex size-4 items-center justify-center rounded-full bg-card ring-2 ring-primary">
                      <span className="size-1.5 rounded-full bg-primary" />
                    </span>
                    <p className="text-[11px] font-medium text-muted-foreground tabular-nums">{formatDate(ev.date)}</p>
                    {ev.href ? (
                      <Link href={ev.href} className="mt-0.5 flex items-start gap-1.5 text-sm leading-snug font-medium hover:text-primary">
                        {ev.type && <TypeIcon type={ev.type} className="mt-0.5 size-3.5 shrink-0 text-primary" />} <span>{ev.label}</span>
                      </Link>
                    ) : (
                      <p className="mt-0.5 text-sm font-medium">{ev.label}</p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </Pane>
        </BlurFade>

        {/* archive + highlights */}
        <BlurFade delay={0.16} className="flex min-h-0 flex-col gap-3 lg:col-span-5 tall:gap-4">
          <ArchiveTabs byType={byType} className="fit:flex-[3]" />
          {facts.length > 0 && (
            <Pane icon={Sparkles} title={t("keyFindings")} className="fit:flex-[2]">
              <ul className="grid gap-2">
                {facts.map((f, i) => (
                  <li key={i}>
                    <Link href={`/stories/${f.slug}`} className="group flex gap-2.5 rounded-xl border bg-gradient-to-br from-primary/5 to-aurora/5 p-3 transition-all hover:border-primary/40 hover:shadow-sm">
                      <Quote className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                      <p className="text-sm leading-snug font-medium group-hover:text-primary">{f.text}</p>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-muted-foreground">{tu("factsNote")}</p>
            </Pane>
          )}
        </BlurFade>
      </FrameBody>
    </Frame>
  );
}
