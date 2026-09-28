import type {
  AppRole,
  AuditEntry,
  CalendarEntry,
  Chunk,
  DatasetProfile,
  Expedition,
  Explainer,
  ExplainerLevel,
  Generation,
  GenerationClaim,
  GenStatus,
  GlossaryTerm,
  Item,
  ItemFile,
  ItemType,
  Job,
  Lang,
  Organization,
  Profile,
  ReviewComment,
  SearchFilters,
  SearchResult,
  Station,
  Viewer,
} from "@/lib/types";

export type StorageBucket = "public-media" | "private-uploads" | "datasets";

export interface ItemQuery {
  type?: ItemType;
  expeditionId?: string;
  stationId?: string;
  /** staff only: include drafts/internal/embargoed (RLS still applies in Supabase) */
  includeNonPublic?: boolean;
  limit?: number;
  sort?: "newest" | "oldest" | "title";
}

export type NewItem = Omit<Item, "id" | "org_id" | "created_at" | "updated_at" | "created_by">;

export interface NewChunk {
  page_no: number | null;
  chunk_index: number;
  content: string;
  embedding?: number[] | null;
}

export interface SearchStats {
  top: { query: string; count: number; avgResults: number }[];
  noResult: { query: string; count: number }[];
  total: number;
  byDay: { day: string; searches: number; views: number }[];
}

export interface StaffEntry {
  email: string;
  role: AppRole;
  name: string | null;
  signedIn: boolean;
}

/**
 * Every read and write in the app goes through this interface. Two
 * implementations: SupabaseRepo (RLS is the real guard) and DemoRepo (an
 * in-memory store that emulates the same visibility rules).
 */
export interface Repo {
  readonly kind: "supabase" | "demo";
  viewer: Viewer;

  org(): Promise<Organization>;
  stations(): Promise<Station[]>;
  expeditions(): Promise<Expedition[]>;
  expeditionByCode(code: string): Promise<Expedition | null>;

  listItems(q?: ItemQuery): Promise<Item[]>;
  getItem(id: string): Promise<Item | null>;
  getItems(ids: string[]): Promise<Item[]>;
  createItem(input: NewItem): Promise<Item>;
  updateItem(id: string, patch: Partial<NewItem>): Promise<Item>;
  counts(): Promise<Record<ItemType, number> & { expeditions: number }>;

  chunksFor(itemIds: string[]): Promise<Chunk[]>;
  replaceChunks(itemId: string, chunks: NewChunk[]): Promise<void>;
  itemFiles(itemId: string): Promise<ItemFile[]>;
  addItemFile(file: Omit<ItemFile, "id">): Promise<void>;
  /** Store bytes; returns a URL the browser can use (public URL or /api/files proxy). */
  putFile(bucket: StorageBucket, path: string, data: ArrayBuffer, mime: string): Promise<string>;
  getFile(bucket: StorageBucket, path: string): Promise<ArrayBuffer | null>;
  /** Item that owns a stored file (null if none or not visible to the viewer). */
  fileItemId(bucket: StorageBucket, path: string): Promise<string | null>;
  /** All photo perceptual hashes (duplicate detection). */
  photoHashes(): Promise<{ item_id: string; phash: string }[]>;
  getJob(id: string): Promise<Job | null>;

  search(query: string, filters: SearchFilters, embedding?: number[] | null): Promise<SearchResult[]>;
  /** Semantic/keyword retrieval restricted to given items (Studio, Ask). */
  retrieve(query: string, itemIds: string[] | null, embedding: number[] | null, limit: number): Promise<Chunk[]>;

  datasetProfile(itemId: string): Promise<DatasetProfile | null>;
  saveDatasetProfile(p: DatasetProfile): Promise<void>;
  datasetCsv(itemId: string): Promise<string | null>;

  explainer(itemId: string, level: ExplainerLevel, lang: Lang): Promise<Explainer | null>;
  saveExplainer(e: Explainer): Promise<void>;

  listGenerations(q?: { status?: GenStatus[]; channel?: Generation["channel"] }): Promise<Generation[]>;
  getGeneration(id: string): Promise<Generation | null>;
  getGenerationBySlug(slug: string): Promise<Generation | null>;
  publishedArticles(limit?: number): Promise<Generation[]>;
  createGeneration(g: Omit<Generation, "id" | "org_id" | "created_at" | "updated_at" | "created_by">): Promise<Generation>;
  updateGeneration(id: string, patch: Partial<Generation>): Promise<Generation>;
  claims(generationId: string): Promise<GenerationClaim[]>;
  replaceClaims(generationId: string, claims: Omit<GenerationClaim, "id">[]): Promise<GenerationClaim[]>;
  comments(generationId: string): Promise<ReviewComment[]>;
  addComment(generationId: string, body: string): Promise<void>;

  calendar(): Promise<CalendarEntry[]>;
  updateCalendar(id: string, patch: Partial<CalendarEntry>): Promise<void>;
  glossary(): Promise<GlossaryTerm[]>;

  logSearch(query: string, resultCount: number): Promise<void>;
  logView(itemId: string): Promise<void>;
  searchStats(days?: number): Promise<SearchStats>;
  viewCounts(): Promise<Record<string, number>>;

  audit(action: string, entity: string, entityId: string | null, meta?: Record<string, unknown>): Promise<void>;
  auditLog(limit?: number): Promise<AuditEntry[]>;

  jobs(limit?: number): Promise<Job[]>;
  enqueueJob(job: Pick<Job, "type" | "payload" | "item_id">): Promise<Job>;
  updateJob(id: string, patch: Partial<Job>): Promise<void>;

  team(): Promise<StaffEntry[]>;
  setStaff(email: string, role: AppRole | null): Promise<void>;
  profiles(): Promise<Profile[]>;

  favourites(): Promise<string[]>;
  toggleFavourite(itemId: string): Promise<boolean>;
  addQuizAttempt(itemId: string, score: number): Promise<void>;
}
