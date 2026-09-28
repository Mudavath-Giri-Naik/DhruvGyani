import { PolarArt, artVariant } from "@/components/polar-art";
import type { Item } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TYPE_ICON } from "./type-icon";

const TYPE_ART: Record<string, string> = {
  report: "antarctic-coast",
  dataset: "ocean",
  publication: "snowfield",
  photo: "aurora",
  video: "fjord",
  activity: "glacier",
};

/** Visual for an item: its illustration, uploaded image, or a type-themed scene. */
export function MediaThumb({ item, className, label }: { item: Pick<Item, "type" | "media_url" | "alt_text">; className?: string; label?: boolean }) {
  const art = artVariant(item.media_url);
  const isImage = item.media_url && /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(item.media_url);
  const Icon = TYPE_ICON[item.type];
  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- user uploads from Supabase storage
        <img src={item.media_url!} alt={label ? (item.alt_text ?? "") : ""} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <PolarArt variant={art ?? TYPE_ART[item.type]} label={label && art ? (item.alt_text ?? undefined) : undefined} />
      )}
      {!art && !isImage && Icon && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-2xl border border-white/30 bg-white/15 p-3 text-white shadow-lg backdrop-blur-md">
            <Icon className="size-7" aria-hidden />
          </div>
        </div>
      )}
    </div>
  );
}
