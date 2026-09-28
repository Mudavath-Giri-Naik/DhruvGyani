import { getRepo } from "@/lib/auth";
import type { StorageBucket } from "@/lib/data/repo";
import type { DemoRepo } from "@/lib/data/demo";
import type { SupabaseRepo } from "@/lib/data/supabase";

const BUCKETS: StorageBucket[] = ["public-media", "private-uploads", "datasets"];

/**
 * Serves stored files only if the viewer can see the owning item (same rules
 * as RLS). Supabase: short-lived signed URL redirect. Demo: streams the blob.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const bucket = url.searchParams.get("bucket") as StorageBucket;
  const path = url.searchParams.get("path") ?? "";
  if (!BUCKETS.includes(bucket) || !path || path.includes("..")) return new Response("Not found", { status: 404 });
  const repo = await getRepo();
  const itemId = await repo.fileItemId(bucket, path);
  if (!itemId) return new Response("Not found", { status: 404 });

  if (repo.kind === "supabase") {
    const signed = await (repo as SupabaseRepo).signedUrl(bucket, path);
    return signed ? Response.redirect(signed, 302) : new Response("Not found", { status: 404 });
  }
  const demo = repo as DemoRepo;
  const data = await demo.getFile(bucket, path);
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(data, {
    headers: { "Content-Type": demo.blobMime(bucket, path), "Cache-Control": "private, max-age=300", "X-Content-Type-Options": "nosniff" },
  });
}
