import { useTranslations } from "next-intl";
import { BotOff, ExternalLink, FlaskConical, Lock, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { isAiAllowed, isEmbargoed } from "@/lib/policy";
import type { Item } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TYPE_TONE, TypeIcon } from "./type-icon";

export function TypeBadge({ type, className }: { type: string; className?: string }) {
  const t = useTranslations("types");
  return (
    <Badge variant="outline" className={cn("gap-1 border font-medium", TYPE_TONE[type], className)}>
      <TypeIcon type={type} className="size-3" />
      {t(type as "report")}
    </Badge>
  );
}

export function SampleBadge({ className }: { className?: string }) {
  const t = useTranslations("common");
  return (
    <Badge variant="outline" className={cn("gap-1 border-dashed border-warning/60 text-warning", className)} title="Fictional sample content — not real data">
      <FlaskConical className="size-3" />
      {t("sample")}
    </Badge>
  );
}

export function ExternalBadge() {
  const t = useTranslations("common");
  return (
    <Badge variant="outline" className="gap-1">
      <ExternalLink className="size-3" />
      {t("external")}
    </Badge>
  );
}

/** Status flags: sample / external / internal / embargoed / AI disabled. */
export function ItemFlags({ item, showAi = false, hideExternal = false }: { item: Item; showAi?: boolean; hideExternal?: boolean }) {
  const t = useTranslations("common");
  const embargoed = isEmbargoed(item);
  return (
    <>
      {item.is_sample && <SampleBadge />}
      {item.external_url && !hideExternal && <ExternalBadge />}
      {item.visibility === "internal" && (
        <Badge variant="outline" className="gap-1 border-destructive/40 text-destructive">
          <Lock className="size-3" />
          {t("internal")}
        </Badge>
      )}
      {embargoed && (
        <Badge variant="outline" className="gap-1 border-warning/60 text-warning">
          <Timer className="size-3" />
          {t("embargoedUntil", { date: new Date(item.embargo_until!).toLocaleDateString("en-IN", { dateStyle: "medium" }) })}
        </Badge>
      )}
      {item.status !== "published" && <Badge variant="secondary">{item.status === "draft" ? t("draft") : t("inReview")}</Badge>}
      {showAi && !isAiAllowed(item) && (
        <Badge variant="outline" className="gap-1">
          <BotOff className="size-3" />
          {t("aiDisabled")}
        </Badge>
      )}
    </>
  );
}
