import type { OrgSettings } from "@/lib/types";

export const DEFAULT_SETTINGS: OrgSettings = {
  displayName: "DhruvGyani · NCPOR",
  tagline: "India's polar science, in one place, in everyone's language.",
  languages: { en: true, hi: true },
  hashtags: ["#PolarScience", "#NCPOR", "#DhruvGyani"],
  xLimit: 280,
  defaultAudience: "public",
  defaultRelease: "internal",
  defaultEmbargoDays: 30,
};
