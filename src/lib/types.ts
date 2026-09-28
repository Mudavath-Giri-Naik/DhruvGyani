import type {
  AUDIENCES,
  CHANNELS,
  EXPEDITION_STATUSES,
  EXPLAINER_LEVELS,
  GEN_STATUSES,
  ITEM_STATUSES,
  ITEM_TYPES,
  LANGS,
  REGIONS,
  ROLES,
  VERDICTS,
  VISIBILITIES,
} from "./constants";

export type ItemType = (typeof ITEM_TYPES)[number];
export type ItemStatus = (typeof ITEM_STATUSES)[number];
export type Visibility = (typeof VISIBILITIES)[number];
export type GenStatus = (typeof GEN_STATUSES)[number];
export type Channel = (typeof CHANNELS)[number];
export type Audience = (typeof AUDIENCES)[number];
export type Lang = (typeof LANGS)[number];
export type Verdict = (typeof VERDICTS)[number];
export type AppRole = (typeof ROLES)[number];
export type Role = AppRole | "visitor";
export type Region = (typeof REGIONS)[number];
export type ExpeditionStatus = (typeof EXPEDITION_STATUSES)[number];
export type ExplainerLevel = (typeof EXPLAINER_LEVELS)[number];

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email?: string | null;
  avatar_url: string | null;
  role: AppRole;
  org_id: string | null;
}

export interface Viewer {
  id: string | null;
  name: string | null;
  email: string | null;
  avatar: string | null;
  role: Role;
  orgId: string | null;
  demo: boolean;
}

export interface Station {
  id: string;
  name: string;
  region: Region;
  lat: number;
  lng: number;
  description: string;
}

export interface Expedition {
  id: string;
  org_id: string;
  code: string;
  region: Region;
  title: string;
  summary: string;
  start_date: string | null;
  end_date: string | null;
  status: ExpeditionStatus;
  cover_url: string | null;
  station_id: string | null;
  is_sample: boolean;
}

export interface Item {
  id: string;
  org_id: string;
  type: ItemType;
  title: string;
  description: string;
  expedition_id: string | null;
  station_id: string | null;
  discipline: string[];
  tags: string[];
  authors: string[];
  event_date: string | null;
  language: Lang;
  license: string | null;
  source_url: string | null;
  external_url: string | null;
  status: ItemStatus;
  visibility: Visibility;
  embargo_until: string | null;
  is_sample: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  /** Optional preview asset (thumbnail, video embed, local sample PDF) */
  media_url?: string | null;
  alt_text?: string | null;
}

export interface Chunk {
  id: string;
  item_id: string;
  page_no: number | null;
  chunk_index: number;
  content: string;
}

export interface DatasetColumn {
  name: string;
  kind: "number" | "date" | "text";
  count: number;
  missing: number;
  missingPct: number;
  min?: number | string;
  max?: number | string;
  mean?: number;
  unit?: string | null;
}

export interface DatasetProfile {
  item_id: string;
  columns: DatasetColumn[];
  row_count: number;
  time_range: { column: string; start: string; end: string } | null;
  units: Record<string, string>;
  stats: Record<string, unknown>;
  summary: string | null;
  sample_rows?: Record<string, string | number | null>[];
}

export interface Citation {
  marker: string; // e.g. "c1"
  chunk_id: string;
  item_id: string;
  item_title: string;
  page_no: number | null;
  quote: string;
}

export interface ArticleOutput {
  headline: string;
  standfirst: string;
  body: { text: string; cites: string[] }[];
  key_facts: { text: string; cites: string[] }[];
}

export interface SocialOutput {
  text: string;
  cites: string[];
  hashtags?: string[];
  alt_text?: string;
  image_suggestion?: string;
}

export type GenerationOutput =
  | ({ channel: "website_article" } & ArticleOutput)
  | ({ channel: Exclude<Channel, "website_article"> } & SocialOutput);

export interface Generation {
  id: string;
  org_id: string;
  item_ids: string[];
  audience: Audience;
  language: Lang;
  channel: Channel;
  prompt_version: string;
  model: string | null;
  output: GenerationOutput;
  citations: Citation[];
  slug: string | null;
  status: GenStatus;
  created_by: string | null;
  created_by_name?: string | null;
  reviewed_by: string | null;
  reviewed_by_name?: string | null;
  reviewed_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  is_demo?: boolean;
}

export interface GenerationClaim {
  id: string;
  generation_id: string;
  claim_text: string;
  chunk_id: string | null;
  verdict: Verdict;
  note: string | null;
  number_misses: string[];
}

export interface ReviewComment {
  id: string;
  generation_id: string;
  author_name: string;
  body: string;
  at: string;
}

export interface Explainer {
  item_id: string;
  level: ExplainerLevel;
  language: Lang;
  text: string;
  citations: Citation[];
  created_at?: string;
}

export interface CalendarEntry {
  id: string;
  date: string; // YYYY-MM-DD (next occurrence)
  occasion: string;
  occasion_hi?: string;
  kind: "occasion" | "milestone";
  suggested_item_ids: string[];
  status: "idea" | "planned" | "done";
}

export interface GlossaryTerm {
  id: string;
  term: string;
  term_hi: string;
  meaning_en: string;
  meaning_hi: string;
}

export interface AuditEntry {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  meta: Record<string, unknown>;
  at: string;
}

export interface Job {
  id: string;
  type: "ingest_pdf" | "ingest_csv" | "ingest_photo" | "embed_item";
  payload: Record<string, unknown>;
  status: "queued" | "running" | "done" | "failed";
  error: string | null;
  attempts: number;
  item_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SearchFilters {
  types?: ItemType[];
  expeditionId?: string;
  stationId?: string;
  year?: number;
  discipline?: string;
  language?: Lang;
}

export interface SearchResult {
  item: Item;
  snippet: string;
  score: number;
}

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  cite: string;
}

export interface ItemFile {
  id: string;
  item_id: string;
  storage_bucket: string;
  storage_path: string;
  mime: string;
  size: number;
  checksum: string | null;
}
