import { useId } from "react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NumberTicker } from "@/components/ui/number-ticker";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

/**
 * Single-frame page primitives. On a desktop viewport (`fit:`) the portal shell
 * is pinned to the window, so a page fills the space it is given and its panes
 * scroll internally. On phones and short windows everything stacks and the
 * page scrolls as usual.
 */
export function Frame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto flex w-full max-w-[1600px] flex-col gap-3 p-4 fit:h-full fit:min-h-[30rem] tall:gap-4 tall:p-6", className)}>{children}</div>
  );
}

/** Compact page heading: icon, title, one-line description, actions on the right. */
export function FrameHeader({
  icon: Icon,
  title,
  description,
  eyebrow,
  actions,
  lang,
  className,
}: {
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  lang?: string;
  className?: string;
}) {
  return (
    <header className={cn("flex shrink-0 flex-wrap items-center gap-x-4 gap-y-3", className)}>
      <div className="flex min-w-56 flex-1 items-center gap-3">
        {Icon && (
          <span className="hidden size-10 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br from-primary/15 to-aurora/15 text-primary shadow-xs sm:flex">
            <Icon className="size-5" aria-hidden />
          </span>
        )}
        <div className="min-w-0">
          {eyebrow && <div className="mb-0.5 flex flex-wrap items-center gap-2 text-xs font-medium text-primary">{eyebrow}</div>}
          <h1 className="text-xl font-semibold tracking-tight text-balance fit:truncate tall:text-2xl" lang={lang}>
            {title}
          </h1>
          {description && <p className="text-sm text-pretty text-muted-foreground short:hidden tall:truncate">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex max-w-full shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Body region that takes the remaining height of a Frame. One bounded row by default; pass `fit:grid-rows-[…]` for more. */
export function FrameBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid min-h-0 flex-1 gap-3 *:min-w-0 fit:grid-rows-[minmax(0,1fr)] tall:gap-4", className)}>{children}</div>;
}

/**
 * Card with a fixed header and a body that scrolls inside the card.
 * `scroll={false}` hands the body to the caller (charts, maps, forms with their own layout).
 */
export function Pane({
  icon: Icon,
  title,
  description,
  count,
  action,
  footer,
  children,
  className,
  bodyClassName,
  scroll = true,
  label,
  lang,
}: {
  icon?: LucideIcon;
  title?: React.ReactNode;
  description?: React.ReactNode;
  count?: number;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  scroll?: boolean;
  /** Accessible name when there is no visible title. */
  label?: string;
  lang?: string;
}) {
  const id = useId();
  return (
    <section
      aria-labelledby={title ? id : undefined}
      aria-label={title ? undefined : label}
      className={cn("relative flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-xs", className)}
    >
      {title && (
        <div className="flex shrink-0 items-center gap-2 px-4 pt-3 pb-2">
          {Icon && (
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-aurora/15 text-primary">
              <Icon className="size-4" aria-hidden />
            </span>
          )}
          <div className="min-w-0">
            <h2 id={id} className="truncate text-sm font-semibold tracking-tight" lang={lang}>
              {title}
            </h2>
            {description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
          </div>
          {count != null && (
            <Badge variant="secondary" className="shrink-0 tabular-nums">
              {count}
            </Badge>
          )}
          {action && <div className="ml-auto flex shrink-0 items-center gap-1.5">{action}</div>}
        </div>
      )}
      {scroll ? (
        <>
          {/* Radix wraps content in a display:table div, which defeats `truncate`; force it back to block. */}
          <ScrollArea className="min-h-0 flex-1 [&>[data-slot=scroll-area-viewport]>div]:block!">
            <div className={cn("px-4 pb-5", !title && "pt-4", bodyClassName)}>{children}</div>
          </ScrollArea>
          {!footer && <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-5 rounded-b-2xl bg-gradient-to-t from-card" />}
        </>
      ) : (
        <div className={cn("flex min-h-0 flex-1 flex-col", bodyClassName)}>{children}</div>
      )}
      {footer && <div className="shrink-0 border-t bg-card px-4 py-2.5">{footer}</div>}
    </section>
  );
}

/** Small KPI tile. Numbers are passed in by the caller; this only displays them. */
export function Stat({
  icon: Icon,
  label,
  value,
  suffix,
  hint,
  tone,
  className,
}: {
  icon?: LucideIcon;
  label: string;
  value: number | string;
  suffix?: string;
  hint?: React.ReactNode;
  tone?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 shadow-xs", className)}>
      {Icon && (
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-aurora/15 text-primary", tone)}>
          <Icon className="size-4" aria-hidden />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-xl leading-tight font-semibold tracking-tight tabular-nums">
          {typeof value === "number" ? <NumberTicker value={value} className="text-foreground" /> : value}
          {suffix}
        </p>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        {hint && <p className="truncate text-[11px] text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

/** Row of key facts shown as `label value` chips; wraps on small screens. */
export function MetaChip({ icon: Icon, children, className }: { icon?: LucideIcon; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border bg-background/70 px-2.5 py-1 text-xs text-muted-foreground", className)}>
      {Icon && <Icon className="size-3.5 text-primary" aria-hidden />}
      {children}
    </span>
  );
}
