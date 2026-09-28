import "server-only";

/**
 * In-memory demo store. Used automatically when Supabase is not configured
 * so the whole portal can be explored before any keys exist. It emulates
 * the RLS visibility rules (public vs staff) in code. State lives in the
 * server process and resets on restart.
 */
import { buildCalendar } from "@/lib/calendar";
import { profileCsv } from "@/lib/datasets/profile";
import { isPubliclyVisible } from "@/lib/policy";
import { rrfMerge } from "@/lib/search/rrf";
import {
  ORG_ID,
  chunkId,
  datasetCsv,
  demoProfiles,
  expeditions as seedExpeditions,
  items as seedItems,
  org,
  sampleDocs,
  sid,
  stations as seedStations,
} from "@/lib/seed/data";
import { glossarySeed } from "@/lib/seed/glossary";
import { seedGenerations } from "@/lib/seed/packs";
import { verifyClaimsOffline } from "@/lib/trust/claims";
import type {
  AuditEntry,
  CalendarEntry,
  Chunk,
  DatasetProfile,
  Explainer,
  Generation,
  GenerationClaim,
  Item,
  ItemFile,
  ItemType,
  Job,
  ReviewComment,
  Viewer,
} from "@/lib/types";
import type { ItemQuery, NewChunk, NewItem, Repo, SearchStats, StaffEntry } from "./repo";


interface State {
  items: Item[];
  chunks: Chunk[];
  files: ItemFile[];
  profiles: DatasetProfile[];
  csv: Map<string, string>;
  explainers: Explainer[];
  generations: Generation[];
  claims: GenerationClaim[];
  comments: ReviewComment[];
  calendar: CalendarEntry[];
  searches: { query: string; result_count: number; at: string }[];
  views: { item_id: string; at: string }[];
  audit: AuditEntry[];
  jobs: Job[];
  staff: { email: string; role: StaffEntry["role"] }[];
  favourites: Map<string, Set<string>>;
  quiz: { user_id: string; item_id: string; score: number; at: string }[];
  seq: number;
}

function daysAgo(n: number, hour = 10) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
}

function initState(): State {
  const items = seedItems.map((i) => ({ ...i }));
  const chunks: Chunk[] = [];
  for (const [itemId, pages] of Object.entries(sampleDocs)) {
    pages.forEach((content, p) => chunks.push({ id: chunkId(itemId, p + 1), item_id: itemId, page_no: p + 1, chunk_index: p, content }));
  }
  const csv = new Map<string, string>();
  const profiles: DatasetProfile[] = [];
  for (const [itemId, d] of Object.entries(datasetCsv)) {
    const text = d.csv();
    csv.set(itemId, text);
    const { rows: _rows, ...p } = profileCsv(text, d.units);
    void _rows;
    profiles.push({ ...p, item_id: itemId });
  }
  const generations = seedGenerations.map((g) => ({ ...g }));
  const claims: GenerationClaim[] = generations.flatMap((g) => verifyClaimsOffline(g.id, g.output, g.citations, chunks));

  // Seeded analytics so dashboards are not empty in the demo. Queries only, no personal data.
  const searches: State["searches"] = [];
  const seedQueries: [string, number, number][] = [
    ["sea ice", 5, 34], ["glacier", 6, 27], ["weather station", 4, 22], ["krill", 2, 15], ["ozone hole", 0, 23],
    ["permafrost", 0, 12], ["हिमनद", 1, 9], ["aurora", 3, 11], ["ice core", 2, 14], ["penguin", 0, 18],
    ["Maitri", 5, 16], ["46-ISEA", 2, 13], ["climate change", 0, 9],
  ];
  seedQueries.forEach(([q, results, n], qi) => {
    for (let k = 0; k < n; k++) searches.push({ query: q, result_count: results, at: daysAgo((k * 7 + qi) % 14, 8 + (k % 10)) });
  });
  const views: State["views"] = [];
  items.filter((i) => isPubliclyVisible(i)).forEach((i, idx) => {
    const n = 8 + ((idx * 37) % 55);
    for (let k = 0; k < n; k++) views.push({ item_id: i.id, at: daysAgo((k * 3 + idx) % 14, 9 + (k % 9)) });
  });

  const audit: AuditEntry[] = [
    { id: sid(401), actor_id: sid(12), actor_name: "Sample Curator", action: "item.create", entity: "item", entity_id: seedItems[0].id, meta: { title: seedItems[0].title }, at: daysAgo(6) },
    { id: sid(402), actor_id: sid(12), actor_name: "Sample Curator", action: "generation.submit", entity: "generation", entity_id: sid(205), meta: { channel: "x" }, at: daysAgo(3) },
    { id: sid(403), actor_id: sid(13), actor_name: "Sample Reviewer", action: "generation.publish", entity: "generation", entity_id: sid(201), meta: { slug: "inside-a-sample-antarctic-field-log" }, at: daysAgo(2) },
    { id: sid(404), actor_id: sid(14), actor_name: "Sample Admin", action: "role.change", entity: "profile", entity_id: sid(13), meta: { role: "reviewer" }, at: daysAgo(1) },
  ];

  return {
    items,
    chunks,
    files: [],
    profiles,
    csv,
    explainers: [],
    generations,
    claims,
    comments: [
      { id: sid(501), generation_id: sid(205), author_name: "Sample Reviewer", body: "Please double-check the station count against the field log before I approve.", at: daysAgo(2) },
    ],
    calendar: buildCalendar(items.filter((i) => isPubliclyVisible(i))),
    searches,
    views,
    audit,
    jobs: [],
    staff: demoProfiles.filter((p) => p.role !== "member").map((p) => ({ email: p.email!, role: p.role })),
    favourites: new Map(),
    quiz: [],
    seq: 1000,
  };
}

const g = globalThis as unknown as { __dhruvDemo?: State };
function state(): State {
  if (!g.__dhruvDemo) g.__dhruvDemo = initState();
  return g.__dhruvDemo;
}

const uuid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

const isStaffRole = (v: Viewer) => ["curator", "reviewer", "admin"].includes(v.role);

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^\p{L}\p{M}\p{N}]+/u)
    .filter((t) => t.length > 1);
}

function scoreText(query: string[], text: string): number {
  const hay = text.toLowerCase();
  const words = new Set(tokens(text));
  let s = 0;
  for (const q of query) {
    if (words.has(q)) s += 2;
    else if (q.length > 3 && hay.includes(q.slice(0, Math.max(4, q.length - 2)))) s += 1;
  }
  if (query.length > 1 && hay.includes(query.join(" "))) s += 3;
  return s;
}

export class DemoRepo implements Repo {
  readonly kind = "demo" as const;
  constructor(public viewer: Viewer) {}

  private visible(i: Item) {
    return isPubliclyVisible(i) || (isStaffRole(this.viewer) && i.org_id === ORG_ID);
  }
  private requireStaff() {
    if (!isStaffRole(this.viewer)) throw new Error("Staff only");
  }
  private get s() {
    return state();
  }

  async org() {
    return org;
  }
  async stations() {
    return seedStations;
  }
  async expeditions() {
    return seedExpeditions;
  }
  async expeditionByCode(code: string) {
    return seedExpeditions.find((e) => e.code.toLowerCase() === code.toLowerCase()) ?? null;
  }

  async listItems(q: ItemQuery = {}) {
    let list = this.s.items.filter((i) => (q.includeNonPublic ? this.visible(i) : isPubliclyVisible(i)));
    if (q.type) list = list.filter((i) => i.type === q.type);
    if (q.expeditionId) list = list.filter((i) => i.expedition_id === q.expeditionId);
    if (q.stationId) list = list.filter((i) => i.station_id === q.stationId);
    const sort = q.sort ?? "newest";
    list = [...list].sort((a, b) =>
      sort === "title" ? a.title.localeCompare(b.title) : (sort === "oldest" ? 1 : -1) * ((a.event_date ?? a.created_at).localeCompare(b.event_date ?? b.created_at)),
    );
    return q.limit ? list.slice(0, q.limit) : list;
  }
  async getItem(id: string) {
    const i = this.s.items.find((x) => x.id === id);
    return i && this.visible(i) ? i : null;
  }
  async getItems(ids: string[]) {
    return this.s.items.filter((i) => ids.includes(i.id) && this.visible(i));
  }
  async createItem(input: NewItem) {
    this.requireStaff();
    if (input.status === "published" && !["reviewer", "admin"].includes(this.viewer.role)) throw new Error("Only reviewers can publish");
    const item: Item = { ...input, id: uuid(), org_id: ORG_ID, created_by: this.viewer.id, created_at: now(), updated_at: now() };
    this.s.items.unshift(item);
    return item;
  }
  async updateItem(id: string, patch: Partial<NewItem>) {
    this.requireStaff();
    const i = this.s.items.find((x) => x.id === id);
    if (!i) throw new Error("Not found");
    if (patch.status === "published" && !["reviewer", "admin"].includes(this.viewer.role)) throw new Error("Only reviewers can publish");
    Object.assign(i, patch, { updated_at: now() });
    return i;
  }
  async counts() {
    const pub = this.s.items.filter((i) => isPubliclyVisible(i));
    const c = { report: 0, dataset: 0, publication: 0, photo: 0, video: 0, activity: 0 } as Record<ItemType, number>;
    for (const i of pub) c[i.type]++;
    return { ...c, expeditions: seedExpeditions.length };
  }

  async chunksFor(itemIds: string[]) {
    const allowed = new Set((await this.getItems(itemIds)).map((i) => i.id));
    return this.s.chunks.filter((c) => allowed.has(c.item_id)).sort((a, b) => a.chunk_index - b.chunk_index);
  }
  async replaceChunks(itemId: string, chunks: NewChunk[]) {
    this.s.chunks = this.s.chunks.filter((c) => c.item_id !== itemId);
    chunks.forEach((c) => this.s.chunks.push({ id: uuid(), item_id: itemId, page_no: c.page_no, chunk_index: c.chunk_index, content: c.content }));
  }
  async itemFiles(itemId: string) {
    return this.s.files.filter((f) => f.item_id === itemId);
  }
  async addItemFile(file: Omit<ItemFile, "id">) {
    this.s.files.push({ ...file, id: uuid() });
  }

  async search(query: string, filters: import("@/lib/types").SearchFilters) {
    const q = tokens(query);
    if (!q.length) return [];
    const staffView = isStaffRole(this.viewer);
    const candidates = this.s.items.filter((i) => {
      if (!(staffView ? this.visible(i) : isPubliclyVisible(i))) return false;
      if (filters.types?.length && !filters.types.includes(i.type)) return false;
      if (filters.expeditionId && i.expedition_id !== filters.expeditionId) return false;
      if (filters.stationId && i.station_id !== filters.stationId) return false;
      if (filters.year && (!i.event_date || Number(i.event_date.slice(0, 4)) !== filters.year)) return false;
      if (filters.discipline && !i.discipline.includes(filters.discipline)) return false;
      if (filters.language && i.language !== filters.language) return false;
      return true;
    });
    const ids = new Set(candidates.map((c) => c.id));
    const itemRank = candidates
      .map((i) => ({ id: i.id, s: scoreText(q, `${i.title} ${i.title} ${i.tags.join(" ")} ${i.discipline.join(" ")} ${i.description} ${i.authors.join(" ")}`) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s);
    const chunkRank = this.s.chunks
      .filter((c) => ids.has(c.item_id))
      .map((c) => ({ c, s: scoreText(q, c.content) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s);
    const fused = rrfMerge([itemRank.map((x) => x.id), chunkRank.map((x) => x.c.item_id)]);
    return fused.slice(0, 24).map(({ id, score }) => {
      const item = candidates.find((c) => c.id === id)!;
      const best = chunkRank.find((x) => x.c.item_id === id)?.c.content;
      return { item, snippet: (best ?? item.description).slice(0, 300), score };
    });
  }

  async retrieve(query: string, itemIds: string[] | null, _embedding: number[] | null, limit: number) {
    void _embedding;
    const pool = itemIds ? await this.chunksFor(itemIds) : this.s.chunks.filter((c) => {
      const i = this.s.items.find((x) => x.id === c.item_id);
      return i && isPubliclyVisible(i);
    });
    const q = tokens(query);
    const ranked = pool.map((c) => ({ c, s: scoreText(q, c.content) })).sort((a, b) => b.s - a.s);
    return (itemIds ? ranked : ranked.filter((x) => x.s > 0)).slice(0, limit).map((x) => x.c);
  }

  async datasetProfile(itemId: string) {
    if (!(await this.getItem(itemId))) return null;
    return this.s.profiles.find((p) => p.item_id === itemId) ?? null;
  }
  async saveDatasetProfile(p: DatasetProfile) {
    this.s.profiles = this.s.profiles.filter((x) => x.item_id !== p.item_id).concat(p);
  }
  async datasetCsv(itemId: string) {
    if (!(await this.getItem(itemId))) return null;
    return this.s.csv.get(itemId) ?? null;
  }
  setCsv(itemId: string, text: string) {
    this.s.csv.set(itemId, text);
  }

  async explainer(itemId: string, level: Explainer["level"], lang: Explainer["language"]) {
    return this.s.explainers.find((e) => e.item_id === itemId && e.level === level && e.language === lang) ?? null;
  }
  async saveExplainer(e: Explainer) {
    this.s.explainers = this.s.explainers.filter((x) => !(x.item_id === e.item_id && x.level === e.level && x.language === e.language)).concat(e);
  }

  async listGenerations(q: { status?: Generation["status"][]; channel?: Generation["channel"] } = {}) {
    this.requireStaff();
    return this.s.generations
      .filter((g) => (!q.status || q.status.includes(g.status)) && (!q.channel || g.channel === q.channel))
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }
  async getGeneration(id: string) {
    const g = this.s.generations.find((x) => x.id === id);
    if (!g) return null;
    if (!isStaffRole(this.viewer) && !(g.status === "published" && g.channel === "website_article")) return null;
    return g;
  }
  async getGenerationBySlug(slug: string) {
    return this.s.generations.find((x) => x.slug === slug && x.status === "published" && x.channel === "website_article") ?? null;
  }
  async publishedArticles(limit = 50) {
    return this.s.generations
      .filter((g) => g.status === "published" && g.channel === "website_article")
      .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""))
      .slice(0, limit);
  }
  async createGeneration(input: Omit<Generation, "id" | "org_id" | "created_at" | "updated_at" | "created_by">) {
    this.requireStaff();
    const gen: Generation = {
      ...input,
      id: uuid(),
      org_id: ORG_ID,
      created_by: this.viewer.id,
      created_by_name: this.viewer.name,
      created_at: now(),
      updated_at: now(),
    };
    this.s.generations.unshift(gen);
    return gen;
  }
  async updateGeneration(id: string, patch: Partial<Generation>) {
    this.requireStaff();
    const gen = this.s.generations.find((x) => x.id === id);
    if (!gen) throw new Error("Not found");
    Object.assign(gen, patch, { updated_at: now() });
    return gen;
  }
  async claims(generationId: string) {
    return this.s.claims.filter((c) => c.generation_id === generationId);
  }
  async replaceClaims(generationId: string, claims: Omit<GenerationClaim, "id">[]) {
    this.s.claims = this.s.claims.filter((c) => c.generation_id !== generationId);
    const withIds = claims.map((c) => ({ ...c, id: uuid() }));
    this.s.claims.push(...withIds);
    return withIds;
  }
  async comments(generationId: string) {
    return this.s.comments.filter((c) => c.generation_id === generationId);
  }
  async addComment(generationId: string, body: string) {
    this.requireStaff();
    this.s.comments.push({ id: uuid(), generation_id: generationId, author_name: this.viewer.name ?? "Staff", body, at: now() });
  }

  async calendar() {
    return this.s.calendar;
  }
  async updateCalendar(id: string, patch: Partial<CalendarEntry>) {
    this.requireStaff();
    const c = this.s.calendar.find((x) => x.id === id);
    if (c) Object.assign(c, patch);
  }
  async glossary() {
    return glossarySeed;
  }

  async logSearch(query: string, resultCount: number) {
    this.s.searches.push({ query: query.slice(0, 200), result_count: resultCount, at: now() });
  }
  async logView(itemId: string) {
    this.s.views.push({ item_id: itemId, at: now() });
  }
  async searchStats(days = 14): Promise<SearchStats> {
    const since = Date.now() - days * 86400000;
    const recent = this.s.searches.filter((s) => new Date(s.at).getTime() >= since);
    const byQ = new Map<string, { count: number; total: number }>();
    for (const s of recent) {
      const k = s.query.trim().toLowerCase();
      const e = byQ.get(k) ?? { count: 0, total: 0 };
      e.count++;
      e.total += s.result_count;
      byQ.set(k, e);
    }
    const all = [...byQ.entries()].map(([query, e]) => ({ query, count: e.count, avgResults: Math.round((e.total / e.count) * 10) / 10 }));
    const byDay = new Map<string, { searches: number; views: number }>();
    for (let d = days - 1; d >= 0; d--) byDay.set(daysAgo(d).slice(0, 10), { searches: 0, views: 0 });
    for (const s of recent) {
      const e = byDay.get(s.at.slice(0, 10));
      if (e) e.searches++;
    }
    for (const v of this.s.views) {
      const e = byDay.get(v.at.slice(0, 10));
      if (e) e.views++;
    }
    return {
      top: all.sort((a, b) => b.count - a.count).slice(0, 10),
      noResult: all.filter((x) => x.avgResults < 1).map(({ query, count }) => ({ query, count })).sort((a, b) => b.count - a.count),
      total: recent.length,
      byDay: [...byDay.entries()].map(([day, v]) => ({ day, ...v })),
    };
  }
  async viewCounts() {
    const out: Record<string, number> = {};
    for (const v of this.s.views) out[v.item_id] = (out[v.item_id] ?? 0) + 1;
    return out;
  }

  async audit(action: string, entity: string, entityId: string | null, meta: Record<string, unknown> = {}) {
    this.s.audit.unshift({ id: uuid(), actor_id: this.viewer.id, actor_name: this.viewer.name, action, entity, entity_id: entityId, meta, at: now() });
  }
  async auditLog(limit = 100) {
    this.requireStaff();
    return this.s.audit.slice(0, limit);
  }

  async jobs(limit = 50) {
    return this.s.jobs.slice(0, limit);
  }
  async enqueueJob(job: Pick<Job, "type" | "payload" | "item_id">) {
    const j: Job = { ...job, id: uuid(), status: "queued", error: null, attempts: 0, created_at: now(), updated_at: now() };
    this.s.jobs.unshift(j);
    return j;
  }
  async updateJob(id: string, patch: Partial<Job>) {
    const j = this.s.jobs.find((x) => x.id === id);
    if (j) Object.assign(j, patch, { updated_at: now() });
  }

  async team() {
    return this.s.staff.map((s) => {
      const p = demoProfiles.find((x) => x.email === s.email);
      return { email: s.email, role: s.role, name: p?.full_name ?? null, signedIn: Boolean(p) };
    });
  }
  async setStaff(email: string, role: StaffEntry["role"] | null) {
    if (this.viewer.role !== "admin") throw new Error("Admin only");
    const e = email.trim().toLowerCase();
    this.s.staff = this.s.staff.filter((s) => s.email !== e);
    if (role && role !== "member") this.s.staff.push({ email: e, role });
  }
  async profiles() {
    return demoProfiles;
  }

  async favourites() {
    return [...(this.s.favourites.get(this.viewer.id ?? "") ?? [])];
  }
  async toggleFavourite(itemId: string) {
    if (!this.viewer.id) throw new Error("Sign in required");
    const set = this.s.favourites.get(this.viewer.id) ?? new Set<string>();
    const on = !set.has(itemId);
    if (on) set.add(itemId);
    else set.delete(itemId);
    this.s.favourites.set(this.viewer.id, set);
    return on;
  }
  async addQuizAttempt(itemId: string, score: number) {
    if (!this.viewer.id) return;
    this.s.quiz.push({ user_id: this.viewer.id, item_id: itemId, score, at: now() });
  }
}
