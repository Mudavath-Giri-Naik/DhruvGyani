import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ExternalLink, FileText, FlaskConical, Info, PlayCircle, Ship } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { BlurFade } from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ItemFlags, TypeBadge } from "@/components/items/badges";
import { ItemCard, formatDate } from "@/components/items/item-card";
import { MediaThumb } from "@/components/items/media-thumb";
import { SetCrumb } from "@/components/shell/breadcrumbs";
import { GlossaryText } from "@/components/glossary/glossary-text";
import { getRepo, getViewer, isStaff } from "@/lib/auth";
import { bibtexCitation, plainCitation } from "@/lib/citation";
import { publicEnv } from "@/lib/env";
import { isAiAllowed } from "@/lib/policy";
import { CitePanel, FavouriteButton } from "./item-client";
import { StaffPanel } from "./staff-panel";
import { ExplainerPanel } from "./explainer-panel";
import { DataQuickLook } from "@/components/datasets/data-quick-look";

export async function generateMetadata({ params }: PageProps<"/items/[id]">) {
  const { id } = await params;
  const repo = await getRepo();
  const item = await repo.getItem(id).catch(() => null);
  return { title: item?.title ?? "Item" };
}

export default async function ItemPage({ params }: PageProps<"/items/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [t, tc, viewer, repo] = await Promise.all([getTranslations("item"), getTranslations("common"), getViewer(), getRepo()]);
  const item = await repo.getItem(id);
  if (!item) notFound();

  const [expeditions, stations, chunks, glossary, favourites, views] = await Promise.all([
    repo.expeditions(),
    repo.stations(),
    repo.chunksFor([item.id]),
    repo.glossary(),
    repo.favourites().catch(() => [] as string[]),
    repo.viewCounts().catch(() => ({}) as Record<string, number>),
  ]);
  await repo.logView(item.id).catch(() => {});

  const exp = expeditions.find((e) => e.id === item.expedition_id) ?? null;
  const station = stations.find((s) => s.id === item.station_id) ?? null;
  const pool = await repo.listItems({ limit: 60 });
  const related = pool
    .filter((i) => i.id !== item.id)
    .map((i) => ({ i, s: (i.expedition_id && i.expedition_id === item.expedition_id ? 2 : 0) + i.tags.filter((tag) => item.tags.includes(tag)).length }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 3)
    .map((x) => x.i);
  const staff = isStaff(viewer.role);
  const pdf = item.media_url && /\.pdf($|\?)/i.test(item.media_url) ? item.media_url : null;
  const profile = item.type === "dataset" ? await repo.datasetProfile(item.id) : null;
  const csv = profile ? await repo.datasetCsv(item.id) : null;

  const meta: [string, React.ReactNode][] = [
    [t("expedition"), exp ? <Link key="e" href={`/expeditions/${exp.code}`} className="font-mono text-primary hover:underline">{exp.code}</Link> : "—"],
    [t("station"), station?.name ?? "—"],
    [t("date"), formatDate(item.event_date) ?? "—"],
    [t("authors"), item.authors.join(", ") || "—"],
    [t("discipline"), item.discipline.join(", ") || "—"],
    [t("language"), item.language === "hi" ? "हिंदी" : "English"],
    [t("license"), item.license ?? "—"],
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <SetCrumb label={item.title} />
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-8">
          {/* header */}
          <BlurFade>
            <header className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <TypeBadge type={item.type} />
                <ItemFlags item={item} showAi={staff} />
                <span className="text-xs text-muted-foreground">{t("views", { count: views[item.id] ?? 0 })}</span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-balance md:text-4xl" lang={item.language}>
                {item.title}
              </h1>
              <p className="max-w-3xl text-base text-muted-foreground md:text-lg" lang={item.language}>
                <GlossaryText text={item.description} terms={glossary} lang={item.language} />
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {item.external_url && (
                  <Button asChild>
                    <a href={item.external_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink /> {t("visitSource")}
                    </a>
                  </Button>
                )}
                {pdf && (
                  <Button asChild variant="outline">
                    <a href={pdf} target="_blank" rel="noopener noreferrer">
                      <FileText /> {t("openPdf")}
                    </a>
                  </Button>
                )}
                <FavouriteButton itemId={item.id} initial={favourites.includes(item.id)} signedIn={viewer.role !== "visitor"} />
              </div>
            </header>
          </BlurFade>

          {item.is_sample && (
            <Alert className="border-warning/40 bg-warning/5">
              <FlaskConical className="text-warning" />
              <AlertDescription>{t("sampleNote")}</AlertDescription>
            </Alert>
          )}
          {item.external_url && (
            <Alert>
              <Info />
              <AlertDescription>{t("externalNote")}</AlertDescription>
            </Alert>
          )}

          {/* viewer */}
          <BlurFade delay={0.1}>
            <section aria-label={t("preview")} className="overflow-hidden rounded-2xl border bg-card">
              {item.type === "photo" && (
                <figure>
                  <MediaThumb item={item} label className="aspect-[16/10] w-full" />
                  {item.alt_text && <figcaption className="border-t px-4 py-3 text-sm text-muted-foreground">{item.alt_text}</figcaption>}
                </figure>
              )}
              {item.type === "video" && (
                <div>
                  <div className="relative">
                    <MediaThumb item={item} className="aspect-video w-full" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/35 text-white">
                      <PlayCircle className="size-14 opacity-90" aria-hidden />
                      <p className="text-sm font-medium">{t("videoPlaceholder")}</p>
                    </div>
                  </div>
                </div>
              )}
              {item.type === "dataset" && profile && <DataQuickLook profile={profile} csv={csv} itemId={item.id} />}
              {pdf && (
                <iframe src={`${pdf}#view=FitH`} title={`${item.title} (PDF)`} className="h-[70vh] w-full bg-muted" loading="lazy" />
              )}
              {!pdf && item.type !== "photo" && item.type !== "video" && !(item.type === "dataset" && profile) && (
                <MediaThumb item={item} className="aspect-[21/9] w-full" />
              )}
            </section>
          </BlurFade>

          {/* text / transcript */}
          {chunks.length > 0 && (
            <section aria-labelledby="text-h" className="space-y-3">
              <h2 id="text-h" className="text-lg font-semibold">
                {item.type === "video" ? t("transcript") : t("preview")}
              </h2>
              <div className="space-y-3 rounded-2xl border bg-card p-5 text-sm leading-relaxed" lang={item.language}>
                {chunks.map((c) => (
                  <p key={c.id}>
                    {c.page_no && <span className="mr-2 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">p.{c.page_no}</span>}
                    <GlossaryText text={c.content} terms={glossary} lang={item.language} />
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* 3-level explainer */}
          <ExplainerPanel itemId={item.id} aiAllowed={isAiAllowed(item)} hasText={chunks.length > 0} />

          {/* related */}
          {related.length > 0 && (
            <section aria-labelledby="related-h" className="space-y-4">
              <h2 id="related-h" className="text-lg font-semibold">
                {t("related")}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {related.map((r) => (
                  <ItemCard key={r.id} item={r} expeditionCode={expeditions.find((e) => e.id === r.expedition_id)?.code} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("metadata")}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-sm">
                {meta.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[100px_1fr] gap-2">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="min-w-0 break-words">{v}</dd>
                  </div>
                ))}
                {item.source_url && (
                  <div className="grid grid-cols-[100px_1fr] gap-2">
                    <dt className="text-muted-foreground">{t("source")}</dt>
                    <dd className="min-w-0 truncate">
                      <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {new URL(item.source_url).hostname}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
              {item.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5 border-t pt-4">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" asChild>
                      <Link href={`/explore?q=${encodeURIComponent(tag)}`}>#{tag}</Link>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <CitePanel plain={plainCitation(item, exp, publicEnv.siteUrl)} bibtex={bibtexCitation(item, exp, publicEnv.siteUrl)} />

          {exp && (
            <Link href={`/expeditions/${exp.code}`} className="flex items-center gap-3 rounded-xl border bg-gradient-to-br from-primary/5 to-aurora/5 p-4 text-sm transition-colors hover:border-primary/40">
              <Ship className="size-5 text-primary" />
              <span className="grid">
                <span className="font-medium">{exp.code}</span>
                <span className="text-xs text-muted-foreground">{exp.title}</span>
              </span>
            </Link>
          )}

          {staff && <StaffPanel item={item} role={viewer.role} />}
          <p className="px-1 text-xs text-muted-foreground">
            {tc("org")} · {item.id.slice(0, 8)}
          </p>
        </aside>
      </div>
    </div>
  );
}
