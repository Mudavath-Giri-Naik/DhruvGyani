/**
 * The ONE place the embedding vector dimension is defined.
 * `supabase/migrations/0001_schema.sql` uses `vector(768)`; the unit test
 * `tests/unit/constants.test.ts` fails if the two ever drift apart.
 */
export const EMBEDDING_DIM = 768;

export const ITEM_TYPES = ["report", "dataset", "publication", "photo", "video", "activity"] as const;
export const ITEM_STATUSES = ["draft", "in_review", "published"] as const;
export const VISIBILITIES = ["internal", "public"] as const;
export const GEN_STATUSES = ["draft", "in_review", "approved", "published", "rejected"] as const;
export const CHANNELS = ["website_article", "x", "facebook", "instagram", "linkedin"] as const;
export const AUDIENCES = ["school", "college", "expert", "public"] as const;
export const LANGS = ["en", "hi"] as const;
export const VERDICTS = ["supported", "weak", "unsupported"] as const;
export const ROLES = ["member", "curator", "reviewer", "admin"] as const;
export const REGIONS = ["antarctica", "arctic", "himalaya", "southern_ocean", "ocean"] as const;
export const EXPEDITION_STATUSES = ["planned", "ongoing", "completed"] as const;
export const EXPLAINER_LEVELS = ["school", "college", "expert"] as const;

/** Library route segment (plural) -> item type */
export const LIBRARY_SEGMENTS = {
  reports: "report",
  datasets: "dataset",
  publications: "publication",
  photos: "photo",
  videos: "video",
  activities: "activity",
} as const;

export const PROMPT_VERSION = "studio-v1";

export const UPLOAD_LIMITS = {
  maxBytes: 25 * 1024 * 1024,
  mime: [
    "application/pdf",
    "text/csv",
    "application/vnd.ms-excel",
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
} as const;

export const NCPOR_COPYRIGHT_URL = "https://ncpor.res.in/pages/display/33-copyright-policy";
