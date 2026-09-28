import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const load = (l: string) => JSON.parse(readFileSync(join(process.cwd(), "messages", `${l}.json`), "utf8"));
const keys = (o: Record<string, unknown>, p = ""): string[] =>
  Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? keys(v as Record<string, unknown>, `${p}${k}.`) : [`${p}${k}`]));

describe("message catalogues", () => {
  it("English and Hindi have exactly the same keys", () => {
    expect(keys(load("hi")).sort()).toEqual(keys(load("en")).sort());
  });
  it("Hindi strings are real Devanagari text where translated", () => {
    const hi = load("hi");
    expect(hi.landing.title2).toMatch(/[ऀ-ॿ]/);
    expect(hi.nav.expeditions).toMatch(/[ऀ-ॿ]/);
  });
});
