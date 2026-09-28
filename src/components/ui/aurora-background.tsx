"use client";
import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

/**
 * Aceternity "aurora-background", adapted for DhruvGyani:
 *  - Polar Aurora palette (glacier blue, aurora teal/green, soft violet)
 *  - renders a <div> (pages own their <main>)
 *  - uses the `aurora-bg` keyframes so it doesn't clash with Magic UI's `aurora`
 *  - motion stops under prefers-reduced-motion (global rule in globals.css)
 */
interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({ className, children, showRadialGradient = true, ...props }: AuroraBackgroundProps) => {
  return (
    <div
      className={cn("relative flex flex-col items-center justify-center bg-background text-foreground transition-colors", className)}
      {...props}
    >
      <div
        className="absolute inset-0 overflow-hidden"
        style={
          {
            "--aurora":
              "repeating-linear-gradient(100deg,#3BA7E0_10%,#2DD4A7_15%,#7dd3fc_20%,#a78bfa_25%,#38bdf8_30%)",
            "--dark-gradient":
              "repeating-linear-gradient(100deg,#081426_0%,#081426_7%,transparent_10%,transparent_12%,#081426_16%)",
            "--white-gradient":
              "repeating-linear-gradient(100deg,#fff_0%,#fff_7%,transparent_10%,transparent_12%,#fff_16%)",
            "--c1": "#3BA7E0",
            "--c2": "#2DD4A7",
            "--c3": "#7dd3fc",
            "--c4": "#a78bfa",
            "--c5": "#38bdf8",
            "--black": "#081426",
            "--white": "#fff",
            "--transparent": "transparent",
          } as React.CSSProperties
        }
      >
        <div
          className={cn(
            `after:animate-aurora-bg pointer-events-none absolute -inset-[10px] [background-image:var(--white-gradient),var(--aurora)] [background-size:300%,_200%] [background-position:50%_50%,50%_50%] opacity-40 blur-[10px] invert filter will-change-transform [--aurora:repeating-linear-gradient(100deg,var(--c1)_10%,var(--c2)_15%,var(--c3)_20%,var(--c4)_25%,var(--c5)_30%)] [--dark-gradient:repeating-linear-gradient(100deg,var(--black)_0%,var(--black)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--black)_16%)] [--white-gradient:repeating-linear-gradient(100deg,var(--white)_0%,var(--white)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--white)_16%)] after:absolute after:inset-0 after:[background-image:var(--white-gradient),var(--aurora)] after:[background-size:200%,_100%] after:[background-attachment:fixed] after:mix-blend-difference after:content-[""] dark:[background-image:var(--dark-gradient),var(--aurora)] dark:opacity-60 dark:invert-0 after:dark:[background-image:var(--dark-gradient),var(--aurora)]`,
            showRadialGradient && `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]`,
          )}
        />
      </div>
      {children}
    </div>
  );
};
