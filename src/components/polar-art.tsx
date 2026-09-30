import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Procedural SVG polar scenes. Used for sample "photos" and expedition
 * covers so the demo never copies NCPOR imagery. Decorative unless a label
 * is supplied.
 */
export type ArtVariant = "aurora" | "snowfield" | "ship-ice" | "glacier" | "fjord" | "antarctic-coast" | "ocean";

const SKIES: Record<ArtVariant, [string, string, string]> = {
  aurora: ["#050d1c", "#0b1f3a", "#12345a"],
  snowfield: ["#9fd3f2", "#cfe9f8", "#eef7fc"],
  "ship-ice": ["#1b2a4a", "#6b5b8c", "#f0a97a"],
  glacier: ["#3d7cc9", "#8cc4ec", "#dff1fb"],
  fjord: ["#f6c27a", "#f2a36b", "#7b90c9"],
  "antarctic-coast": ["#4aa3df", "#a6d8f5", "#e8f6fd"],
  ocean: ["#0a2a4a", "#155a8a", "#3ba7e0"],
};

export function PolarArt({ variant = "aurora", className, label }: { variant?: string; className?: string; label?: string }) {
  const v = (variant in SKIES ? variant : "aurora") as ArtVariant;
  const id = useId().replace(/[:«»]/g, "");
  const [s1, s2, s3] = SKIES[v];
  const night = v === "aurora" || v === "ocean";
  return (
    <svg
      viewBox="0 0 400 240"
      preserveAspectRatio="xMidYMid slice"
      className={cn("h-full w-full", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <linearGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={s1} />
          <stop offset="0.6" stopColor={s2} />
          <stop offset="1" stopColor={s3} />
        </linearGradient>
        <linearGradient id={`aur-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2dd4a7" stopOpacity="0" />
          <stop offset="0.3" stopColor="#2dd4a7" stopOpacity="0.85" />
          <stop offset="0.6" stopColor="#3ba7e0" stopOpacity="0.7" />
          <stop offset="1" stopColor="#8b7cf6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`ice-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#cfe6f5" />
        </linearGradient>
        <linearGradient id={`sea-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={night ? "#0d2c4f" : "#2f78b3"} />
          <stop offset="1" stopColor={night ? "#061528" : "#16466f"} />
        </linearGradient>
        <filter id={`blur-${id}`}>
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <rect width="400" height="240" fill={`url(#sky-${id})`} />

      {night && (
        <g fill="#fff">
          {Array.from({ length: 40 }, (_, i) => (
            <circle key={i} cx={(i * 97) % 400} cy={(i * 53) % 120} r={i % 5 === 0 ? 1.3 : 0.7} opacity={0.4 + ((i * 7) % 6) / 10} />
          ))}
        </g>
      )}

      {v === "aurora" && (
        <g filter={`url(#blur-${id})`} className="motion-safe:animate-pulse" style={{ animationDuration: "6s" }}>
          <path d="M-20 90 C 60 40, 140 120, 220 60 S 360 30, 420 70 L 420 110 C 340 80, 260 140, 180 100 S 40 120, -20 130 Z" fill={`url(#aur-${id})`} />
          <path d="M-20 60 C 80 20, 160 90, 260 40 S 380 20, 420 40 L 420 60 C 330 50, 250 100, 170 70 S 40 70, -20 90 Z" fill={`url(#aur-${id})`} opacity="0.6" />
        </g>
      )}
      {v === "fjord" && <circle cx="300" cy="120" r="26" fill="#ffe0a3" opacity="0.9" />}
      {v === "ship-ice" && <circle cx="90" cy="135" r="20" fill="#ffd2a8" opacity="0.8" />}

      {(v === "glacier" || v === "fjord") && (
        <g>
          <path d="M0 170 L60 90 L100 130 L150 60 L210 140 L260 80 L320 150 L370 100 L400 130 L400 240 L0 240 Z" fill={v === "fjord" ? "#2a3350" : "#5d7390"} />
          <path d="M150 60 L170 88 L160 86 L150 100 L140 84 L130 90 Z M260 80 L278 104 L262 100 L252 110 Z M60 90 L75 110 L60 106 L50 116 Z" fill="#fff" opacity="0.95" />
        </g>
      )}
      {v === "glacier" && <path d="M120 240 C 150 180, 200 150, 230 140 C 250 170, 280 200, 300 240 Z" fill={`url(#ice-${id})`} />}
      {v === "fjord" && <rect y="170" width="400" height="70" fill="#35456e" opacity="0.9" />}
      {v === "fjord" && <path d="M0 170 L60 200 L100 180 L150 215 L210 185 L260 205 L320 180 L400 200 L400 170 Z" fill="#232b45" opacity="0.6" />}

      {(v === "ocean" || v === "ship-ice" || v === "aurora" || v === "antarctic-coast") && (
        <rect y={v === "antarctic-coast" ? 170 : 175} width="400" height="70" fill={`url(#sea-${id})`} />
      )}
      {(v === "aurora" || v === "antarctic-coast" || v === "snowfield") && (
        <path d="M0 180 C 60 150, 120 165, 180 150 S 300 140, 400 160 L400 240 L0 240 Z" fill={`url(#ice-${id})`} opacity={v === "aurora" ? 0.85 : 1} />
      )}
      {v === "snowfield" && <path d="M0 150 C 80 130, 160 145, 240 128 S 360 120, 400 135 L400 160 L0 170 Z" fill="#e2f0f9" />}
      {v === "aurora" && (
        <g fill="#13243d">
          <rect x="280" y="160" width="36" height="14" rx="2" />
          <rect x="292" y="152" width="14" height="10" />
          <rect x="286" y="164" width="4" height="4" fill="#ffd27a" />
          <rect x="300" y="164" width="4" height="4" fill="#ffd27a" />
        </g>
      )}
      {(v === "ship-ice" || v === "ocean") && (
        <g fill="#f5fbff" opacity="0.95">
          <path d="M20 200 l30 -6 l20 8 l-10 6 Z M110 214 l40 -5 l18 9 l-40 4 Z M300 205 l35 -7 l25 10 l-30 5 Z M220 222 l30 -4 l12 6 l-28 4 Z" />
        </g>
      )}
      {v === "ship-ice" && (
        <g fill="#0f1b2e">
          <path d="M170 196 L270 196 L258 212 L182 212 Z" />
          <rect x="200" y="176" width="40" height="20" />
          <rect x="214" y="160" width="8" height="16" />
          <rect x="190" y="190" width="60" height="4" fill="#c0392b" />
        </g>
      )}
      {v === "antarctic-coast" && (
        <g>
          <path d="M0 150 L40 120 L90 140 L140 110 L200 145 L260 125 L320 150 L400 135 L400 175 L0 175 Z" fill="#ffffff" />
          <path d="M300 150 l0 -40 M300 112 l14 6 M300 120 l-10 4" stroke="#13243d" strokeWidth="2" />
        </g>
      )}
      {v === "ocean" && (
        <g stroke="#9fd6f5" strokeOpacity="0.35" fill="none">
          <path d="M0 190 q 25 -6 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0" />
          <path d="M0 210 q 25 -6 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0" />
        </g>
      )}
    </svg>
  );
}

/** Expedition cover: the credited photograph when there is one (`/media/…` or a URL), otherwise an illustration (`art:…`). */
export function Cover({ src, className, fallback = "aurora" }: { src: string | null | undefined; className?: string; fallback?: ArtVariant }) {
  if (src && !src.startsWith("art:")) {
    // eslint-disable-next-line @next/next/no-img-element -- bundled or stored photograph, decorative here (the title sits beside it)
    return <img src={src} alt="" className={cn("h-full w-full object-cover", className)} loading="lazy" />;
  }
  return <PolarArt variant={artVariant(src) ?? fallback} className={className} />;
}

export function artVariant(url: string | null | undefined): string | null {
  return url?.startsWith("art:") ? url.slice(4) : null;
}
