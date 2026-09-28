import { feedEntries } from "@/lib/feed";
import { publicEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

/** JSON Feed 1.1 of published stories. */
export async function GET() {
  const entries = await feedEntries();
  return Response.json(
    {
      version: "https://jsonfeed.org/version/1.1",
      title: "DhruvGyani — NCPOR polar science stories",
      home_page_url: `${publicEnv.siteUrl}/stories`,
      feed_url: `${publicEnv.siteUrl}/api/feed.json`,
      language: "en-IN",
      items: entries.map((e) => ({ id: e.id, url: e.url, title: e.title, summary: e.summary, content_text: e.content, date_published: e.date, language: e.language })),
    },
    { headers: { "Content-Type": "application/feed+json; charset=utf-8", "Cache-Control": "public, max-age=300" } },
  );
}
