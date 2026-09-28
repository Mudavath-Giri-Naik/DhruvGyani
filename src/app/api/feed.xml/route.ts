import { feedEntries, toRss } from "@/lib/feed";

export const dynamic = "force-dynamic";

/** RSS 2.0 feed of published (human-approved) stories, for NCPOR's site to embed. */
export async function GET() {
  const xml = toRss(await feedEntries());
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}
