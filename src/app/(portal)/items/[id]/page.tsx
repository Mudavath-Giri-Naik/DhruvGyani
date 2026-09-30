import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BookOpenCheck, ExternalLink, Eye, FileText, FlaskConical, Info, Layers, MessageCircleQuestion, PlayCircle, ScanEye, Ship, TextQuote } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { BlurFade } from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import { Frame, FrameBody, Pane } from "@/components/frame";
import { ItemFlags, SampleBadge, TypeBadge } from "@/components/items/badges";
import { formatDate } from "@/components/items/item-card";
import { MediaThumb } from "@/components/items/media-thumb";
import { TYPE_ICON, TYPE_TONE } from "@/components/items/type-icon";
import { SetCrumb } from "@/components/shell/breadcrumbs";
import { GlossaryText } from "@/components/glossary/glossary-text";
import { getRepo, getViewer, isStaff } from "@/lib/auth";
import { bibtexCitation, plainCitation } from "@/lib/citation";
import { publicEnv } from "@/lib/env";
import { isAiAllowed } from "@/lib/policy";
import { cn } from "@/lib/utils";
import { ShareButton } from "../../expeditions/[code]/story-client";
import { CitePanel, FavouriteButton } from "./item-client";
import { ItemTabs, type ItemTab } from "./item-tabs";
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
  const [t, tc, tt, viewer, repo] = await Promise.all([getTranslations("item"), getTranslations("common"), getTranslations("types"), getViewer(), getRepo()]);
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
    .slice(0, 6)
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

  const preview = (
    <div className="space-y-4">
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base" lang={item.language}>
        <GlossaryText text={item.description} terms={glossary} lang={item.language} />
      </p>
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
      <section aria-label={t("preview")} className="overflow-hidden rounded-xl border bg-background">
        {item.type === "photo" && (
          <figure>
            <MediaThumb item={item} label className="aspect-[16/9] w-full" />
            {item.alt_text && <figcaption className="border-t px-4 py-3 text-sm text-muted-foreground">{item.alt_text}</figcaption>}
          </figure>
        )}
        {item.type === "video" && (
          <div className="relative">
            <MediaThumb item={item} className="aspect-video w-full" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/35 text-white">
              <PlayCircle className="size-14 opacity-90" aria-hidden />
              <p className="text-sm font-medium">{t("videoPlaceholder")}</p>
            </div>
          </div>
        )}
        {item.type === "dataset" && profile && <DataQuickLook profile={profile} csv={csv} itemId={item.id} />}
        {pdf && <iframe src={`${pdf}#view=FitH`} title={`${item.title} (PDF)`} className="h-[70vh] w-full bg-muted fit:h-[56vh]" loading="lazy" />}
        {!pdf && item.type !== "photo" && item.type !== "video" && !(item.type === "dataset" && profile) && <MediaThumb item={item} className="aspect-[21/9] w-full" />}
      </section>
    </div>
  );

  const tabs: ItemTab[] = [
    { value: "preview", label: t("preview"), icon: <ScanEye className="size-4" />, content: preview },
    ...(chunks.length > 0
      ? [
          {
            value: "text",
            label: item.type === "video" ? t("transcript") : t("fullText"),
            icon: <TextQuote className="size-4" />,
            content: (
              <div className="max-w-3xl space-y-3 text-sm leading-relaxed" lang={item.language}>
                {chunks.map((c) => (
                  <p key={c.id}>
                    {c.page_no && <span className="mr-2 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">p.{c.page_no}</span>}
                    <GlossaryText text={c.content} terms={glossary} lang={item.language} />
                  </p>
                ))}
              </div>
            ),
          },
          {
            value: "explain",
            label: t("explainer"),
            icon: <BookOpenCheck className="size-4" />,
            content: <ExplainerPanel itemId={item.id} aiAllowed={isAiAllowed(item)} hasText />,
          },
        ]
      : []),
    ...(related.length > 0
      ? [
          {
            value: "related",
            label: `${t("related")} · ${related.length}`,
            icon: <Layers className="size-4" />,
            content: (
              <ul className="grid gap-2 sm:grid-cols-2">
                {related.map((r) => {
                  const Icon = TYPE_ICON[r.type];
                  const code = expeditions.find((e) => e.id === r.expedition_id)?.code;
                  return (
                    <li key={r.id}>
                      <Link href={`/items/${r.id}`} className="group flex h-full items-start gap-3 rounded-xl border bg-background p-3 transition-all hover:border-primary/40 hover:shadow-md">
                        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg border", TYPE_TONE[r.type])}>
                          <Icon className="size-4" aria-hidden />
                        </span>
                        <span className="grid min-w-0 flex-1 gap-0.5">
                          <span className="line-clamp-2 text-sm leading-snug font-medium group-hover:text-primary" lang={r.language}>
                            {r.title}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">{[tt(r.type), code, formatDate(r.event_date)].filter(Boolean).join(" · ")}</span>
                          {r.is_sample && <SampleBadge className="mt-1 w-fit" />}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ),
          },
        ]
      : []),
  ];

  return (
    <Frame>
      <SetCrumb label={item.title} />
      {/* header */}
      <BlurFade className="shrink-0">
        <header className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <TypeBadge type={item.type} />
              <ItemFlags item={item} showAi={staff} />
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="size-3.5" aria-hidden /> {t("views", { count: views[item.id] ?? 0 })}
              </span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-balance fit:line-clamp-1 tall:text-2xl" lang={item.language} title={item.title}>
              {item.title}
            </h1>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
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
            <Button asChild variant="outline">
              <Link href={`/ask?q=${encodeURIComponent(t("askPrompt", { title: item.title }).slice(0, 280))}`}>
                <MessageCircleQuestion /> <span className="max-xl:sr-only">{t("askAbout")}</span>
              </Link>
            </Button>
            <ShareButton title={item.title} />
          </div>
        </header>
      </BlurFade>

      <FrameBody className="lg:grid-cols-12">
        <BlurFade delay={0.06} className="min-h-0 lg:col-span-8">
          <ItemTabs tabs={tabs} />
        </BlurFade>

        {/* sidebar */}
        <BlurFade delay={0.12} className="min-h-0 lg:col-span-4">
          <aside className="flex h-full flex-col gap-3 fit:overflow-y-auto fit:pr-0.5 tall:gap-4">
            <Pane icon={Info} title={t("metadata")} scroll={false} className="shrink-0" bodyClassName="px-4 pb-4">
              <dl className="grid gap-2 text-sm">
                {meta.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[92px_1fr] gap-2">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="min-w-0 break-words">{v}</dd>
                  </div>
                ))}
                {item.source_url && (
                  <div className="grid grid-cols-[92px_1fr] gap-2">
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
                <div className="mt-3 flex flex-wrap gap-1.5 border-t pt-3">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" asChild>
                      <Link href={`/explore?q=${encodeURIComponent(tag)}`}>#{tag}</Link>
                    </Badge>
                  ))}
                </div>
              )}
            </Pane>

            {exp && (
              <Link href={`/expeditions/${exp.code}`} className="group flex shrink-0 items-center gap-3 rounded-2xl border bg-gradient-to-br from-primary/10 to-aurora/10 p-3 text-sm shadow-xs transition-all hover:border-primary/40 hover:shadow-md">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <Ship className="size-4" aria-hidden />
                </span>
                <span className="grid min-w-0">
                  <span className="font-mono font-medium">{exp.code}</span>
                  <span className="truncate text-xs text-muted-foreground">{exp.title}</span>
                </span>
              </Link>
            )}

            <CitePanel plain={plainCitation(item, exp, publicEnv.siteUrl)} bibtex={bibtexCitation(item, exp, publicEnv.siteUrl)} />

            {staff && <StaffPanel item={item} role={viewer.role} />}
            <p className="shrink-0 px-1 text-xs text-muted-foreground">
              {tc("org")} · {item.id.slice(0, 8)}
            </p>
          </aside>
        </BlurFade>
      </FrameBody>
    </Frame>
  );
}
