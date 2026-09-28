import { getTranslations } from "next-intl/server";
import { Accessibility, AlertTriangle, Mail, Target } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { NCPOR_COPYRIGHT_URL } from "@/lib/constants";

export const metadata = { title: "Accessibility statement" };

const LAST_REVIEWED = "2026-09-28";

export default async function AccessibilityPage() {
  const t = await getTranslations("accessibility");
  return (
    <PageShell className="max-w-3xl">
      <PageHeader title={t("title")} description={t("intro")} />
      <section aria-labelledby="target-h" className="space-y-2">
        <h2 id="target-h" className="flex items-center gap-2 text-lg font-semibold">
          <Target className="size-5 text-primary" /> {t("target")}
        </h2>
        <p className="text-muted-foreground">{t("targetBody")}</p>
      </section>
      <section aria-labelledby="features-h" className="space-y-2">
        <h2 id="features-h" className="flex items-center gap-2 text-lg font-semibold">
          <Accessibility className="size-5 text-primary" /> {t("features")}
        </h2>
        <ul className="list-disc space-y-1.5 pl-6 text-muted-foreground">
          {(["f1", "f2", "f3", "f4", "f5"] as const).map((k) => (
            <li key={k}>{t(k)}</li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="limits-h" className="space-y-2">
        <h2 id="limits-h" className="flex items-center gap-2 text-lg font-semibold">
          <AlertTriangle className="size-5 text-warning" /> {t("limitations")}
        </h2>
        <ul className="list-disc space-y-1.5 pl-6 text-muted-foreground">
          {(["l1", "l2", "l3"] as const).map((k) => (
            <li key={k}>{t(k)}</li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="contact-h" className="space-y-2">
        <h2 id="contact-h" className="flex items-center gap-2 text-lg font-semibold">
          <Mail className="size-5 text-primary" /> {t("contact")}
        </h2>
        <p className="text-muted-foreground">
          {t("contactBody")}{" "}
          <a href="https://ncpor.res.in/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            ncpor.res.in
          </a>{" "}
          ·{" "}
          <a href={NCPOR_COPYRIGHT_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Copyright policy
          </a>
        </p>
      </section>
      <p className="border-t pt-4 text-sm text-muted-foreground">{t("reviewed", { date: new Date(LAST_REVIEWED).toLocaleDateString("en-IN", { dateStyle: "long" }) })}</p>
    </PageShell>
  );
}
