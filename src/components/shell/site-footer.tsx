import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Rss } from "lucide-react";
import { NCPOR_COPYRIGHT_URL } from "@/lib/constants";

export async function SiteFooter() {
  const t = await getTranslations("nav");
  const tc = await getTranslations("common");
  return (
    <footer className="mt-16 border-t px-4 py-6 text-xs text-muted-foreground md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p>
          © {new Date().getFullYear()} {tc("appName")} · {tc("orgFull")} (prototype). {tc("sample")} content is fictional.
        </p>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href="/about" className="hover:text-foreground">
            {t("about")}
          </Link>
          <Link href="/accessibility" className="hover:text-foreground">
            {t("accessibility")}
          </Link>
          <a href={NCPOR_COPYRIGHT_URL} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
            {t("copyright")}
          </a>
          <a href="https://ncpor.res.in/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
            {t("contact")}
          </a>
          <a href="/api/feed.xml" className="inline-flex items-center gap-1 hover:text-foreground">
            <Rss className="size-3" /> {t("feed")}
          </a>
        </nav>
      </div>
    </footer>
  );
}
