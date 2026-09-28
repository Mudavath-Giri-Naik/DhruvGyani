import "server-only";

import { getRepo } from "@/lib/auth";
import { publicEnv } from "@/lib/env";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const strip = (s: string) => s.replace(/\s*\[\s*c\d+(?:\s*,\s*c\d+)*\s*\]/g, "");

/** Published stories only (human-approved). Used by RSS and JSON Feed. */
export async function feedEntries() {
  const repo = await getRepo();
  const stories = await repo.publishedArticles(50);
  return stories.flatMap((s) =>
    s.output.channel === "website_article"
      ? [
          {
            id: s.id,
            url: `${publicEnv.siteUrl}/stories/${s.slug}`,
            title: s.output.headline,
            summary: s.output.standfirst,
            content: s.output.body.map((p) => strip(p.text)).join("\n\n"),
            date: s.published_at ?? s.updated_at,
            language: s.language,
          },
        ]
      : [],
  );
}

export function toRss(entries: Awaited<ReturnType<typeof feedEntries>>) {
  const items = entries
    .map(
      (e) => `    <item>
      <title>${esc(e.title)}</title>
      <link>${esc(e.url)}</link>
      <guid isPermaLink="false">${e.id}</guid>
      <pubDate>${new Date(e.date).toUTCString()}</pubDate>
      <description>${esc(e.summary)}</description>
      <dc:language>${e.language}</dc:language>
    </item>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>DhruvGyani — NCPOR polar science stories</title>
    <link>${esc(publicEnv.siteUrl)}/stories</link>
    <atom:link href="${esc(publicEnv.siteUrl)}/api/feed.xml" rel="self" type="application/rss+xml" />
    <description>Source-cited, human-reviewed stories from India's polar science archive (prototype; sample content is labelled).</description>
    <language>en-IN</language>
${items}
  </channel>
</rss>
`;
}
