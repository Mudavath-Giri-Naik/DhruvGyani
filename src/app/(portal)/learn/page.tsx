import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, BookA, Download, GraduationCap, ListChecks } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import { Frame, FrameBody, FrameHeader, MetaChip, Pane } from "@/components/frame";
import { getRepo, getViewer } from "@/lib/auth";
import { buildQuiz } from "@/lib/quiz";
import { ITEM } from "@/lib/seed/data";
import { Lessons, QuizDeck, type Lesson } from "./learn-client";

export const metadata = { title: "Learn" };

// each lesson's picture: a credited photograph from the library, or an illustration
const LESSON_MEDIA: { image: string; photo?: string; href: string }[] = [
  { image: "art:glacier", href: "/explore" },
  { image: "/media/mosaic-meltwater.jpg", photo: ITEM.ph5, href: "/pulse" },
  { image: "/media/polarstern-polar-night.jpg", photo: ITEM.ph2, href: "/pulse" },
  { image: "/media/ice-core-drill.jpg", photo: ITEM.ph13, href: "/expeditions/MOSAiC" },
  { image: "/media/maitri-station-2017.jpg", photo: ITEM.ph6, href: "/map" },
  { image: "art:ocean", href: "/ask" },
];

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

  const lessons: Lesson[] = LESSON_MEDIA.map((m, n) => {
    const k = n + 1;
    const photo = m.photo ? items.find((i) => i.id === m.photo) : null;
    // if the photograph is not in the archive (e.g. unseeded database) fall back to an illustration rather than show it uncredited
    const usePhoto = Boolean(photo) || m.image.startsWith("art:");
    return {
      title: t(`l${k}t` as "l1t"),
      paragraphs: [t(`l${k}p1` as "l1p1"), t(`l${k}p2` as "l1p2"), t(`l${k}p3` as "l1p3")],
      image: usePhoto ? m.image : "art:snowfield",
      credit: photo ? { text: `${t("photo")}: ${photo.authors.join(", ")} · ${photo.license}`, href: `/items/${photo.id}` } : undefined,
      more: { label: t(`l${k}more` as "l1more"), href: m.href },
    };
  });

  return (
    <Frame>
      <FrameHeader
        icon={GraduationCap}
        title={t("title")}
        description={t("subtitle")}
        actions={
          <>
            <MetaChip icon={GraduationCap}>{t("lessonCount", { count: lessons.length })}</MetaChip>
            <MetaChip icon={ListChecks} className="max-sm:hidden">
              {t("quizCount", { count: quizzes.length })}
            </MetaChip>
          </>
        }
      />
      <FrameBody className="lg:grid-cols-12">
        {/* lessons */}
        <BlurFade className="min-h-0 lg:col-span-7">
          <Lessons lessons={lessons} />
        </BlurFade>

        {/* quizzes, glossary, teacher pack */}
        <BlurFade delay={0.08} className="flex min-h-0 flex-col gap-3 lg:col-span-5 tall:gap-4">
          <Pane icon={ListChecks} title={t("quizzes")} description={t("quizBody")} scroll={false} className="flex-1">
            <QuizDeck quizzes={quizzes} signedIn={viewer.role !== "visitor"} />
          </Pane>
          <div className="grid shrink-0 gap-3 sm:grid-cols-2 tall:gap-4">
            <Link href="/learn/glossary" className="group flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-xs transition-all hover:border-primary/40 hover:shadow-md">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-aurora/15 text-primary">
                <BookA className="size-5" aria-hidden />
              </span>
              <span className="grid min-w-0 flex-1">
                <span className="truncate text-sm font-semibold">{t("glossary")}</span>
                <span className="truncate text-xs text-muted-foreground">{tu("allTerms", { count: glossary.length })}</span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <a href="/api/teacher-pack" download className="group flex items-center gap-3 rounded-2xl border bg-gradient-to-br from-primary/10 to-aurora/10 p-3 shadow-xs transition-all hover:border-primary/40 hover:shadow-md">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <GraduationCap className="size-5" aria-hidden />
              </span>
              <span className="grid min-w-0 flex-1">
                <span className="truncate text-sm font-semibold">{t("teacherPack")}</span>
                <span className="truncate text-xs text-muted-foreground">{t("downloadPack")}</span>
              </span>
              <Download className="size-4 shrink-0 text-primary" aria-hidden />
            </a>
          </div>
        </BlurFade>
      </FrameBody>
    </Frame>
  );
}
