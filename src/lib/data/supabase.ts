import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { buildCalendar } from "@/lib/calendar";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import type {
  OrgSettings,
  AuditEntry,
  CalendarEntry,
  Chunk,
  DatasetProfile,
  Expedition,
  Explainer,
  Generation,
  GenerationClaim,
  GlossaryTerm,
  Item,
  ItemFile,
  ItemType,
  Job,
  Organization,
  Profile,
  ReviewComment,
  SearchFilters,
  Station,
  Viewer,
} from "@/lib/types";
import type { ItemQuery, NewChunk, NewItem, Repo, SearchStats, StaffEntry, StorageBucket } from "./repo";

/** Drop UI-only fields that are not table columns. */
function stripDerived<T extends Partial<Generation>>(g: T) {
  const row: Record<string, unknown> = { ...g };
  delete row.created_by_name;
  delete row.reviewed_by_name;
  delete row.is_demo;
  return row;
}

/**
 * Supabase-backed repository. Uses the per-request server client, so every
 * query runs as the signed-in user and Postgres RLS is the real guard.
 */
export class SupabaseRepo implements Repo {
  readonly kind = "supabase" as const;
  constructor(
    public viewer: Viewer,
    private db: SupabaseClient,
  ) {}

  private must<T>(res: { data: T | null; error: { message: string } | null }): T {
    if (res.error) throw new Error(res.error.message);
    return res.data as T;
  }

  async org(): Promise<Organization> {
    return this.must(await this.db.from("organizations").select("*").eq("slug", "ncpor").single());
  }
  async settings(): Promise<OrgSettings> {
    const org = await this.org();
    return { ...DEFAULT_SETTINGS, ...((org as Organization & { settings?: Partial<OrgSettings> }).settings ?? {}) };
  }
  async saveSettings(s: OrgSettings) {
    this.must(await this.db.from("organizations").update({ settings: s }).eq("slug", "ncpor"));
  }
  async stations(): Promise<Station[]> {
    return this.must(await this.db.from("stations").select("*").order("name"));
  }
  async expeditions(): Promise<Expedition[]> {
    return this.must(await this.db.from("expeditions").select("*").order("start_date", { ascending: false }));
  }
  async expeditionByCode(code: string) {
    return this.must(await this.db.from("expeditions").select("*").ilike("code", code).maybeSingle()) as Expedition | null;
  }

  private publicFilter<Q extends { eq: (c: string, v: unknown) => Q; or: (f: string) => Q }>(q: Q): Q {
    return q.eq("status", "published").eq("visibility", "public").or(`embargo_until.is.null,embargo_until.lte.${new Date().toISOString()}`);
  }

  async listItems(q: ItemQuery = {}): Promise<Item[]> {
    let query = this.db.from("items").select("*");
    if (!q.includeNonPublic) query = this.publicFilter(query);
    if (q.type) query = query.eq("type", q.type);
    if (q.expeditionId) query = query.eq("expedition_id", q.expeditionId);
    if (q.stationId) query = query.eq("station_id", q.stationId);
    const sort = q.sort ?? "newest";
    query = sort === "title" ? query.order("title") : query.order("event_date", { ascending: sort === "oldest", nullsFirst: false });
    if (q.limit) query = query.limit(q.limit);
    return this.must(await query);
  }
  async getItem(id: string) {
    return this.must(await this.db.from("items").select("*").eq("id", id).maybeSingle()) as Item | null;
  }
  async getItems(ids: string[]) {
    if (!ids.length) return [];
    return this.must(await this.db.from("items").select("*").in("id", ids)) as Item[];
  }
  async createItem(input: NewItem) {
    const row = { ...input, org_id: this.viewer.orgId, created_by: this.viewer.id };
    return this.must(await this.db.from("items").insert(row).select("*").single()) as Item;
  }
  async updateItem(id: string, patch: Partial<NewItem>) {
    return this.must(await this.db.from("items").update(patch).eq("id", id).select("*").single()) as Item;
  }
  async counts() {
    const pub = await this.listItems();
    const c = { report: 0, dataset: 0, publication: 0, photo: 0, video: 0, activity: 0 } as Record<ItemType, number>;
    for (const i of pub) c[i.type]++;
    const { count } = await this.db.from("expeditions").select("id", { count: "exact", head: true });
    return { ...c, expeditions: count ?? 0 };
  }

  async chunksFor(itemIds: string[]) {
    if (!itemIds.length) return [];
    return this.must(
      await this.db.from("chunks").select("id,item_id,page_no,chunk_index,content").in("item_id", itemIds).order("chunk_index"),
    ) as Chunk[];
  }
  async replaceChunks(itemId: string, chunks: NewChunk[]) {
    this.must(await this.db.from("chunks").delete().eq("item_id", itemId));
    if (!chunks.length) return;
    const rows = chunks.map((c) => ({
      item_id: itemId,
      page_no: c.page_no,
      chunk_index: c.chunk_index,
      content: c.content,
      embedding: c.embedding ? JSON.stringify(c.embedding) : null,
    }));
    this.must(await this.db.from("chunks").insert(rows));
  }
  async itemFiles(itemId: string) {
    return this.must(await this.db.from("item_files").select("*").eq("item_id", itemId)) as ItemFile[];
  }
  async addItemFile(file: Omit<ItemFile, "id">) {
    this.must(await this.db.from("item_files").insert(file));
  }
  async putFile(bucket: StorageBucket, path: string, data: ArrayBuffer, mime: string) {
    const { error } = await this.db.storage.from(bucket).upload(path, data, { contentType: mime, upsert: false });
    if (error) throw new Error(error.message);
    if (bucket === "public-media") return this.db.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    return `/api/files?bucket=${bucket}&path=${encodeURIComponent(path)}`;
  }
  async getFile(bucket: StorageBucket, path: string) {
    const { data } = await this.db.storage.from(bucket).download(path);
    return data ? await data.arrayBuffer() : null;
  }
  async fileItemId(bucket: StorageBucket, path: string) {
    const row = this.must(
      await this.db.from("item_files").select("item_id").eq("storage_bucket", bucket).eq("storage_path", path).maybeSingle(),
    ) as { item_id: string } | null;
    return row && (await this.getItem(row.item_id)) ? row.item_id : null;
  }
  async signedUrl(bucket: StorageBucket, path: string) {
    const { data } = await this.db.storage.from(bucket).createSignedUrl(path, 120);
    return data?.signedUrl ?? null;
  }
  async photoHashes() {
    const rows = (this.must(await this.db.from("item_files").select("item_id,phash").not("phash", "is", null)) ?? []) as { item_id: string; phash: string }[];
    return rows;
  }
  async getJob(id: string) {
    return this.must(await this.db.from("jobs").select("*").eq("id", id).maybeSingle()) as Job | null;
  }

  async search(query: string, filters: SearchFilters, embedding?: number[] | null) {
    const rows = this.must(
      await this.db.rpc("search_items", {
        query_text: query,
        query_embedding: embedding ? JSON.stringify(embedding) : null,
        filter_types: filters.types?.length ? filters.types : null,
        filter_expedition: filters.expeditionId ?? null,
        filter_station: filters.stationId ?? null,
        filter_year: filters.year ?? null,
        filter_discipline: filters.discipline ?? null,
        filter_language: filters.language ?? null,
        match_count: 24,
      }),
    ) as { item_id: string; snippet: string; score: number }[];
    const items = await this.getItems(rows.map((r) => r.item_id));
    return rows.flatMap((r) => {
      const item = items.find((i) => i.id === r.item_id);
      return item ? [{ item, snippet: r.snippet, score: r.score }] : [];
    });
  }

  async retrieve(query: string, itemIds: string[] | null, embedding: number[] | null, limit: number) {
    if (embedding) {
      const rows = this.must(
        await this.db.rpc("match_chunks", { query_embedding: JSON.stringify(embedding), item_ids: itemIds, match_count: limit }),
      ) as (Chunk & { similarity: number })[];
      if (rows.length) return rows;
    }
    let q = this.db.from("chunks").select("id,item_id,page_no,chunk_index,content");
    if (itemIds) q = q.in("item_id", itemIds);
    if (query.trim()) q = q.textSearch("fts", query, { type: "websearch", config: "simple" });
    const rows = this.must(await q.limit(limit)) as Chunk[];
    if (!rows.length && itemIds) return (await this.chunksFor(itemIds)).slice(0, limit);
    return rows;
  }

  async datasetProfile(itemId: string) {
    return this.must(await this.db.from("dataset_profiles").select("*").eq("item_id", itemId).maybeSingle()) as DatasetProfile | null;
  }
  async saveDatasetProfile(p: DatasetProfile) {
    this.must(await this.db.from("dataset_profiles").upsert(p, { onConflict: "item_id" }));
  }
  async datasetCsv(itemId: string) {
    const files = await this.itemFiles(itemId);
    const f = files.find((x) => x.mime.includes("csv") || x.storage_path.endsWith(".csv"));
    if (f) {
      const { data } = await this.db.storage.from(f.storage_bucket).download(f.storage_path);
      if (data) return await data.text();
    }
    // seeded datasets ship with the app (public/data) rather than in storage
    const { datasetCsv } = await import("@/lib/seed/data");
    return datasetCsv[itemId]?.csv() ?? null;
  }

  async explainer(itemId: string, level: Explainer["level"], lang: Explainer["language"]) {
    return this.must(
      await this.db.from("explainers").select("*").eq("item_id", itemId).eq("level", level).eq("language", lang).maybeSingle(),
    ) as Explainer | null;
  }
  async saveExplainer(e: Explainer) {
    this.must(await this.db.from("explainers").upsert(e, { onConflict: "item_id,level,language" }));
  }

  private async withNames(gens: Generation[]): Promise<Generation[]> {
    const ids = [...new Set(gens.flatMap((g) => [g.created_by, g.reviewed_by]).filter(Boolean))] as string[];
    if (!ids.length) return gens;
    const { data } = await this.db.from("profiles").select("id,full_name").in("id", ids);
    const name = (id: string | null) => data?.find((p) => p.id === id)?.full_name ?? null;
    return gens.map((g) => ({ ...g, created_by_name: name(g.created_by), reviewed_by_name: name(g.reviewed_by) }));
  }
  async listGenerations(q: { status?: Generation["status"][]; channel?: Generation["channel"] } = {}) {
    let query = this.db.from("generations").select("*").order("updated_at", { ascending: false });
    if (q.status) query = query.in("status", q.status);
    if (q.channel) query = query.eq("channel", q.channel);
    return this.withNames(this.must(await query));
  }
  async getGeneration(id: string) {
    const g = this.must(await this.db.from("generations").select("*").eq("id", id).maybeSingle()) as Generation | null;
    return g ? (await this.withNames([g]))[0] : null;
  }
  async getGenerationBySlug(slug: string) {
    const g = this.must(
      await this.db.from("generations").select("*").eq("slug", slug).eq("status", "published").maybeSingle(),
    ) as Generation | null;
    return g ? (await this.withNames([g]))[0] : null;
  }
  async publishedArticles(limit = 50) {
    return this.withNames(
      this.must(
        await this.db
          .from("generations")
          .select("*")
          .eq("status", "published")
          .eq("channel", "website_article")
          .order("published_at", { ascending: false })
          .limit(limit),
      ),
    );
  }
  async createGeneration(g: Omit<Generation, "id" | "org_id" | "created_at" | "updated_at" | "created_by">) {
    const row = stripDerived(g);
    return this.must(
      await this.db.from("generations").insert({ ...row, org_id: this.viewer.orgId, created_by: this.viewer.id }).select("*").single(),
    ) as Generation;
  }
  async updateGeneration(id: string, patch: Partial<Generation>) {
    const row = stripDerived(patch);
    return this.must(await this.db.from("generations").update(row).eq("id", id).select("*").single()) as Generation;
  }
  async claims(generationId: string) {
    return this.must(await this.db.from("generation_claims").select("*").eq("generation_id", generationId).order("created_at")) as GenerationClaim[];
  }
  async replaceClaims(generationId: string, claims: Omit<GenerationClaim, "id">[]) {
    this.must(await this.db.from("generation_claims").delete().eq("generation_id", generationId));
    if (!claims.length) return [];
    const rows = claims.map((c) => ({ ...c, chunk_id: c.chunk_id && /^[0-9a-f-]{36}$/.test(c.chunk_id) ? c.chunk_id : null }));
    return this.must(await this.db.from("generation_claims").insert(rows).select("*")) as GenerationClaim[];
  }
  async comments(generationId: string) {
    return this.must(await this.db.from("review_comments").select("*").eq("generation_id", generationId).order("at")) as ReviewComment[];
  }
  async addComment(generationId: string, body: string) {
    this.must(
      await this.db.from("review_comments").insert({ generation_id: generationId, body, author_id: this.viewer.id, author_name: this.viewer.name ?? "" }),
    );
  }

  async calendar(): Promise<CalendarEntry[]> {
    const rows = this.must(await this.db.from("content_calendar").select("*").order("date")) as CalendarEntry[];
    if (rows.length) return rows;
    return buildCalendar(await this.listItems());
  }
  async updateCalendar(id: string, patch: Partial<CalendarEntry>) {
    this.must(await this.db.from("content_calendar").update(patch).eq("id", id));
  }
  async glossary(): Promise<GlossaryTerm[]> {
    return this.must(await this.db.from("glossary").select("*").order("term"));
  }

  async logSearch(query: string, resultCount: number) {
    await this.db.from("search_events").insert({ query: query.slice(0, 200), result_count: resultCount });
  }
  async logView(itemId: string) {
    await this.db.from("item_views").insert({ item_id: itemId });
  }
  async searchStats(days = 14): Promise<SearchStats> {
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const searches = (this.must(await this.db.from("search_events").select("query,result_count,at").gte("at", since).limit(5000)) ??
      []) as { query: string; result_count: number; at: string }[];
    const views = (this.must(await this.db.from("item_views").select("at").gte("at", since).limit(20000)) ?? []) as { at: string }[];
    const byQ = new Map<string, { count: number; total: number }>();
    for (const s of searches) {
      const k = s.query.trim().toLowerCase();
      const e = byQ.get(k) ?? { count: 0, total: 0 };
      e.count++;
      e.total += s.result_count;
      byQ.set(k, e);
    }
    const all = [...byQ.entries()].map(([query, e]) => ({ query, count: e.count, avgResults: Math.round((e.total / e.count) * 10) / 10 }));
    const byDay = new Map<string, { searches: number; views: number }>();
    for (let d = days - 1; d >= 0; d--) byDay.set(new Date(Date.now() - d * 86400000).toISOString().slice(0, 10), { searches: 0, views: 0 });
    for (const s of searches) {
      const e = byDay.get(s.at.slice(0, 10));
      if (e) e.searches++;
    }
    for (const v of views) {
      const e = byDay.get(v.at.slice(0, 10));
      if (e) e.views++;
    }
    return {
      top: all.sort((a, b) => b.count - a.count).slice(0, 10),
      noResult: all.filter((x) => x.avgResults < 1).map(({ query, count }) => ({ query, count })),
      total: searches.length,
      byDay: [...byDay.entries()].map(([day, v]) => ({ day, ...v })),
    };
  }
  async viewCounts() {
    const rows = (this.must(await this.db.from("item_views").select("item_id").limit(20000)) ?? []) as { item_id: string }[];
    const out: Record<string, number> = {};
    for (const r of rows) out[r.item_id] = (out[r.item_id] ?? 0) + 1;
    return out;
  }

  async audit(action: string, entity: string, entityId: string | null, meta: Record<string, unknown> = {}) {
    await this.db.from("audit_log").insert({
      actor_id: this.viewer.id,
      actor_name: this.viewer.name,
      action,
      entity,
      entity_id: entityId && /^[0-9a-f-]{36}$/.test(entityId) ? entityId : null,
      meta,
    });
  }
  async auditLog(limit = 100): Promise<AuditEntry[]> {
    return this.must(await this.db.from("audit_log").select("*").order("at", { ascending: false }).limit(limit));
  }

  async jobs(limit = 50): Promise<Job[]> {
    return this.must(await this.db.from("jobs").select("*").order("created_at", { ascending: false }).limit(limit));
  }
  async enqueueJob(job: Pick<Job, "type" | "payload" | "item_id">) {
    return this.must(await this.db.from("jobs").insert(job).select("*").single()) as Job;
  }
  async updateJob(id: string, patch: Partial<Job>) {
    this.must(await this.db.from("jobs").update(patch).eq("id", id));
  }

  async team(): Promise<StaffEntry[]> {
    const staff = (this.must(await this.db.from("allowed_staff").select("email,role")) ?? []) as { email: string; role: StaffEntry["role"] }[];
    const profiles = await this.profiles();
    return staff.map((s) => {
      const p = profiles.find((x) => x.email?.toLowerCase() === s.email.toLowerCase());
      return { email: s.email, role: s.role, name: p?.full_name ?? null, signedIn: Boolean(p) };
    });
  }
  async setStaff(email: string, role: StaffEntry["role"] | null) {
    const e = email.trim().toLowerCase();
    if (!role || role === "member") {
      this.must(await this.db.from("allowed_staff").delete().eq("email", e));
      this.must(await this.db.from("profiles").update({ role: "member" }).ilike("email", e));
    } else {
      this.must(await this.db.from("allowed_staff").upsert({ email: e, role, org_id: this.viewer.orgId }, { onConflict: "email" }));
    }
  }
  async profiles(): Promise<Profile[]> {
    return this.must(await this.db.from("profiles").select("*").order("created_at"));
  }

  async favourites() {
    if (!this.viewer.id) return [];
    const rows = this.must(await this.db.from("favourites").select("item_id").eq("user_id", this.viewer.id)) as { item_id: string }[];
    return rows.map((r) => r.item_id);
  }
  async toggleFavourite(itemId: string) {
    if (!this.viewer.id) throw new Error("Sign in required");
    const existing = await this.favourites();
    if (existing.includes(itemId)) {
      this.must(await this.db.from("favourites").delete().eq("user_id", this.viewer.id).eq("item_id", itemId));
      return false;
    }
    this.must(await this.db.from("favourites").insert({ user_id: this.viewer.id, item_id: itemId }));
    return true;
  }
  async addQuizAttempt(itemId: string, score: number) {
    if (!this.viewer.id) return;
    await this.db.from("quiz_attempts").insert({ user_id: this.viewer.id, item_id: itemId, score });
  }
}
