import { getTranslations } from "next-intl/server";
import { Newspaper, Rss } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Frame, FrameHeader } from "@/components/frame";
import { EmptyState } from "@/components/page-header";
import { getRepo } from "@/lib/auth";
import { StoriesBrowser, type StoryCard } from "./stories-browser";

export const metadata = { title: "Stories" };

const strip = (s: string) => s.replace(/\s*\[\s*c\d+(?:\s*,\s*c\d+)*\s*\]/g, "").trim();

export default async function StoriesPage() {
  const [t, repo] = await Promise.all([getTranslations("stories"), getRepo()]);
  const stories = await repo.publishedArticles(50);
  const items = await repo.getItems([...new Set(stories.flatMap((s) => s.item_ids))]);
  const cards: StoryCard[] = stories.flatMap((s) => {
    if (s.output.channel !== "website_article" || !s.slug) return [];
    const src = items.find((x) => x.id === s.item_ids[0]);
    const words = [s.output.standfirst, ...s.output.body.map((p) => p.text)].join(" ").split(/\s+/).length;
    return [
      {
        id: s.id,
        slug: s.slug,
        language: s.language,
        headline: s.output.headline,
        standfirst: s.output.standfirst,
        facts: s.output.key_facts.slice(0, 3).map((f) => strip(f.text)),
        published_at: s.published_at,
        reviewer: s.reviewed_by_name ?? null,
        minutes: Math.max(1, Math.round(words / 200)),
        sources: s.citations.length,
        thumb: src ? { type: src.type, media_url: src.media_url ?? null, alt_text: src.alt_text ?? null } : null,
      },
    ];
  });

  return (
    <Frame>
      <FrameHeader
        icon={Newspaper}
        title={t("title")}
        description={t("subtitle")}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <a href="/api/feed.xml">
                <Rss /> RSS
              </a>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <a href="/api/feed.json">JSON</a>
            </Button>
          </>
        }
      />
      {cards.length === 0 ? <EmptyState icon={<Newspaper className="size-5" />} title={t("empty")} /> : <StoriesBrowser stories={cards} />}
    </Frame>
  );
}
