"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { useLocalValue, writeLocal } from "@/components/a11y/local-store";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Note {
  id: string;
  title: string;
  body?: string;
  href: string;
  at: string;
}

function ago(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
}

export function Notifications({ notes }: { notes: Note[] }) {
  const t = useTranslations("common");
  const seen = useLocalValue("dg-notes-seen");
  const unread = notes.filter((n) => !seen || n.at > seen).length;
  const markSeen = () => {
    writeLocal("dg-notes-seen", notes[0]?.at ?? new Date().toISOString());
  };
  return (
    <Popover onOpenChange={(o) => o && markSeen()}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`${t("notifications")}${unread ? ` (${unread})` : ""}`}>
          <Bell className="size-[18px]" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-aurora opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex size-2.5 rounded-full bg-aurora" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3 text-sm font-semibold">{t("notifications")}</div>
        {notes.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t("noNotifications")}</p>
        ) : (
          <ScrollArea className="max-h-80">
            <ul className="divide-y">
              {notes.map((n) => (
                <li key={n.id}>
                  <Link href={n.href} className="flex gap-3 px-4 py-3 text-sm transition-colors hover:bg-accent">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden />
                    <span className="grid flex-1 gap-0.5">
                      <span className="font-medium leading-snug">{n.title}</span>
                      {n.body && <span className="line-clamp-2 text-xs text-muted-foreground">{n.body}</span>}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">{ago(n.at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
