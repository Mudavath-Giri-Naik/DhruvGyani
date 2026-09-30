import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, BookA, Download, GraduationCap, Layers, ListChecks, Snowflake } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import { Frame, FrameBody, FrameHeader, MetaChip, Pane } from "@/components/frame";
import { PolarArt } from "@/components/polar-art";
import { getRepo, getViewer } from "@/lib/auth";
import { buildQuiz } from "@/lib/quiz";
import { Flashcards, QuizDeck } from "./learn-client";

export const metadata = { title: "Learn" };

export default async function LearnPage() {
  const [t, tu, repo, viewer] = await Promise.all([getTranslations("learn"), getTranslations("ui"), getRepo(), getViewer()]);
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
  // featured terms first, then the rest A–Z
  const featured = ["cryosphere", "ice shelf", "polynya", "katabatic wind", "permafrost", "krill"];
  const deck = [...glossary].sort((a, b) => {
    const fa = featured.indexOf(a.term);
    const fb = featured.indexOf(b.term);
    return (fa < 0 ? 99 : fa) - (fb < 0 ? 99 : fb) || a.term.localeCompare(b.term);
  });

  return (
    <Frame>
      <FrameHeader
        icon={GraduationCap}
        title={t("title")}
        description={t("subtitle")}
        actions={
          <>
            <MetaChip icon={BookA}>{tu("allTerms", { count: glossary.length })}</MetaChip>
            <MetaChip icon={ListChecks} className="max-sm:hidden">
              {t("quizCount", { count: quizzes.length })}
            </MetaChip>
          </>
        }
      />
      <FrameBody className="lg:grid-cols-12">
        {/* primer */}
        <BlurFade className="min-h-0 lg:col-span-4">
          <section aria-labelledby="primer-h" className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border bg-card shadow-xs">
            <div className="relative min-h-28 flex-1 overflow-hidden">
              <div className="absolute inset-0">
                <PolarArt variant="glacier" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute inset-x-4 bottom-3 text-white">
                <p className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-white/80 uppercase">
                  <Snowflake className="size-3.5" aria-hidden /> {tu("primer")}
                </p>
                <h2 id="primer-h" className="text-xl font-semibold tracking-tight tall:text-2xl">
                  {t("primerTitle")}
                </h2>
              </div>
            </div>
            <div className="min-h-0 shrink space-y-2.5 overflow-y-auto p-4 text-sm leading-relaxed">
              <p>{t("primer1")}</p>
              <p className="text-muted-foreground">{t("primer2")}</p>
              <p className="text-muted-foreground">{t("primer3")}</p>
            </div>
            <div className="flex shrink-0 gap-2 border-t p-3">
              <Button asChild className="flex-1">
                <Link href="/explore">
                  {tu("exploreArchive")} <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/ask">{t("askQuestion")}</Link>
              </Button>
            </div>
          </section>
        </BlurFade>

        {/* quizzes */}
        <BlurFade delay={0.08} className="min-h-0 lg:col-span-5">
          <Pane icon={ListChecks} title={t("quizzes")} description={t("quizBody")} scroll={false} className="h-full">
            <QuizDeck quizzes={quizzes} signedIn={viewer.role !== "visitor"} />
          </Pane>
        </BlurFade>

        {/* flashcards + teacher pack */}
        <BlurFade delay={0.16} className="flex min-h-0 flex-col gap-3 lg:col-span-3 tall:gap-4">
          <Pane
            icon={Layers}
            title={t("flashcards")}
            scroll={false}
            className="flex-1"
            action={
              <Link href="/learn/glossary" className="inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground">
                {t("glossary")} <ArrowRight className="size-3" aria-hidden />
              </Link>
            }
          >
            <Flashcards terms={deck} />
          </Pane>
          <section aria-labelledby="pack-h" className="flex shrink-0 items-center gap-3 rounded-2xl border bg-gradient-to-br from-primary/10 to-aurora/10 p-3 shadow-xs tall:p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <GraduationCap className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="pack-h" className="truncate text-sm font-semibold">
                {t("teacherPack")}
              </h2>
              <p className="line-clamp-2 text-xs text-muted-foreground">{t("teacherPackBody")}</p>
            </div>
            <Button asChild size="icon" aria-label={t("downloadPack")} title={t("downloadPack")}>
              <a href="/api/teacher-pack" download>
                <Download />
              </a>
            </Button>
          </section>
        </BlurFade>
      </FrameBody>
    </Frame>
  );
}
