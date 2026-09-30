import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, FileSearch, ListChecks, Newspaper } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import { CitedText } from "@/components/cited-text";
import { Frame, FrameBody, MetaChip, Pane } from "@/components/frame";
import { MediaThumb } from "@/components/items/media-thumb";
import { formatDate } from "@/components/items/item-card";
import { SetCrumb } from "@/components/shell/breadcrumbs";
import { Provenance } from "@/components/stories/provenance";
import { getRepo } from "@/lib/auth";
import { ShareButton } from "../../expeditions/[code]/story-client";
import { ListenButton, StoryReader } from "./story-reader";

export async function generateMetadata({ params }: PageProps<"/stories/[slug]">) {
  const { slug } = await params;
  const repo = await getRepo();
  const s = await repo.getGenerationBySlug(slug);
  return s?.output.channel === "website_article" ? { title: s.output.headline, description: s.output.standfirst } : { title: "Story" };
}

const strip = (s: string) => s.replace(/\s*\[\s*c\d+(?:\s*,\s*c\d+)*\s*\]/g, "").trim();

export default async function StoryPage({ params }: PageProps<"/stories/[slug]">) {
  const { slug } = await params;
  const [t, repo] = await Promise.all([getTranslations("stories"), getRepo()]);
  const story = await repo.getGenerationBySlug(slug);
  if (!story || story.output.channel !== "website_article") notFound();
  const o = story.output;
  const [items, others] = await Promise.all([repo.getItems(story.item_ids), repo.publishedArticles(8)]);
  const more = others.filter((s) => s.id !== story.id && s.slug && s.output.channel === "website_article").slice(0, 3);
  const plain = [o.headline, o.standfirst, ...o.body.map((p) => strip(p.text))].join(". ");
  const minutes = Math.max(1, Math.round(plain.split(/\s+/).length / 200));

  return (
    <Frame>
      <SetCrumb label={o.headline} />
      <FrameBody className="lg:grid-cols-12">
        <BlurFade className="min-h-0 lg:col-span-8">
          <StoryReader
            header={
              <header className="space-y-3" lang={story.language}>
                <Provenance reviewer={story.reviewed_by_name ?? null} date={story.published_at} citations={story.citations} promptVersion={story.prompt_version} model={story.model} />
                <h1 className="text-2xl font-semibold tracking-tight text-balance md:text-3xl tall:text-4xl">{o.headline}</h1>
                <p className="text-base text-pretty text-muted-foreground md:text-lg">{o.standfirst}</p>
                <div className="flex flex-wrap items-center gap-2" lang="en">
                  <MetaChip icon={CalendarDays}>{formatDate(story.published_at)}</MetaChip>
                  <MetaChip icon={Clock}>{t("minutes", { count: minutes })}</MetaChip>
                  <ListenButton text={plain} lang={story.language} />
                  <ShareButton title={o.headline} />
                </div>
              </header>
            }
          >
            <div className="mt-6 space-y-5 text-base leading-relaxed md:text-lg" lang={story.language}>
              {o.body.map((p, i) => (
                <p key={i}>
                  <CitedText text={p.text} citations={story.citations} />
                </p>
              ))}
            </div>
          </StoryReader>
        </BlurFade>

        <BlurFade delay={0.08} className="min-h-0 lg:col-span-4">
          <aside className="flex h-full min-h-0 flex-col gap-3 tall:gap-4">
            {items[0] && <MediaThumb item={items[0]} label className="h-28 w-full shrink-0 rounded-2xl border shadow-xs short:hidden tall:h-40" />}

            {o.key_facts.length > 0 && (
              <Pane icon={ListChecks} title={t("keyFacts")} count={o.key_facts.length} className="fit:flex-[3]" lang={story.language}>
                <ul className="space-y-2 text-sm" lang={story.language}>
                  {o.key_facts.map((f, i) => (
                    <li key={i} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-aurora" aria-hidden />
                      <span>
                        <CitedText text={f.text} citations={story.citations} />
                      </span>
                    </li>
                  ))}
                </ul>
              </Pane>
            )}

            <Pane icon={FileSearch} title={t("sources")} count={story.citations.length} className="fit:flex-[3]">
              <ol className="space-y-1.5 text-sm">
                {story.citations.map((c) => (
                  <li key={c.marker} id={`src-${c.marker}`}>
                    <Link href={`/items/${c.item_id}`} className="group flex items-start gap-2 rounded-lg p-1.5 transition-colors hover:bg-muted/60">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">{c.marker.slice(1)}</span>
                      <span className="min-w-0 leading-snug group-hover:text-primary">
                        {c.item_title}
                        {c.page_no ? <span className="text-muted-foreground">, p.{c.page_no}</span> : null}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </Pane>

            {more.length > 0 && (
              <Pane icon={Newspaper} title={t("more")} className="short:hidden fit:flex-[2]" bodyClassName="px-2">
                <ul>
                  {more.map((s) => (
                    <li key={s.id}>
                      <Link href={`/stories/${s.slug}`} className="group grid gap-0.5 rounded-lg p-2 transition-colors hover:bg-muted/60" lang={s.language}>
                        <span className="line-clamp-2 text-sm leading-snug font-medium group-hover:text-primary">{s.output.channel === "website_article" ? s.output.headline : ""}</span>
                        <span className="text-xs text-muted-foreground" lang="en">
                          {s.language.toUpperCase()} · {formatDate(s.published_at)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Pane>
            )}

            <Button asChild variant="outline" className="shrink-0">
              <Link href="/stories">
                <ArrowLeft /> {t("backToAll")}
              </Link>
            </Button>
          </aside>
        </BlurFade>
      </FrameBody>
    </Frame>
  );
}
