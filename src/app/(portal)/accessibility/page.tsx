import { getTranslations } from "next-intl/server";
import { Accessibility, AlertTriangle, CalendarCheck, CheckCircle2, Mail, SlidersHorizontal, Target } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import { Frame, FrameBody, FrameHeader, MetaChip, Pane } from "@/components/frame";
import { DisplayControls } from "@/components/shell/sidebar-controls";
import { NCPOR_COPYRIGHT_URL } from "@/lib/constants";

export const metadata = { title: "Accessibility statement" };

const LAST_REVIEWED = "2026-09-28";

export default async function AccessibilityPage() {
  const t = await getTranslations("accessibility");
  const reviewed = t("reviewed", { date: new Date(LAST_REVIEWED).toLocaleDateString("en-IN", { dateStyle: "long" }) });
  return (
    <Frame>
      <FrameHeader icon={Accessibility} title={t("title")} description={t("intro")} actions={<MetaChip icon={CalendarCheck}>{reviewed}</MetaChip>} />
      <FrameBody className="lg:grid-cols-3 fit:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
        <BlurFade className="min-h-0">
          <section aria-labelledby="target-h" className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border bg-card p-5 shadow-xs">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-aurora/10" />
            <div className="relative min-h-0 overflow-y-auto">
              <h2 id="target-h" className="flex items-center gap-2 text-sm font-semibold">
                <Target className="size-4 text-primary" aria-hidden /> {t("target")}
              </h2>
              <p className="mt-3 text-3xl font-semibold tracking-tight">
                WCAG 2.1 <span className="text-gradient">AA</span>
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("targetBody")}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground lg:hidden">{t("intro")}</p>
            </div>
          </section>
        </BlurFade>

        <BlurFade delay={0.06} className="min-h-0 lg:row-span-2">
          <Pane icon={Accessibility} title={t("features")} className="h-full">
            <ul className="space-y-3 text-sm">
              {(["f1", "f2", "f3", "f4", "f5"] as const).map((k) => (
                <li key={k} className="flex gap-2.5 rounded-xl border bg-background p-3">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-aurora" aria-hidden /> <span>{t(k)}</span>
                </li>
              ))}
            </ul>
          </Pane>
        </BlurFade>

        <BlurFade delay={0.12} className="min-h-0">
          <Pane icon={SlidersHorizontal} title={t("tryIt")} description={t("tryItBody")} className="h-full">
            <div className="rounded-xl border bg-background p-3">
              <DisplayControls />
            </div>
          </Pane>
        </BlurFade>

        <BlurFade delay={0.18} className="min-h-0">
          <Pane icon={AlertTriangle} title={t("limitations")} className="h-full">
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              {(["l1", "l2", "l3"] as const).map((k) => (
                <li key={k} className="flex gap-2.5">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-warning" aria-hidden /> <span>{t(k)}</span>
                </li>
              ))}
            </ul>
          </Pane>
        </BlurFade>

        <BlurFade delay={0.24} className="min-h-0">
          <Pane icon={Mail} title={t("contact")} className="h-full">
            <p className="text-sm text-muted-foreground">{t("contactBody")}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <a href="https://ncpor.res.in/" target="_blank" rel="noopener noreferrer" className="rounded-full border px-3 py-1 font-medium text-primary transition-colors hover:border-primary/40 hover:bg-primary/5">
                ncpor.res.in
              </a>
              <a href={NCPOR_COPYRIGHT_URL} target="_blank" rel="noopener noreferrer" className="rounded-full border px-3 py-1 font-medium text-primary transition-colors hover:border-primary/40 hover:bg-primary/5">
                Copyright policy
              </a>
            </div>
          </Pane>
        </BlurFade>
      </FrameBody>
    </Frame>
  );
}
