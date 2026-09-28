/**
 * Re-run the Trust Panel on every draft / in-review generation (e.g. after
 * the verifier changes). Paced for free-tier rate limits.
 * Run: npm run reverify
 */
import { loadEnv } from "./_env";

loadEnv();
const [{ createAdminClient }, { SupabaseRepo }, { verifyDraft }] = await Promise.all([
  import("../src/lib/supabase/admin"),
  import("../src/lib/data/supabase"),
  import("../src/lib/ai/generate"),
]);

const db = createAdminClient();
const { data: org } = await db.from("organizations").select("id").eq("slug", "ncpor").single();
const repo = new SupabaseRepo({ id: null, name: "Re-verify script", email: null, avatar: null, role: "admin", orgId: org?.id ?? null, demo: false }, db);
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

const gens = (await repo.listGenerations({ status: ["draft", "in_review"] })).filter((g) => g.model !== "pre-generated demo");
for (const g of gens) {
  const chunks = await repo.chunksFor([...new Set(g.citations.map((c) => c.item_id))]);
  const claims = await repo.replaceClaims(g.id, await verifyDraft(g.id, g.output, g.citations, chunks));
  const flagged = claims.filter((c) => c.verdict === "unsupported" || c.number_misses.length);
  console.log(`• ${g.language} ${g.channel} ${g.id.slice(0, 8)}: ${claims.length} claims, ${flagged.length} flagged`);
  for (const f of flagged) console.log(`    ✗ ${f.claim_text.slice(0, 110)}${f.number_misses.length ? `  [numbers: ${f.number_misses.join(", ")}]` : ""}`);
  await pause(Number(process.env.PREGENERATE_DELAY_MS ?? 5000));
}
console.log(`✔ re-verified ${gens.length} generation(s)`);
