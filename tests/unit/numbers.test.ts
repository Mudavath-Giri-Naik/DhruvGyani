import { describe, expect, it } from "vitest";
import { draftNumbers, extractNumbers, toAsciiDigits, unmatchedNumbers } from "@/lib/trust/numbers";

const values = (s: string) => draftNumbers(s).map((n) => n.value);

describe("numbers normaliser", () => {
  it("converts Devanagari digits", () => {
    expect(toAsciiDigits("४५वाँ अभियान, २०२६")).toBe("45वाँ अभियान, 2026");
    expect(values("टीम ने ६ केंद्रों की सर्विसिंग की")).toEqual(["6"]);
  });

  it("strips thousands separators (Western and Indian grouping)", () => {
    expect(values("above 4,850 m")).toEqual(["4850"]);
    expect(values("1,20,000 visitors")).toEqual(["120000"]);
  });

  it("reads ordinals in English and Hindi", () => {
    expect(values("the 45th expedition")).toEqual(["45"]);
    expect(values("46वाँ भारतीय अभियान")).toEqual(["46"]);
  });

  it("reads decimals, negatives, unicode minus and percentages", () => {
    expect(values("from -12.4 °C to 2.1 °C")).toEqual(["-12.4", "2.1"]);
    expect(values("from −12.4 °C")).toEqual(["-12.4"]);
    expect(values("missing 3.4%")).toEqual(["3.4"]);
  });

  it("splits ISO dates and ranges", () => {
    expect(values("on 2026-01-08")).toEqual(["2026", "1", "8"]);
    expect(values("between 12-15 days")).toEqual(["12", "15"]);
  });

  it("reads number words", () => {
    expect(values("six weather stations")).toEqual(["6"]);
    expect(values("छह केंद्र")).toEqual(["6"]);
  });

  it("ignores citation markers", () => {
    expect(values("serviced stations [c2]")).toEqual([]);
    expect(values("serviced 6 stations [c1, c12]")).toEqual(["6"]);
  });
});

describe("numbers matcher", () => {
  const src = "The team serviced 6 automatic weather stations between 8 January 2026 and 21 January 2026. Temperature ranged from -12.4 °C to 2.1 °C above 4,850 m.";

  it("passes when every number is in the source", () => {
    expect(unmatchedNumbers("The team serviced 6 stations [c2].", src)).toEqual([]);
    expect(unmatchedNumbers("Work ran from 2026-01-08 to 21 January 2026.", src)).toEqual([]);
    expect(unmatchedNumbers("Temperatures reached 2.10 °C.", src)).toEqual([]);
    expect(unmatchedNumbers("They worked above 4850 m.", src)).toEqual([]);
  });

  it("flags numbers that are not in the source", () => {
    expect(unmatchedNumbers("The team serviced 9 stations.", src)).toEqual(["9"]);
    expect(unmatchedNumbers("They serviced seven stations.", src)).toEqual(["seven"]);
  });

  it("matches Devanagari digits against ASCII sources", () => {
    expect(unmatchedNumbers("टीम ने ६ केंद्रों की सर्विसिंग की।", src)).toEqual([]);
    expect(unmatchedNumbers("टीम ने ९ केंद्रों की सर्विसिंग की।", src)).toEqual(["9"]);
  });

  it("treats sign carefully", () => {
    expect(unmatchedNumbers("a low of 12.4 °C below zero", src)).toEqual([]);
    expect(unmatchedNumbers("a high of -2.1 °C", src)).toEqual(["-2.1"]);
  });

  it("source month names vouch for numeric months", () => {
    expect(extractNumbers("8 January 2026", { includeMonths: true }).map((n) => n.value)).toContain("1");
  });
});
