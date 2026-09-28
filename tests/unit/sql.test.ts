/**
 * Runs the real migrations + seed against an in-process Postgres (PGlite +
 * pgvector) with minimal Supabase `auth`/`storage` stubs, then checks the
 * guarantees that matter: RLS visibility, embargo, role rules, hybrid search
 * and the approval gate.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite-pgvector";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ITEM } from "@/lib/seed/data";

const SUPABASE_STUBS = `
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
grant usage on schema auth, storage, extensions to anon, authenticated;
grant execute on all functions in schema auth to anon, authenticated;
`;

let db: PGlite;
const root = join(process.cwd(), "supabase");

async function as(role: "anon" | "authenticated", sub: string | null, fn: () => Promise<void>) {
  await db.exec(`set request.jwt.claim.sub = '${sub ?? ""}'; set role ${role};`);
  try {
    await fn();
  } finally {
    await db.exec("reset role; set request.jwt.claim.sub = '';");
  }
}

async function makeUser(email: string, staffRole?: string) {
  if (staffRole) await db.query("insert into public.allowed_staff (email, role) values ($1, $2::app_role)", [email, staffRole]);
  const r = await db.query<{ id: string }>("insert into auth.users (email) values ($1) returning id", [email]);
  return r.rows[0].id;
}

beforeAll(async () => {
  db = await PGlite.create({ extensions: { vector } });
  await db.exec("create schema if not exists extensions;");
  await db.exec(SUPABASE_STUBS);
  for (const f of readdirSync(join(root, "migrations")).sort()) {
    await db.exec(readFileSync(join(root, "migrations", f), "utf8"));
  }
  await db.exec(readFileSync(join(root, "seed.sql"), "utf8"));
  // Keep the embargo in the future no matter when the test runs.
  await db.query("update public.items set embargo_until = now() + interval '30 days' where id = $1", [ITEM.rEmbargo]);
}, 120000);

afterAll(async () => {
  await db?.close();
});

describe("database: RLS and guards", () => {
  it("anon sees only published, public, non-embargoed items", async () => {
    await as("anon", null, async () => {
      const ids = (await db.query<{ id: string }>("select id from public.items")).rows.map((r) => r.id);
      expect(ids.length).toBeGreaterThan(20);
      expect(ids).not.toContain(ITEM.rInternal);
      expect(ids).not.toContain(ITEM.rEmbargo);
      const chunks = await db.query("select 1 from public.chunks where item_id = any($1::uuid[])", [[ITEM.rInternal, ITEM.rEmbargo]]);
      expect(chunks.rows).toHaveLength(0);
    });
  });

  it("anon cannot read the audit log, jobs or draft generations", async () => {
    await as("anon", null, async () => {
      expect((await db.query("select 1 from public.audit_log")).rows).toHaveLength(0);
      expect((await db.query("select 1 from public.jobs")).rows).toHaveLength(0);
      const gens = await db.query<{ status: string; channel: string }>("select status, channel from public.generations");
      expect(gens.rows.every((g) => g.status === "published" && g.channel === "website_article")).toBe(true);
    });
  });

  it("hybrid search works keyword-only and respects RLS", async () => {
    await as("anon", null, async () => {
      const r = await db.query<{ item_id: string; snippet: string }>("select * from public.search_items('weather stations')");
      expect(r.rows.length).toBeGreaterThan(0);
      expect(r.rows.map((x) => x.item_id)).toContain(ITEM.r45);
      const hidden = await db.query<{ item_id: string }>("select * from public.search_items('logistics debrief')");
      expect(hidden.rows.map((x) => x.item_id)).not.toContain(ITEM.rInternal);
      const hi = await db.query<{ item_id: string }>("select * from public.search_items('फ्योर्ड')");
      expect(hi.rows.map((x) => x.item_id)).toContain(ITEM.pFjordHi);
    });
  });

  it("new sign-ins default to member; allow-listed emails get their staff role", async () => {
    const memberId = await makeUser("someone@example.com");
    const curatorId = await makeUser("Curator@Example.com", "curator");
    const roles = await db.query<{ id: string; role: string }>("select id, role from public.profiles where id = any($1::uuid[])", [[memberId, curatorId]]);
    expect(roles.rows.find((r) => r.id === memberId)?.role).toBe("member");
    expect(roles.rows.find((r) => r.id === curatorId)?.role).toBe("curator");
  });

  it("members cannot promote themselves", async () => {
    const id = await makeUser("climber@example.com");
    await as("authenticated", id, async () => {
      await expect(db.query("update public.profiles set role = 'admin' where id = $1", [id])).rejects.toThrow(/Only admins/);
    });
  });

  it("curators see internal items but cannot publish", async () => {
    const id = await makeUser("cur2@example.com", "curator");
    const org = (await db.query<{ id: string }>("select id from public.organizations where slug = 'ncpor'")).rows[0].id;
    await as("authenticated", id, async () => {
      const r = await db.query("select 1 from public.items where id = $1", [ITEM.rInternal]);
      expect(r.rows).toHaveLength(1);
      await expect(
        db.query("insert into public.items (org_id, type, title, status) values ($1, 'report', 'x', 'published')", [org]),
      ).rejects.toThrow(/row-level security/);
      const ok = await db.query("insert into public.items (org_id, type, title, status) values ($1, 'report', 'draft ok', 'draft') returning id", [org]);
      expect(ok.rows).toHaveLength(1);
    });
  });

  it("a reviewer cannot approve their own generation", async () => {
    const id = await makeUser("rev@example.com", "reviewer");
    const org = (await db.query<{ id: string }>("select id from public.organizations where slug = 'ncpor'")).rows[0].id;
    await as("authenticated", id, async () => {
      const g = await db.query<{ id: string }>(
        `insert into public.generations (org_id, item_ids, audience, language, channel, prompt_version, output, created_by, status)
         values ($1, array[$2]::uuid[], 'public', 'en', 'x', 'test', '{}'::jsonb, $3, 'in_review') returning id`,
        [org, ITEM.r45, id],
      );
      await expect(db.query("update public.generations set status = 'approved' where id = $1", [g.rows[0].id])).rejects.toThrow(/row-level security/);
    });
  });

  it("unsupported claims or unmatched numbers block approval (database guard)", async () => {
    // Pack 205 contains the deliberate wrong number ("8" stations).
    await expect(
      db.query("update public.generations set status = 'approved' where id = '00000000-0000-4000-a000-000000000205'"),
    ).rejects.toThrow(/unsupported claims or unmatched numbers/);
  });

  it("vector column and HNSW index exist with the shared dimension", async () => {
    const r = await db.query<{ t: string }>(
      "select format_type(atttypid, atttypmod) as t from pg_attribute where attrelid = 'public.chunks'::regclass and attname = 'embedding'",
    );
    expect(r.rows[0].t).toMatch(/(^|\.)vector\(768\)$/);
  });
});
