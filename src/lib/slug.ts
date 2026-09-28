/** URL slug for a published story: ASCII words + short id (Hindi headlines fall back to "story-…"). */
export function slugify(headline: string, id: string) {
  const base = headline
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "story"}-${id.slice(0, 6)}`;
}
