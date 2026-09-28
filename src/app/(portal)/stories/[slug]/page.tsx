import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CheckCircle2 } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import { CitedText } from "@/components/cited-text";
import { MediaThumb } from "@/components/items/media-thumb";
import { formatDate } from "@/components/items/item-card";
import { SetCrumb } from "@/components/shell/breadcrumbs";
import { Provenance } from "@/components/stories/provenance";
import { getRepo } from "@/lib/auth";
import { ScrollProgress, ShareButton } from "../../expeditions/[code]/story-client";

export async function generateMetadata({ params }: PageProps<"/stories/[slug]">) {
  const { slug } = await params;
  const repo = await getRepo();
  const s = await repo.getGenerationBySlug(slug);
  return s?.output.channel === "website_article" ? { title: s.output.headline, description: s.output.standfirst } : { title: "Story" };
}

export default async function StoryPage({ params }: PageProps<"/stories/[slug]">) {
  const { slug } = await params;
  const [t, repo] = await Promise.all([getTranslations("stories"), getRepo()]);
  const story = await repo.getGenerationBySlug(slug);
  if (!story || story.output.channel !== "website_article") notFound();
  const o = story.output;
  const items = await repo.getItems(story.item_ids);

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8 md:py-12" lang={story.language}>
      <SetCrumb label={o.headline} />
      <ScrollProgress />
      <BlurFade>
        <header className="space-y-4">
          <Provenance reviewer={story.reviewed_by_name ?? null} date={story.published_at} citations={story.citations} promptVersion={story.prompt_version} model={story.model} />
          <h1 className="text-3xl font-semibold tracking-tight text-balance md:text-5xl">{o.headline}</h1>
          <p className="text-lg text-pretty text-muted-foreground md:text-xl">{o.standfirst}</p>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{formatDate(story.published_at)}</span>
            <ShareButton title={o.headline} />
          </div>
        </header>
      </BlurFade>

      {items[0] && (
        <BlurFade delay={0.1}>
          <MediaThumb item={items[0]} className="mt-8 aspect-[16/8] w-full overflow-hidden rounded-2xl border" />
        </BlurFade>
      )}

      <div className="mt-10 space-y-6 text-lg leading-relaxed">
        {o.body.map((p, i) => (
          <BlurFade key={i} inView delay={0.03 * i}>
            <p>
              <CitedText text={p.text} citations={story.citations} />
            </p>
          </BlurFade>
        ))}
      </div>

      {o.key_facts.length > 0 && (
        <BlurFade inView>
          <aside className="mt-10 rounded-2xl border bg-gradient-to-br from-primary/5 to-aurora/5 p-6">
            <h2 className="text-sm font-semibold tracking-wide text-primary uppercase">{t("keyFacts")}</h2>
            <ul className="mt-3 space-y-2">
              {o.key_facts.map((f, i) => (
                <li key={i} className="flex gap-2">
                  <CheckCircle2 className="mt-1 size-4 shrink-0 text-aurora" />
                  <span>
                    <CitedText text={f.text} citations={story.citations} />
                  </span>
                </li>
              ))}
            </ul>
          </aside>
        </BlurFade>
      )}

      <section aria-labelledby="sources-h" className="mt-12 border-t pt-6">
        <h2 id="sources-h" className="font-semibold">
          {t("sources")}
        </h2>
        <ol className="mt-3 space-y-2 text-sm">
          {story.citations.map((c) => (
            <li key={c.marker} id={`src-${c.marker}`} className="flex gap-2">
              <span className="font-mono text-xs text-muted-foreground">[{c.marker.slice(1)}]</span>
              <Link href={`/items/${c.item_id}`} className="text-primary hover:underline" lang="en">
                {c.item_title}
                {c.page_no ? `, p.${c.page_no}` : ""}
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
