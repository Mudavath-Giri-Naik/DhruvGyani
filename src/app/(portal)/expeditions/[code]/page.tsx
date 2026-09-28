import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CalendarRange, MapPin, Quote, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BlurFade } from "@/components/ui/blur-fade";
import { PolarArt, artVariant } from "@/components/polar-art";
import { SetCrumb } from "@/components/shell/breadcrumbs";
import { TypeIcon } from "@/components/items/type-icon";
import { formatDate } from "@/components/items/item-card";
import { getRepo } from "@/lib/auth";
import { ITEM_TYPES } from "@/lib/constants";
import { ScrollProgress, ShareButton } from "./story-client";
import { ArchiveTabs } from "./archive-tabs";

export async function generateMetadata({ params }: PageProps<"/expeditions/[code]">) {
  const { code } = await params;
  return { title: decodeURIComponent(code) };
}

export default async function ExpeditionStory({ params }: PageProps<"/expeditions/[code]">) {
  const { code } = await params;
  const [t, tr, ts, tt, repo] = await Promise.all([
    getTranslations("expeditions"),
    getTranslations("regions"),
    getTranslations("expStatus"),
    getTranslations("types"),
    getRepo(),
  ]);
  const exp = await repo.expeditionByCode(decodeURIComponent(code));
  if (!exp) notFound();

  const [items, stations, stories] = await Promise.all([
    repo.listItems({ expeditionId: exp.id, sort: "oldest", includeNonPublic: false }),
    repo.stations(),
    repo.publishedArticles(50),
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
    ...(exp.start_date ? [{ date: exp.start_date, label: "Expedition begins", type: null as string | null, href: null as string | null }] : []),
    ...items.filter((i) => i.event_date).map((i) => ({ date: i.event_date!, label: i.title, type: i.type as string | null, href: `/items/${i.id}` })),
    ...(exp.end_date ? [{ date: exp.end_date, label: exp.status === "completed" ? "Expedition concludes" : "Planned end", type: null, href: null }] : []),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const byType = Object.fromEntries(ITEM_TYPES.map((type) => [type, items.filter((i) => i.type === type)]));

  return (
    <article>
      <SetCrumb label={exp.code} />
      <ScrollProgress />

      {/* hero */}
      <header className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <PolarArt variant={artVariant(exp.cover_url) ?? "aurora"} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-black/20" />
        </div>
        <div className="mx-auto flex min-h-[46vh] max-w-5xl flex-col justify-end gap-4 px-4 pt-24 pb-10 md:px-8">
          <BlurFade>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-black/55 font-mono text-white backdrop-blur">{exp.code}</Badge>
              <Badge variant="secondary">{tr(exp.region)}</Badge>
              <Badge variant="secondary">{ts(exp.status)}</Badge>
              {exp.is_sample && (
                <Badge variant="outline" className="border-dashed border-warning/60 bg-background/70 text-warning">
                  Sample
                </Badge>
              )}
            </div>
          </BlurFade>
          <BlurFade delay={0.1}>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance md:text-5xl">{exp.title}</h1>
          </BlurFade>
          <BlurFade delay={0.2}>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarRange className="size-4" />
                {exp.start_date ? `${formatDate(exp.start_date)} – ${exp.end_date ? formatDate(exp.end_date) : t("tbd")}` : t("tbd")}
              </span>
              {station && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4" /> {station.name}
                </span>
              )}
              <ShareButton title={exp.title} />
            </div>
          </BlurFade>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-20 px-4 py-12 md:px-8">
        {/* summary */}
        <section aria-labelledby="summary-h" className="grid gap-8 md:grid-cols-[1fr_280px]">
          <BlurFade inView>
            <h2 id="summary-h" className="text-sm font-semibold tracking-wider text-primary uppercase">
              {t("summary")}
            </h2>
            <p className="mt-3 text-lg leading-relaxed text-pretty md:text-xl">{exp.summary}</p>
          </BlurFade>
          <BlurFade inView delay={0.1}>
            <dl className="grid gap-3 rounded-2xl border bg-card p-5 text-sm">
              {ITEM_TYPES.map((type) => (
                <div key={type} className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <TypeIcon type={type} /> {tt(type)}
                  </dt>
                  <dd className="font-semibold tabular-nums">{byType[type].length}</dd>
                </div>
              ))}
            </dl>
          </BlurFade>
        </section>

        {/* journey timeline */}
        {timeline.length > 0 && (
          <section aria-labelledby="journey-h">
            <BlurFade inView>
              <h2 id="journey-h" className="text-2xl font-semibold tracking-tight">
                {t("journey")}
              </h2>
            </BlurFade>
            <ol className="relative mt-8 space-y-8 before:absolute before:top-2 before:bottom-2 before:left-[7px] before:w-0.5 before:bg-gradient-to-b before:from-primary before:via-aurora before:to-primary/10">
              {timeline.map((ev, i) => (
                <BlurFade key={`${ev.date}-${i}`} inView delay={0.03 * i} direction="left">
                  <li className="relative pl-10">
                    <span className="absolute top-1.5 left-0 flex size-4 items-center justify-center rounded-full bg-background ring-2 ring-primary">
                      <span className="size-1.5 rounded-full bg-primary" />
                    </span>
                    <p className="text-xs font-medium text-muted-foreground tabular-nums">{formatDate(ev.date)}</p>
                    {ev.href ? (
                      <Link href={ev.href} className="mt-0.5 inline-flex items-center gap-2 font-medium hover:text-primary">
                        {ev.type && <TypeIcon type={ev.type} className="text-primary" />} {ev.label}
                      </Link>
                    ) : (
                      <p className="mt-0.5 font-medium">{ev.label}</p>
                    )}
                  </li>
                </BlurFade>
              ))}
            </ol>
          </section>
        )}

        {/* station */}
        {station && (
          <BlurFade inView>
            <section aria-labelledby="station-h" className="relative overflow-hidden rounded-3xl border bg-[#081426] p-6 text-white md:p-10">
              <div className="absolute inset-0 opacity-60">
                <PolarArt variant={station.region === "arctic" ? "fjord" : station.region === "himalaya" ? "glacier" : "aurora"} />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-[#081426] via-[#081426]/80 to-transparent" />
              <div className="relative max-w-md">
                <p className="text-xs font-semibold tracking-wider text-white/70 uppercase">{t("station")}</p>
                <h2 id="station-h" className="mt-1 text-2xl font-semibold">
                  {station.name}
                </h2>
                <p className="mt-2 text-sm text-white/75">{station.description}</p>
                <p className="mt-3 font-mono text-xs text-white/60">
                  {station.lat.toFixed(2)}°, {station.lng.toFixed(2)}° (approx.)
                </p>
                <Link href="/map" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-white underline-offset-4 hover:underline">
                  <MapPin className="size-4" /> Open map
                </Link>
              </div>
            </section>
          </BlurFade>
        )}

        {/* highlights */}
        {facts.length > 0 && (
          <section aria-labelledby="findings-h">
            <BlurFade inView>
              <h2 id="findings-h" className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                <Sparkles className="size-5 text-aurora" /> {t("keyFindings")}
              </h2>
            </BlurFade>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {facts.map((f, i) => (
                <BlurFade key={i} inView delay={0.06 * i}>
                  <Link href={`/stories/${f.slug}`} className="group flex h-full gap-3 rounded-2xl border bg-gradient-to-br from-primary/5 to-aurora/5 p-5 transition-all hover:border-primary/40 hover:shadow-md">
                    <Quote className="size-5 shrink-0 text-primary" />
                    <p className="font-medium leading-snug group-hover:text-primary">{f.text}</p>
                  </Link>
                </BlurFade>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Facts come from reviewed, source-cited stories built on this expedition&apos;s items.</p>
          </section>
        )}

        {/* archive tabs */}
        <section aria-labelledby="archive-h">
          <BlurFade inView>
            <h2 id="archive-h" className="text-2xl font-semibold tracking-tight">
              {t("archive")}
            </h2>
          </BlurFade>
          <ArchiveTabs byType={byType} code={exp.code} />
        </section>
      </div>
    </article>
  );
}
