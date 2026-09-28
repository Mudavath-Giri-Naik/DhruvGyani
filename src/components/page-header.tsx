import { BlurFade } from "@/components/ui/blur-fade";
import { cn } from "@/lib/utils";

/** Consistent, animated page heading used across the portal. */
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
  lang,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  lang?: string;
}) {
  return (
    <div className={cn("relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <BlurFade direction="up" offset={8} className="min-w-0 space-y-2">
        {eyebrow && <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-primary">{eyebrow}</div>}
        <h1 className="text-2xl font-semibold tracking-tight text-balance md:text-3xl" lang={lang}>
          {title}
        </h1>
        {description && <p className="max-w-2xl text-sm text-pretty text-muted-foreground md:text-base">{description}</p>}
      </BlurFade>
      {actions && (
        <BlurFade direction="up" delay={0.08} className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </BlurFade>
      )}
    </div>
  );
}

export function PageShell({ children, className, wide }: { children: React.ReactNode; className?: string; wide?: boolean }) {
  return <div className={cn("mx-auto w-full space-y-8 px-4 py-6 md:px-8 md:py-8", wide ? "max-w-[1400px]" : "max-w-7xl", className)}>{children}</div>;
}

export function EmptyState({ icon, title, body, action }: { icon?: React.ReactNode; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 px-6 py-14 text-center">
      {icon && <div className="rounded-full bg-primary/10 p-3 text-primary">{icon}</div>}
      <p className="font-medium">{title}</p>
      {body && <p className="max-w-md text-sm text-muted-foreground">{body}</p>}
      {action}
    </div>
  );
}
