"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/app/actions/prefs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export function LocaleSwitch({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("a11y");
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <ToggleGroup
      type="single"
      size="sm"
      variant="outline"
      value={locale}
      aria-label={t("language")}
      className={cn(pending && "opacity-60", className)}
      onValueChange={(v) => {
        if (!v || v === locale) return;
        start(async () => {
          await setLocale(v as "en" | "hi");
          router.refresh();
        });
      }}
    >
      <ToggleGroupItem value="en" lang="en" aria-label="English" className="px-2.5 text-xs">
        EN
      </ToggleGroupItem>
      <ToggleGroupItem value="hi" lang="hi" aria-label="हिंदी" className="px-2.5 text-xs">
        हिं
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
