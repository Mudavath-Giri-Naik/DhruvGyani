/**
 * Upsert ADMIN_BOOTSTRAP_EMAILS into allowed_staff as admin, and promote any
 * existing profiles with those emails. Uses SUPABASE_DB_URL if set, else the
 * Supabase secret key.
 */
import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "./_env";

loadEnv();
const emails = (process.env.ADMIN_BOOTSTRAP_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);
if (!emails.length) {
  console.error("✖ ADMIN_BOOTSTRAP_EMAILS is empty. Add your Google email to .env.local (see SETUP.md).");
  process.exit(1);
}

if (process.env.SUPABASE_DB_URL) {
  const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const org = (await client.query("select id from public.organizations where slug = 'ncpor'")).rows[0]?.id ?? null;
    for (const email of emails) {
      await client.query(
        "insert into public.allowed_staff (email, role, org_id) values ($1, 'admin', $2) on conflict (email) do update set role = 'admin', org_id = excluded.org_id",
        [email, org],
      );
    }
    console.log(`✔ ${emails.length} admin(s) bootstrapped via database connection`);
  } finally {
    await client.end();
  }
} else {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("✖ Set SUPABASE_DB_URL, or NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY (see SETUP.md).");
    process.exit(1);
  }
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data: org } = await db.from("organizations").select("id").eq("slug", "ncpor").maybeSingle();
  for (const email of emails) {
    const { error } = await db.from("allowed_staff").upsert({ email, role: "admin", org_id: org?.id ?? null }, { onConflict: "email" });
    if (error) {
      console.error(`✖ ${error.message}`);
      process.exit(1);
    }
  }
  console.log(`✔ ${emails.length} admin(s) bootstrapped via Supabase API`);
}
