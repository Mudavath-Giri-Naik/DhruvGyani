"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Accessibility, Contrast, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDisplayPrefs } from "@/components/a11y/use-display-prefs";
import { LocaleSwitch } from "./locale-switch";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

export function DisplayControls() {
  const t = useTranslations("a11y");
  const tn = useTranslations("nav");
  const { size, step, contrast, toggleContrast } = useDisplayPrefs();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <LocaleSwitch />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={contrast ? "default" : "outline"}
                size="icon-sm"
                aria-pressed={contrast}
                aria-label={t("contrast")}
                onClick={toggleContrast}
              >
                <Contrast className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("contrast")}</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div role="group" aria-label={t("textSize")} className="flex items-center rounded-md border">
          <Button variant="ghost" size="sm" className="h-7 rounded-r-none px-2 text-xs" aria-label={t("smaller")} onClick={() => step(-1)}>
            A−
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-7 rounded-none border-x px-2 text-xs", size === "md" && "bg-accent")}
            aria-label={t("default")}
            onClick={() => step(0)}
          >
            A
          </Button>
          <Button variant="ghost" size="sm" className="h-7 rounded-l-none px-2 text-sm" aria-label={t("larger")} onClick={() => step(1)}>
            A+
          </Button>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild variant="ghost" size="icon-sm" aria-label={tn("accessibility")}>
              <Link href="/accessibility">
                <Accessibility className="size-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{tn("accessibility")}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

/** Footer: language, theme, text size, contrast, accessibility statement. */
export function SidebarControls() {
  const { state, isMobile } = useSidebar();
  const t = useTranslations("a11y");
  if (state === "collapsed" && !isMobile) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <Popover>
            <PopoverTrigger asChild>
              <SidebarMenuButton tooltip={t("settings")}>
                <SlidersHorizontal />
                <span>{t("settings")}</span>
              </SidebarMenuButton>
            </PopoverTrigger>
            <PopoverContent side="right" align="end" className="w-64">
              <p className="mb-3 text-sm font-medium">{t("settings")}</p>
              <DisplayControls />
            </PopoverContent>
          </Popover>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }
  return (
    <div className="rounded-lg border bg-background/60 p-2 backdrop-blur">
      <DisplayControls />
    </div>
  );
}
