import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, BookA, Download, GraduationCap, Snowflake } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import { MagicCard } from "@/components/ui/magic-card";
import { PageHeader, PageShell } from "@/components/page-header";
import { PolarArt } from "@/components/polar-art";
import { getRepo, getViewer } from "@/lib/auth";
import { buildQuiz } from "@/lib/quiz";
import { QuizCard } from "./quiz-card";

export const metadata = { title: "Learn" };

export default async function LearnPage() {
  const [t, repo, viewer] = await Promise.all([getTranslations("learn"), getRepo(), getViewer()]);
  const [items, glossary] = await Promise.all([repo.listItems(), repo.glossary()]);
  const candidates = items.filter((i) => ["report", "publication", "activity"].includes(i.type) && i.language === "en").slice(0, 8);
  const quizzes = [];
  for (const item of candidates) {
    const chunks = await repo.chunksFor([item.id]);
    const explainer = await repo.explainer(item.id, "school", "en");
    const passages = explainer ? [{ text: explainer.text, cite: "c1" }] : chunks.map((c, i) => ({ text: c.content, cite: `c${i + 1}` }));
    const questions = buildQuiz(passages, 3);
    if (questions.length >= 2) quizzes.push({ itemId: item.id, title: item.title, questions, source: explainer ? "school explainer" : "source text" });
    if (quizzes.length >= 3) break;
  }
  const featuredTerms = ["cryosphere", "ice shelf", "polynya", "katabatic wind", "permafrost", "krill"].map((term) => glossary.find((g) => g.term === term)).filter(Boolean);

  return (
    <PageShell>
      <PageHeader title={t("title")} description={t("subtitle")} />

      <BlurFade>
        <section className="relative overflow-hidden rounded-3xl border">
          <div className="absolute inset-0">
            <PolarArt variant="glacier" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/30" />
          <div className="relative max-w-2xl space-y-4 p-6 md:p-10">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-primary">
              <Snowflake className="size-4" /> Primer
            </p>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{t("primerTitle")}</h2>
            <p className="leading-relaxed">{t("primer1")}</p>
            <p className="leading-relaxed text-muted-foreground">{t("primer2")}</p>
            <p className="leading-relaxed text-muted-foreground">{t("primer3")}</p>
            <Button asChild>
              <Link href="/explore">
                Explore the archive <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
      </BlurFade>

      <div className="grid gap-4 md:grid-cols-3">
        <BlurFade inView className="md:col-span-2">
          <MagicCard className="h-full rounded-2xl" gradientColor="rgba(45,212,167,0.12)" gradientFrom="#3BA7E0" gradientTo="#2DD4A7">
            <div className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <BookA className="size-5 text-primary" /> {t("glossary")}
                </h2>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/learn/glossary">
                    All {glossary.length} terms <ArrowRight />
                  </Link>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{t("glossaryBody")}</p>
              <dl className="grid gap-3 sm:grid-cols-2">
                {featuredTerms.map((g) => (
                  <div key={g!.id} className="rounded-xl border bg-background/60 p-3">
                    <dt className="font-medium">
                      {g!.term} <span className="text-sm font-normal text-muted-foreground" lang="hi">· {g!.term_hi}</span>
                    </dt>
                    <dd className="mt-1 text-sm text-muted-foreground">{g!.meaning_en}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </MagicCard>
        </BlurFade>
        <BlurFade inView delay={0.1}>
          <div className="flex h-full flex-col gap-3 rounded-2xl border bg-gradient-to-br from-primary/10 to-aurora/10 p-6">
            <GraduationCap className="size-8 text-primary" />
            <h2 className="text-lg font-semibold">{t("teacherPack")}</h2>
            <p className="text-sm text-muted-foreground">{t("teacherPackBody")}</p>
            <Button asChild className="mt-auto">
              <a href="/api/teacher-pack" download>
                <Download /> {t("downloadPack")}
              </a>
            </Button>
          </div>
        </BlurFade>
      </div>

      <section aria-labelledby="quiz-h" className="space-y-4">
        <div>
          <h2 id="quiz-h" className="text-xl font-semibold">
            {t("quizzes")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("quizBody")}</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {quizzes.map((q, i) => (
            <BlurFade key={q.itemId} inView delay={0.05 * i}>
              <QuizCard {...q} signedIn={viewer.role !== "visitor"} />
            </BlurFade>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
