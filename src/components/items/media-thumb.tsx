import { Play } from "lucide-react";
import { PolarArt, artVariant } from "@/components/polar-art";
import { youtubeId, youtubePoster } from "@/lib/media";
import type { Item } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DocCover, type CoverItem } from "./doc-cover";
import { TYPE_ICON } from "./type-icon";

const TYPE_ART: Record<string, string> = {
  report: "antarctic-coast",
  dataset: "ocean",
  publication: "snowfield",
  photo: "aurora",
  video: "fjord",
  activity: "glacier",
};

const COVER_TYPES = ["report", "dataset", "publication"];
const IMAGE = /\.(png|jpe?g|webp|gif|svg)(\?|$)/i;

/** True when the item gets a designed cover (which already carries its title) instead of a picture. */
export function usesCover(item: CoverItem) {
  return COVER_TYPES.includes(item.type) && !(item.media_url && IMAGE.test(item.media_url)) && !youtubeId(item.media_url) && !artVariant(item.media_url);
}

/** Visual for an item: its photograph, its video poster, its illustration, a designed cover (documents and data), or a type-themed scene. */
export function MediaThumb({ item, className, label, meta }: { item: CoverItem & Pick<Item, "alt_text">; className?: string; label?: boolean; /** Extra line for a designed cover (expedition, date). */ meta?: string | null }) {
  const art = artVariant(item.media_url);
  const yt = youtubeId(item.media_url);
  const isImage = item.media_url && IMAGE.test(item.media_url);
  const Icon = TYPE_ICON[item.type];
  if (usesCover(item)) {
    return (
      <div className={cn("relative overflow-hidden bg-card", className)}>
        <DocCover item={item} meta={meta} />
      </div>
    );
  }
  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {isImage || yt ? (
        // eslint-disable-next-line @next/next/no-img-element -- bundled photographs, user uploads from Supabase storage and YouTube posters
        <img src={yt ? youtubePoster(yt) : item.media_url!} alt={label && !yt ? (item.alt_text ?? "") : ""} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <PolarArt variant={art ?? TYPE_ART[item.type]} label={label && art ? (item.alt_text ?? undefined) : undefined} />
      )}
      {yt && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
          <div className="rounded-full bg-black/60 p-2.5 text-white shadow-lg backdrop-blur-sm">
            <Play className="size-5 fill-current" aria-hidden />
          </div>
        </div>
      )}
      {!art && !isImage && !yt && Icon && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-2xl border border-white/30 bg-white/15 p-3 text-white shadow-lg backdrop-blur-md">
            <Icon className="size-7" aria-hidden />
          </div>
        </div>
      )}
    </div>
  );
}
