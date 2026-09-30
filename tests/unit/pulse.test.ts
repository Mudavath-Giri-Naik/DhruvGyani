import { describe, expect, it } from "vitest";
import { rankLowest, summarise } from "@/lib/datasets/trend";
import { SEA_ICE } from "@/lib/seed/seaice";
import { sunInfo } from "@/lib/sun";

describe("sun position", () => {
  it("gives about twelve hours of daylight at the equator on the equinox", () => {
    const s = sunInfo(0, 0, new Date("2026-03-20T12:00:00Z"));
    expect(s.daylightHours).toBeGreaterThan(11.9);
    expect(s.daylightHours).toBeLessThan(12.3);
    expect(s.elevation).toBeGreaterThan(85);
    expect(s.state).toBe("day");
  });

  it("knows polar night and polar day at Ny-Ålesund", () => {
    expect(sunInfo(78.92, 11.93, new Date("2026-12-21T11:00:00Z")).state).toBe("polar_night");
    const june = sunInfo(78.92, 11.93, new Date("2026-06-21T23:00:00Z"));
    expect(june.state).toBe("polar_day");
    expect(june.elevation).toBeGreaterThan(0);
  });

  it("flips the seasons in Antarctica", () => {
    expect(sunInfo(-70.77, 11.73, new Date("2026-06-21T11:00:00Z")).state).toBe("polar_night");
    expect(sunInfo(-70.77, 11.73, new Date("2026-12-21T23:00:00Z")).state).toBe("polar_day");
  });

  it("puts solar noon near 12:00 UTC on the prime meridian", () => {
    const s = sunInfo(32.4, 0, new Date("2026-09-30T12:00:00Z"));
    expect(Math.abs(s.solarMinutes - 720)).toBeLessThan(20);
  });
});

describe("series summary", () => {
  const pts = [
    { year: 1981, value: 10 },
    { year: 1991, value: 9 },
    { year: 2001, value: 8 },
    { year: 2011, value: 7 },
  ];
  it("computes baseline, extremes, rank and the trend per decade", () => {
    const s = summarise(pts);
    expect(s.baseline).toBeCloseTo(9);
    expect(s.min).toEqual({ year: 2011, value: 7 });
    expect(s.max).toEqual({ year: 1981, value: 10 });
    expect(s.trendPerDecade).toBeCloseTo(-1);
    expect(rankLowest(pts, 2011)).toBe(1);
    expect(rankLowest(pts, 1981)).toBe(4);
  });

  it("shows the September Arctic decline in the real NSIDC record", () => {
    const series = SEA_ICE.arcticSep.flatMap(([year, extent]) => (extent == null ? [] : [{ year, value: extent }]));
    const s = summarise(series);
    expect(series[0].year).toBe(1979);
    expect(s.trendPerDecade).toBeLessThan(0);
    expect(s.min.year).toBe(2012);
  });
});
