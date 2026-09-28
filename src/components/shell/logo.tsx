import { cn } from "@/lib/utils";

/** Snowflake-compass mark: a polar star inside a rounded navy tile. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("rounded-lg", className)} aria-hidden>
      <defs>
        <linearGradient id="dg-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3BA7E0" />
          <stop offset="1" stopColor="#2DD4A7" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="#081426" />
      <g stroke="url(#dg-logo)" strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M32 12v40M14.7 22l34.6 20M14.7 42l34.6-20" />
        <path d="M26 15l6 5 6-5M26 49l6-5 6 5" />
      </g>
    </svg>
  );
}
