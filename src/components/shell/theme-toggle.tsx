"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useMounted } from "@/components/a11y/local-store";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** Cycles light → dark → system, with an animated icon swap. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("a11y");
  const mounted = useMounted();
  const current = mounted ? (theme ?? "system") : "system";
  const next = current === "light" ? "dark" : current === "dark" ? "system" : "light";
  const Icon = current === "light" ? Sun : current === "dark" ? Moon : Monitor;
  const label = `${t("theme")}: ${t(current as "light" | "dark" | "system")}`;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" size="icon-sm" aria-label={label} onClick={() => setTheme(next)}>
          <Icon key={current} className="size-4 animate-in spin-in-45 fade-in duration-300" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
