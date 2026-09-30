import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PolarArt } from "@/components/polar-art";

export default async function NotFound() {
  const t = await getTranslations("common");
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-4 px-4 py-20 text-center fit:h-full fit:py-6">
      <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-3xl border shadow-xs">
        <PolarArt variant="snowfield" />
        <span className="absolute inset-0 flex items-center justify-center text-6xl font-bold tracking-tight text-[#081426]/80">404</span>
      </div>
      <h1 className="text-2xl font-semibold">{t("notFoundTitle")}</h1>
      <p className="text-muted-foreground">{t("notFoundBody")}</p>
      <div className="flex gap-2">
        <Button asChild>
          <Link href="/portal">{t("goHome")}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/explore">
            <Compass /> {t("search")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
