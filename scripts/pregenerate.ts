/**
 * Once keys exist: embed every PUBLIC, released item's chunks and generate
 * EN + HI Studio packs (article + Instagram) for the sample reports. Packs
 * land "in review" — a reviewer must still approve them.
 *
 * Run: npm run pregenerate   (needs Supabase URL + secret key + GEMINI_API_KEY)
 */
import { loadEnv } from "./_env";

loadEnv();
const missing = ["NEXT_PUBLIC_SUPABASE_URL", "GEMINI_API_KEY"].filter((k) => !process.env[k]);
if (!process.env.SUPABASE_SECRET_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SECRET_KEY");
if (missing.length) {
  console.error(`✖ Missing ${missing.join(", ")}. See SETUP.md.`);
  process.exit(1);
}

const [{ createAdminClient }, { SupabaseRepo }, { runJob }, { draftOne, verifyDraft }, { isPubliclyVisible }, { ITEM }, { PROMPT_VERSION }] = await Promise.all([
  import("../src/lib/supabase/admin"),
  import("../src/lib/data/supabase"),
  import("../src/lib/ingest/process"),
  import("../src/lib/ai/generate"),
  import("../src/lib/policy"),
  import("../src/lib/seed/data"),
  import("../src/lib/constants"),
]);

const db = createAdminClient();
const { data: org } = await db.from("organizations").select("id").eq("slug", "ncpor").single();
const repo = new SupabaseRepo({ id: null, name: "Pregenerate script", email: null, avatar: null, role: "admin", orgId: org?.id ?? null, demo: false }, db);

// 1. Embeddings for released items only (policy is enforced again inside embedItemChunks).
const items = process.env.SKIP_EMBED === "1" ? [] : (await repo.listItems({ includeNonPublic: true })).filter((i) => isPubliclyVisible(i));
let embedded = 0;
for (const item of items) {
  const job = await repo.enqueueJob({ type: "embed_item", payload: {}, item_id: item.id });
  await runJob(repo, job.id);
  const done = await repo.getJob(job.id);
  if (done?.status === "done") embedded++;
  else console.warn(`  ! ${item.title}: ${done?.error}`);
}
console.log(process.env.SKIP_EMBED === "1" ? "• embeddings skipped (SKIP_EMBED=1)" : `✔ embedded ${embedded}/${items.length} released items`);

// 2. Studio packs, EN + HI. Paced to stay under free-tier per-minute limits.
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
let packs = 0;
for (const itemId of [ITEM.rMosaic, ITEM.rGakkel, ITEM.rRoss]) {
  for (const language of ["en", "hi"] as const) {
    for (const channel of ["website_article", "instagram"] as const) {
      try {
        const d = await draftOne(repo, { itemIds: [itemId], audience: "public", language, channel });
        const gen = await repo.createGeneration({
          item_ids: [itemId],
          audience: "public",
          language,
          channel,
          prompt_version: PROMPT_VERSION,
          model: d.model,
          output: d.output,
          citations: d.citations,
          slug: null,
          status: "in_review",
          reviewed_by: null,
          reviewed_at: null,
          published_at: null,
        });
        const claims = await repo.replaceClaims(gen.id, await verifyDraft(gen.id, d.output, d.citations, d.chunks));
        const flagged = claims.filter((c) => c.verdict === "unsupported" || c.number_misses.length).length;
        console.log(`  • ${language} ${channel} for ${itemId.slice(-3)} (${d.mode})${flagged ? ` — ${flagged} flagged claim(s)` : ""}`);
        packs++;
      } catch (e) {
        console.warn(`  ! ${language} ${channel}: ${(e as Error).message}`);
      }
      await pause(Number(process.env.PREGENERATE_DELAY_MS ?? 8000));
    }
  }
}
console.log(`✔ created ${packs} packs in the Review Queue`);
