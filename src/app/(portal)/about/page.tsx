import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CheckCircle2, Info } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import { PageHeader, PageShell } from "@/components/page-header";
import { PolarArt } from "@/components/polar-art";

export const metadata = { title: "About" };

export default async function AboutPage() {
  const t = await getTranslations("about");
  const principles = [t("p1"), t("p2"), t("p3"), t("p4"), t("p5")];
  return (
    <PageShell className="max-w-4xl">
      <PageHeader title={t("title")} />
      <BlurFade>
        <div className="relative h-48 overflow-hidden rounded-3xl border md:h-64">
          <PolarArt variant="aurora" label="Illustration: aurora over a polar coastline" />
        </div>
      </BlurFade>
      <div className="space-y-4 text-lg leading-relaxed">
        <p>{t("body1")}</p>
        <p className="text-muted-foreground">{t("body2")}</p>
      </div>
      <section aria-labelledby="principles-h" className="rounded-2xl border bg-card p-6">
        <h2 id="principles-h" className="text-lg font-semibold">
          {t("principles")}
        </h2>
        <ul className="mt-4 space-y-3">
          {principles.map((p) => (
            <li key={p} className="flex gap-3">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-aurora" /> {p}
            </li>
          ))}
        </ul>
      </section>
      <p className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/5 p-4 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-warning" /> {t("disclaimer")}{" "}
        <Link href="/accessibility" className="text-primary underline-offset-2 hover:underline">
          Accessibility statement
        </Link>
      </p>
    </PageShell>
  );
}
