import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { EMBEDDING_DIM } from "@/lib/constants";
import { buildDataCard, profileCsv } from "@/lib/datasets/profile";
import { chunkPages } from "@/lib/ingest/chunker";
import { extractJson, InvalidModelOutputError, parseWithRetry } from "@/lib/ai/json";
import { assertAiAllowed, isAiAllowed, isPubliclyVisible } from "@/lib/policy";
import { rrfMerge } from "@/lib/search/rrf";
import { approvalBlockers, heuristicVerdict, splitClaims } from "@/lib/trust/claims";

describe("shared constants", () => {
  it("migration vector dimension matches EMBEDDING_DIM", () => {
    const sql = readFileSync(join(process.cwd(), "supabase/migrations/0001_schema.sql"), "utf8");
    const dims = [...sql.matchAll(/vector\((\d+)\)/g)].map((m) => Number(m[1]));
    expect(dims.length).toBeGreaterThan(0);
    expect(new Set(dims)).toEqual(new Set([EMBEDDING_DIM]));
  });
});

describe("chunker", () => {
  const sentence = (i: number) => `Sentence number ${i} talks about ice and snow in some detail here.`;

  it("keeps page numbers and never crosses pages", () => {
    const chunks = chunkPages([
      { page_no: 1, text: "Short page one." },
      { page_no: 2, text: "Short page two." },
    ]);
    expect(chunks.map((c) => [c.page_no, c.content])).toEqual([
      [1, "Short page one."],
      [2, "Short page two."],
    ]);
    expect(chunks.map((c) => c.chunk_index)).toEqual([0, 1]);
  });

  it("splits long pages into ~maxWords chunks with overlap", () => {
    const text = Array.from({ length: 60 }, (_, i) => sentence(i)).join(" ");
    const chunks = chunkPages([{ page_no: 3, text }], 100, 25);
    expect(chunks.length).toBeGreaterThan(5);
    for (const c of chunks) expect(c.content.split(/\s+/).length).toBeLessThanOrEqual(100);
    // overlap: the last sentence of a chunk re-appears at the start of the next
    const firstOfSecond = chunks[1].content.split(/(?<=\.)\s/)[0];
    expect(chunks[0].content.endsWith(firstOfSecond) || chunks[0].content.includes(firstOfSecond + " ")).toBe(true);
    // nothing lost
    for (let i = 0; i < 60; i++) expect(chunks.some((c) => c.content.includes(sentence(i)))).toBe(true);
  });

  it("splits a single giant sentence by words", () => {
    const giant = Array.from({ length: 500 }, (_, i) => `w${i}`).join(" ");
    const chunks = chunkPages([{ page_no: 1, text: giant }], 200, 40);
    expect(chunks.length).toBe(3);
    expect(chunks.at(-1)!.content.endsWith("w499")).toBe(true);
  });

  it("handles Hindi danda sentence boundaries", () => {
    const text = Array.from({ length: 30 }, (_, i) => `यह वाक्य संख्या ${i} है और इसमें बर्फ की बात है।`).join(" ");
    const chunks = chunkPages([{ page_no: 1, text }], 50, 10);
    expect(chunks.length).toBeGreaterThan(3);
    expect(chunks.every((c) => c.content.endsWith("।"))).toBe(true);
  });
});

describe("CSV profiler", () => {
  const csv = "date,temp_c,site,wind_ms\n2026-01-01,-3.5,A,4\n2026-01-02,1.5,B,\n2026-01-03,,A,6\n2026-01-04,4,C,8\n";
  const p = profileCsv(csv);

  it("detects column kinds and counts", () => {
    expect(p.row_count).toBe(4);
    expect(p.columns.map((c) => c.kind)).toEqual(["date", "number", "text", "number"]);
  });

  it("computes stats from code", () => {
    const t = p.columns.find((c) => c.name === "temp_c")!;
    expect(t).toMatchObject({ min: -3.5, max: 4, mean: 0.67, missing: 1, missingPct: 25, unit: "°C" });
    expect(p.time_range).toEqual({ column: "date", start: "2026-01-01", end: "2026-01-04" });
    expect(p.units).toMatchObject({ temp_c: "°C", wind_ms: "m/s" });
  });

  it("builds a data card only from computed numbers", () => {
    const card = buildDataCard(p).join(" ");
    expect(card).toContain("4 rows");
    expect(card).toContain("min -3.5, max 4, mean 0.67 °C");
    expect(card).toContain("temp_c (25%)");
  });
});

describe("model JSON parsing with retries", () => {
  const Schema = z.object({ verdict: z.enum(["supported", "weak", "unsupported"]) });

  it("extracts JSON from fences and chatter", () => {
    expect(extractJson('Sure!\n```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(extractJson('Here you go: {"a": [1,2]} thanks')).toEqual({ a: [1, 2] });
  });

  it("retries with feedback until valid", async () => {
    const ask = vi
      .fn<(n: number, fb: string | null) => Promise<string>>()
      .mockResolvedValueOnce("not json at all")
      .mockResolvedValueOnce('{"verdict":"maybe"}')
      .mockResolvedValueOnce('{"verdict":"weak"}');
    await expect(parseWithRetry(Schema, ask)).resolves.toEqual({ verdict: "weak" });
    expect(ask).toHaveBeenCalledTimes(3);
    expect(ask.mock.calls[1][1]).toMatch(/not valid JSON/);
    expect(ask.mock.calls[2][1]).toMatch(/did not match the schema/);
  });

  it("gives up after max attempts", async () => {
    await expect(parseWithRetry(Schema, async () => "{}", 2)).rejects.toBeInstanceOf(InvalidModelOutputError);
  });
});

describe("embargo / AI-allowed rule", () => {
  const now = new Date("2026-06-01T00:00:00Z");
  it("allows only public, non-embargoed items", () => {
    expect(isAiAllowed({ visibility: "public", embargo_until: null }, now)).toBe(true);
    expect(isAiAllowed({ visibility: "internal", embargo_until: null }, now)).toBe(false);
    expect(isAiAllowed({ visibility: "public", embargo_until: "2026-07-01T00:00:00Z" }, now)).toBe(false);
    expect(isAiAllowed({ visibility: "public", embargo_until: "2026-05-01T00:00:00Z" }, now)).toBe(true);
  });
  it("public visibility also requires published status", () => {
    expect(isPubliclyVisible({ status: "draft", visibility: "public", embargo_until: null }, now)).toBe(false);
    expect(isPubliclyVisible({ status: "published", visibility: "public", embargo_until: null }, now)).toBe(true);
  });
  it("assertAiAllowed throws for any blocked item", () => {
    expect(() => assertAiAllowed([{ id: "a", visibility: "internal", embargo_until: null }])).toThrow(/AI disabled/);
  });
});

describe("reciprocal rank fusion", () => {
  it("rewards items that rank well in several lists", () => {
    const merged = rrfMerge([
      ["a", "b", "c"],
      ["b", "a", "d"],
      ["b"],
    ]);
    expect(merged[0].id).toBe("b");
    expect(merged.map((m) => m.id)).toEqual(["b", "a", "c", "d"]);
  });
  it("counts duplicates once per list", () => {
    const merged = rrfMerge([["a", "a", "a"]], 50);
    expect(merged[0].score).toBeCloseTo(1 / 51);
  });
});

describe("trust claims", () => {
  it("splits an article into sentence claims with inline cites", () => {
    const claims = splitClaims({
      channel: "website_article",
      headline: "h",
      standfirst: "s",
      body: [{ text: "First fact [c1]. Second fact [c2].", cites: ["c1"] }],
      key_facts: [{ text: "Key fact [c3]", cites: ["c3"] }],
    });
    expect(claims.map((c) => c.cites)).toEqual([["c1"], ["c2"], ["c3"]]);
  });
  it("heuristic verdicts", () => {
    const src = ["The team serviced six automatic weather stations along the coast."];
    expect(heuristicVerdict("The team serviced automatic weather stations.", src).verdict).toBe("supported");
    expect(heuristicVerdict("Penguins migrated north in winter.", src).verdict).toBe("unsupported");
    expect(heuristicVerdict("Anything", []).verdict).toBe("unsupported");
  });
  it("approval is blocked by unsupported claims or number misses", () => {
    expect(approvalBlockers([{ verdict: "supported", number_misses: [] }]).blocked).toBe(false);
    expect(approvalBlockers([{ verdict: "weak", number_misses: [] }]).blocked).toBe(false);
    expect(approvalBlockers([{ verdict: "supported", number_misses: ["8"] }]).blocked).toBe(true);
    expect(approvalBlockers([{ verdict: "unsupported", number_misses: [] }]).blocked).toBe(true);
  });
});
