"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { CloudOff, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PortalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("common");
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-4 px-4 py-24 text-center fit:h-full fit:py-6">
      <div className="rounded-full bg-destructive/10 p-4 text-destructive">
        <CloudOff className="size-8" />
      </div>
      <h1 className="text-2xl font-semibold">{t("errorTitle")}</h1>
      <p className="text-muted-foreground">{t("errorBody")}</p>
      {error.digest && <p className="font-mono text-xs text-muted-foreground">ref: {error.digest}</p>}
      <div className="flex gap-2">
        <Button onClick={reset}>
          <RotateCcw /> {t("retry")}
        </Button>
        <Button asChild variant="outline">
          <Link href="/portal">{t("goHome")}</Link>
        </Button>
      </div>
    </div>
  );
}
