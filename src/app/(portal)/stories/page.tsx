import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Newspaper, Rss, ShieldCheck } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, PageShell } from "@/components/page-header";
import { MediaThumb } from "@/components/items/media-thumb";
import { formatDate } from "@/components/items/item-card";
import { getRepo } from "@/lib/auth";

export const metadata = { title: "Stories" };

export default async function StoriesPage() {
  const [t, repo] = await Promise.all([getTranslations("stories"), getRepo()]);
  const stories = await repo.publishedArticles(50);
  const items = await repo.getItems([...new Set(stories.flatMap((s) => s.item_ids))]);
  return (
    <PageShell>
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button asChild variant="outline" size="sm">
            <a href="/api/feed.xml">
              <Rss /> RSS
            </a>
          </Button>
        }
      />
      {stories.length === 0 ? (
        <EmptyState icon={<Newspaper className="size-5" />} title={t("empty")} />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {stories.map((s, i) => {
            if (s.output.channel !== "website_article") return null;
            const src = items.find((x) => x.id === s.item_ids[0]);
            return (
              <BlurFade key={s.id} delay={0.05 * i} inView>
                <Link href={`/stories/${s.slug}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5">
                  {src && <MediaThumb item={src} className="aspect-[16/9] w-full transition-transform duration-500 group-hover:scale-[1.03]" />}
                  <div className="flex flex-1 flex-col gap-2 p-5" lang={s.language}>
                    <p className="flex items-center gap-1.5 text-xs text-success">
                      <ShieldCheck className="size-3.5" /> Source-cited · {s.language === "hi" ? "हिंदी" : "English"}
                    </p>
                    <h2 className="text-lg font-semibold leading-snug tracking-tight group-hover:text-primary">{s.output.headline}</h2>
                    <p className="line-clamp-3 text-sm text-muted-foreground">{s.output.standfirst}</p>
                    <div className="mt-auto flex items-center justify-between pt-3 text-xs text-muted-foreground">
                      <span>{formatDate(s.published_at)}</span>
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              </BlurFade>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
