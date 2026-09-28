"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Languages, Moon, Search, Sun, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { setLocale } from "@/app/actions/prefs";
import { NAV } from "@/lib/nav";
import type { Role } from "@/lib/types";
import { TypeIcon } from "@/components/items/type-icon";

interface Hit {
  id: string;
  title: string;
  type: string;
}

export function CommandMenu({ role }: { role: Role }) {
  const t = useTranslations("nav");
  const tt = useTranslations("types");
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "/" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) return;
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=6&log=0`, { signal: ctrl.signal });
        if (res.ok) setHits((await res.json()).results ?? []);
      } catch {
        /* aborted */
      }
    }, 180);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [query]);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  const groups = NAV.filter((g) => g.roles.includes(role));

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 justify-start gap-2 rounded-lg bg-background/60 px-0 text-sm font-normal text-muted-foreground shadow-none sm:w-56 sm:px-3 md:w-72"
        onClick={() => setOpen(true)}
        aria-label={t("commandPlaceholder")}
      >
        <Search className="mx-auto size-4 sm:mx-0" />
        <span className="hidden truncate sm:inline">{t("commandPlaceholder")}</span>
        <kbd className="pointer-events-none absolute right-2 hidden h-5 items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Command palette" description={t("commandPlaceholder")}>
        <Command>
        <CommandInput placeholder={t("commandPlaceholder")} value={query} onValueChange={setQuery} />
        <CommandList>
          <CommandEmpty>{t("commandEmpty")}</CommandEmpty>
          {query.trim().length > 1 && (
            <CommandGroup heading={t("search")}>
              <CommandItem value={`search ${query}`} onSelect={() => go(`/explore?q=${encodeURIComponent(query)}`)}>
                <FileSearch />
                {t("searchArchive", { q: query })}
              </CommandItem>
              {hits.filter(() => query.trim().length > 1).map((h) => (
                <CommandItem key={h.id} value={`${h.title} ${h.id}`} onSelect={() => go(`/items/${h.id}`)}>
                  <TypeIcon type={h.type} />
                  <span className="truncate">{h.title}</span>
                  <CommandShortcut>{tt(h.type as "report")}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {groups.map((g) => (
            <CommandGroup key={g.key} heading={t(g.key)}>
              {g.items.flatMap((i) => [i, ...(i.children ?? [])]).filter((i, idx, arr) => arr.findIndex((x) => x.href === i.href) === idx).map((i) => (
                <CommandItem key={i.key} value={`${t(i.key)} ${i.href}`} onSelect={() => go(i.href)}>
                  <i.icon />
                  {t(i.key)}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
          <CommandSeparator />
          <CommandGroup heading={t("actions")}>
            <CommandItem value="toggle theme" onSelect={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
              {resolvedTheme === "dark" ? <Sun /> : <Moon />}
              Toggle theme
            </CommandItem>
            <CommandItem
              value="language english hindi"
              onSelect={async () => {
                const next = document.documentElement.lang === "hi" ? "en" : "hi";
                await setLocale(next);
                setOpen(false);
                router.refresh();
              }}
            >
              <Languages />
              English / हिंदी
            </CommandItem>
          </CommandGroup>
        </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
