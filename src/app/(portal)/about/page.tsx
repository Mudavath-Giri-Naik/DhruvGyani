import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Accessibility, ArrowUpRight, BookA, CheckCircle2, Info, Layers, Newspaper, Ship, Snowflake, Target } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import { Frame, FrameBody, FrameHeader, Pane, Stat } from "@/components/frame";
import { PolarArt } from "@/components/polar-art";
import { getRepo } from "@/lib/auth";
import { ITEM_TYPES, NCPOR_COPYRIGHT_URL } from "@/lib/constants";

export const metadata = { title: "About" };

export default async function AboutPage() {
  const [t, tc, tn, repo] = await Promise.all([getTranslations("about"), getTranslations("common"), getTranslations("nav"), getRepo()]);
  const [counts, stories, glossary] = await Promise.all([repo.counts(), repo.publishedArticles(50), repo.glossary()]);
  const principles = [t("p1"), t("p2"), t("p3"), t("p4"), t("p5")];
  const items = ITEM_TYPES.reduce((a, type) => a + counts[type], 0);
  const links = [
    { href: "/accessibility", label: tn("accessibility"), icon: Accessibility, external: false },
    { href: "https://ncpor.res.in/", label: "ncpor.res.in", icon: ArrowUpRight, external: true },
    { href: NCPOR_COPYRIGHT_URL, label: tn("copyright"), icon: ArrowUpRight, external: true },
  ];

  return (
    <Frame>
      <FrameHeader icon={Snowflake} title={t("title")} description={tc("tagline")} />
      <FrameBody className="lg:grid-cols-12">
        <BlurFade className="min-h-0 lg:col-span-7">
          <article className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border bg-card shadow-xs">
            <div className="relative min-h-36 flex-1 overflow-hidden">
              <div className="absolute inset-0">
                <PolarArt variant="aurora" label="Illustration: aurora over a polar coastline" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute inset-x-5 bottom-4 text-white">
                <p className="text-3xl font-semibold tracking-tight tall:text-4xl" lang="hi">
                  {tc("appNameHi")}
                </p>
                <p className="text-sm text-white/80">
                  {tc("appName")} · {tc("orgFull")}
                </p>
              </div>
            </div>
            <div className="min-h-0 shrink space-y-3 overflow-y-auto p-5 text-sm leading-relaxed md:text-base">
              <p>{t("body1")}</p>
              <p className="text-muted-foreground">{t("body2")}</p>
            </div>
            <p className="flex shrink-0 items-start gap-2 border-t border-warning/40 bg-warning/5 px-5 py-3 text-xs md:text-sm">
              <Info className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden /> {t("disclaimer")}
            </p>
          </article>
        </BlurFade>

        <BlurFade delay={0.08} className="flex min-h-0 flex-col gap-3 lg:col-span-5 tall:gap-4">
          <div className="grid shrink-0 grid-cols-2 gap-3 tall:gap-4">
            <Stat icon={Ship} label={tn("expeditions")} value={counts.expeditions} />
            <Stat icon={Layers} label={t("statItems")} value={items} />
            <Stat icon={Newspaper} label={tn("stories")} value={stories.length} />
            <Stat icon={BookA} label={t("statTerms")} value={glossary.length} />
          </div>
          <Pane icon={Target} title={t("principles")} className="fit:flex-1">
            <ul className="space-y-2.5 text-sm">
              {principles.map((p) => (
                <li key={p} className="flex gap-2.5">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-aurora" aria-hidden /> {p}
                </li>
              ))}
            </ul>
          </Pane>
          <nav aria-label={t("links")} className="grid shrink-0 gap-2 sm:grid-cols-3">
            {links.map((l) =>
              l.external ? (
                <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-2 rounded-xl border bg-card px-3 py-2 text-xs font-medium shadow-xs transition-colors hover:border-primary/40 hover:text-primary">
                  <span className="truncate">{l.label}</span> <l.icon className="size-3.5 shrink-0" aria-hidden />
                </a>
              ) : (
                <Link key={l.href} href={l.href} className="flex items-center justify-between gap-2 rounded-xl border bg-card px-3 py-2 text-xs font-medium shadow-xs transition-colors hover:border-primary/40 hover:text-primary">
                  <span className="truncate">{l.label}</span> <l.icon className="size-3.5 shrink-0" aria-hidden />
                </Link>
              ),
            )}
          </nav>
        </BlurFade>
      </FrameBody>
    </Frame>
  );
}
