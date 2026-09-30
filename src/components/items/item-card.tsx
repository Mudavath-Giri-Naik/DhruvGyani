import Link from "next/link";
import { CalendarDays, Ship } from "lucide-react";
import type { Item } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ItemFlags, TypeBadge } from "./badges";
import { MediaThumb, usesCover } from "./media-thumb";

export function formatDate(d: string | null | undefined, locale = "en-IN") {
  if (!d) return null;
  return new Date(d).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
}

export function ItemCard({
  item,
  expeditionCode,
  snippet,
  className,
  footer,
  compact,
}: {
  item: Item;
  expeditionCode?: string | null;
  snippet?: string;
  className?: string;
  footer?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
        className,
      )}
    >
      {!compact && (
        <MediaThumb item={item} className="aspect-[16/9] w-full transition-transform duration-500 group-hover:scale-[1.02]" />
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <TypeBadge type={item.type} />
          <ItemFlags item={item} />
        </div>
        <h3 className={cn("line-clamp-2 font-semibold leading-snug tracking-tight", !compact && usesCover(item) && "sr-only")} lang={item.language}>
          <Link href={`/items/${item.id}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {item.title}
          </Link>
        </h3>
        <p className="line-clamp-3 text-sm text-muted-foreground" lang={item.language}>
          {snippet ?? item.description}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-muted-foreground">
          {expeditionCode && (
            <span className="inline-flex items-center gap-1">
              <Ship className="size-3" /> {expeditionCode}
            </span>
          )}
          {item.event_date && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3" /> {formatDate(item.event_date)}
            </span>
          )}
        </div>
        {footer && <div className="relative z-10 pt-1">{footer}</div>}
      </div>
    </article>
  );
}
