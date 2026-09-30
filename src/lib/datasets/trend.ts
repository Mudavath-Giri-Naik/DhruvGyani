/**
 * Summary numbers for a yearly series, computed by code (never by the LLM):
 * baseline mean, record years and the least-squares trend.
 */
export interface SeriesPoint {
  year: number;
  value: number;
}

export interface SeriesSummary {
  /** Mean over the 1981–2010 reference period (the period NSIDC uses for its climatology). */
  baseline: number;
  min: SeriesPoint;
  max: SeriesPoint;
  /** Least-squares slope, in units per decade. */
  trendPerDecade: number;
  /** The same trend as a percentage of the baseline, per decade. */
  trendPctPerDecade: number;
}

export const BASELINE: [number, number] = [1981, 2010];

export function summarise(points: SeriesPoint[]): SeriesSummary {
  const ref = points.filter((p) => p.year >= BASELINE[0] && p.year <= BASELINE[1]);
  const baseline = ref.reduce((a, p) => a + p.value, 0) / Math.max(1, ref.length);
  const n = points.length;
  const mx = points.reduce((a, p) => a + p.year, 0) / n;
  const my = points.reduce((a, p) => a + p.value, 0) / n;
  const sxy = points.reduce((a, p) => a + (p.year - mx) * (p.value - my), 0);
  const sxx = points.reduce((a, p) => a + (p.year - mx) ** 2, 0);
  const slope = sxx ? sxy / sxx : 0;
  return {
    baseline,
    min: points.reduce((a, p) => (p.value < a.value ? p : a)),
    max: points.reduce((a, p) => (p.value > a.value ? p : a)),
    trendPerDecade: slope * 10,
    trendPctPerDecade: baseline ? ((slope * 10) / baseline) * 100 : 0,
  };
}

/** 1 = lowest value in the series. */
export const rankLowest = (points: SeriesPoint[], year: number) => {
  const v = points.find((p) => p.year === year)?.value;
  return v == null ? null : points.filter((p) => p.value < v).length + 1;
};
