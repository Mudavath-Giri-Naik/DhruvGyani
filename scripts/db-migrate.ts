/**
 * Apply supabase/migrations/*.sql in order using SUPABASE_DB_URL.
 * Tracks applied files in public._dhruv_migrations so re-runs are safe.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { loadEnv, requireEnv } from "./_env";

loadEnv();
const url = requireEnv("SUPABASE_DB_URL", "Copy the connection string (Session pooler) from Supabase → Connect.");

const dir = join(process.cwd(), "supabase", "migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query("create table if not exists public._dhruv_migrations (name text primary key, applied_at timestamptz default now())");
  const done = new Set((await client.query("select name from public._dhruv_migrations")).rows.map((r) => r.name as string));
  for (const f of files) {
    if (done.has(f)) {
      console.log(`• ${f} already applied`);
      continue;
    }
    const sql = readFileSync(join(dir, f), "utf8");
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query("insert into public._dhruv_migrations (name) values ($1)", [f]);
      await client.query("commit");
      console.log(`✔ applied ${f}`);
    } catch (e) {
      await client.query("rollback");
      console.error(`✖ ${f} failed: ${(e as Error).message}`);
      process.exitCode = 1;
      break;
    }
  }
} finally {
  await client.end();
}
