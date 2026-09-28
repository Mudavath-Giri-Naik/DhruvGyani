import type { Expedition, Item } from "@/lib/types";

const year = (i: Item) => (i.event_date ? i.event_date.slice(0, 4) : "n.d.");

export function plainCitation(i: Item, exp: Expedition | null, siteUrl: string): string {
  const authors = i.authors.length ? i.authors.join(", ") : "NCPOR";
  const url = i.external_url ?? `${siteUrl}/items/${i.id}`;
  const parts = [`${authors} (${year(i)}). ${i.title}.`, exp ? `${exp.code}.` : null, "National Centre for Polar and Ocean Research (via DhruvGyani).", url];
  if (i.is_sample) parts.push("[Sample content — not real data]");
  return parts.filter(Boolean).join(" ");
}

export function bibtexCitation(i: Item, exp: Expedition | null, siteUrl: string): string {
  const firstAuthor = (i.authors[0] ?? "ncpor").split(/\s+/).pop()!.toLowerCase().replace(/[^a-z]/g, "") || "ncpor";
  const key = `${firstAuthor}${year(i).replace(/\D/g, "") || "nd"}${i.id.slice(-4)}`;
  const esc = (s: string) => s.replace(/[{}\\]/g, "");
  const url = i.external_url ?? `${siteUrl}/items/${i.id}`;
  const fields = [
    `  title        = {${esc(i.title)}}`,
    `  author       = {${esc(i.authors.join(" and ") || "NCPOR")}}`,
    `  year         = {${year(i)}}`,
    `  publisher    = {National Centre for Polar and Ocean Research}`,
    `  howpublished = {\\url{${url}}}`,
    exp ? `  note         = {${exp.code}${i.is_sample ? "; sample content, not real data" : ""}}` : i.is_sample ? `  note         = {sample content, not real data}` : null,
  ].filter(Boolean);
  const kind = i.type === "publication" ? "article" : i.type === "report" ? "techreport" : "misc";
  return `@${kind}{${key},\n${fields.join(",\n")}\n}`;
}
