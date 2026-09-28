/** Load supabase/seed.sql into the database at SUPABASE_DB_URL. Safe to re-run. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { loadEnv, requireEnv } from "./_env";

loadEnv();
const url = requireEnv("SUPABASE_DB_URL", "Copy the connection string (Session pooler) from Supabase → Connect.");
const sql = readFileSync(join(process.cwd(), "supabase", "seed.sql"), "utf8");
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  // Claims have no natural key; clear demo claims first so re-runs don't duplicate them.
  await client.query(
    "delete from public.generation_claims where generation_id in (select id from public.generations where model = 'pre-generated demo')",
  );
  await client.query(sql);
  console.log("✔ seed data loaded");
} catch (e) {
  console.error(`✖ seeding failed: ${(e as Error).message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
