import Papa from "papaparse";
import type { DatasetColumn, DatasetProfile } from "@/lib/types";

/**
 * CSV profiler. ALL numbers in a data card come from this code — the LLM
 * only writes prose around them (see buildDataCard / BUILD_PROMPT §9).
 */

const UNIT_HINTS: [RegExp, string][] = [
  [/(_c|_degc|celsius)$/i, "°C"],
  [/(_k|kelvin)$/i, "K"],
  [/(_pct|_percent|percent)$/i, "%"],
  [/(_ms|_m_s)$/i, "m/s"],
  [/(_kmh)$/i, "km/h"],
  [/(_hpa)$/i, "hPa"],
  [/(_mm)$/i, "mm"],
  [/(_m)$/i, "m"],
  [/(_km2)$/i, "km²"],
];

export function guessUnit(column: string): string | null {
  for (const [re, unit] of UNIT_HINTS) if (re.test(column)) return unit;
  return null;
}

const DATE_RE = /^\d{4}-\d{2}(-\d{2})?([T ][\d:.]+Z?)?$/;

function isMissing(v: unknown) {
  return v === null || v === undefined || (typeof v === "string" && (v.trim() === "" || /^(na|n\/a|nan|null|-999\.?9*)$/i.test(v.trim())));
}

const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

export function profileCsv(csv: string, units: Record<string, string> = {}): DatasetProfile & { rows: Record<string, string>[] } {
  const parsed = Papa.parse<Record<string, string>>(csv.trim(), { header: true, skipEmptyLines: true });
  const rows = parsed.data;
  const fields = parsed.meta.fields ?? [];
  const columns: DatasetColumn[] = fields.map((name) => {
    const values = rows.map((r) => r[name]);
    const present = values.filter((v) => !isMissing(v)).map((v) => String(v).trim());
    const missing = values.length - present.length;
    const nums = present.map(Number).filter((n) => Number.isFinite(n));
    const dates = present.filter((v) => DATE_RE.test(v));
    let kind: DatasetColumn["kind"] = "text";
    if (present.length && dates.length / present.length >= 0.8) kind = "date";
    else if (present.length && nums.length / present.length >= 0.8) kind = "number";
    const col: DatasetColumn = {
      name,
      kind,
      count: present.length,
      missing,
      missingPct: values.length ? round((missing / values.length) * 100, 1) : 0,
      unit: units[name] ?? guessUnit(name),
    };
    if (kind === "number" && nums.length) {
      col.min = round(Math.min(...nums));
      col.max = round(Math.max(...nums));
      col.mean = round(nums.reduce((a, b) => a + b, 0) / nums.length);
    }
    if (kind === "date" && dates.length) {
      const sorted = [...dates].sort();
      col.min = sorted[0];
      col.max = sorted[sorted.length - 1];
    }
    return col;
  });

  const timeCol = columns.find((c) => c.kind === "date");
  const unitMap: Record<string, string> = {};
  for (const c of columns) if (c.unit) unitMap[c.name] = c.unit;

  return {
    item_id: "",
    columns,
    row_count: rows.length,
    time_range: timeCol ? { column: timeCol.name, start: String(timeCol.min), end: String(timeCol.max) } : null,
    units: unitMap,
    stats: { parse_errors: parsed.errors.length },
    summary: null,
    sample_rows: rows.slice(0, 5),
    rows,
  };
}

/** Plain-language data card, built only from code-computed numbers. */
export function buildDataCard(p: DatasetProfile, lang: "en" | "hi" = "en"): string[] {
  const lines: string[] = [];
  const numeric = p.columns.filter((c) => c.kind === "number");
  if (lang === "hi") {
    lines.push(`इस डेटासेट में ${p.row_count} पंक्तियाँ और ${p.columns.length} कॉलम हैं।`);
    if (p.time_range) lines.push(`समय सीमा: ${p.time_range.start} से ${p.time_range.end} तक (${p.time_range.column})।`);
    for (const c of numeric) lines.push(`${c.name}: न्यूनतम ${c.min}, अधिकतम ${c.max}, औसत ${c.mean}${c.unit ? ` ${c.unit}` : ""}।`);
    const gaps = p.columns.filter((c) => c.missing > 0);
    lines.push(gaps.length ? `अनुपलब्ध मान: ${gaps.map((c) => `${c.name} (${c.missingPct}%)`).join(", ")}।` : "कोई अनुपलब्ध मान नहीं।");
    return lines;
  }
  lines.push(`This dataset has ${p.row_count} rows and ${p.columns.length} columns.`);
  if (p.time_range) lines.push(`Time range: ${p.time_range.start} to ${p.time_range.end} (column “${p.time_range.column}”).`);
  for (const c of numeric) lines.push(`${c.name}: min ${c.min}, max ${c.max}, mean ${c.mean}${c.unit ? ` ${c.unit}` : ""}.`);
  const gaps = p.columns.filter((c) => c.missing > 0);
  lines.push(gaps.length ? `Missing values: ${gaps.map((c) => `${c.name} (${c.missingPct}%)`).join(", ")}.` : "No missing values.");
  return lines;
}
