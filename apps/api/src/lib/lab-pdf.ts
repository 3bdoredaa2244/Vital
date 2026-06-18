/**
 * Heuristic lab-PDF parser.
 *
 * Extracts text from an uploaded lab PDF and matches lines against the VITAL
 * biomarker library to produce DRAFT result rows. This is intentionally
 * conservative — every row is returned for admin review/correction before any
 * result is persisted. It never auto-saves.
 */
// Import the inner lib path to avoid pdf-parse's debug block that reads a test
// file from disk when imported as the main module.
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
// pdfjs gives per-fragment x/y, letting us rebuild true rows (handles columnar
// tables that flattened text mangles). Legacy build runs without a DOM in Node.
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

import type { ParsedLabRow } from '../db/schema.js';

/**
 * Reconstruct a PDF into visual rows using each text fragment's coordinates:
 * fragments sharing a baseline (y) become one line, left-to-right. This pairs a
 * marker with its value/range even in multi-column lab tables, where flattened
 * text reads each column top-to-bottom and scrambles rows. Falls back to
 * pdf-parse's flattened text if positional extraction yields nothing (e.g. an
 * unusual encoding); a scanned/image PDF has no text layer and needs OCR.
 */
async function extractLines(data: Uint8Array): Promise<string[]> {
  try {
    const doc = await getDocument({ data, isEvalSupported: false, verbosity: 0 }).promise;
    const out: string[] = [];
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      const items = (content.items as { str: string; transform: number[] }[])
        .filter((it) => typeof it.str === 'string' && it.str.trim().length > 0)
        .map((it) => ({ x: it.transform[4]!, y: it.transform[5]!, s: it.str }))
        .sort((a, b) => b.y - a.y); // top → bottom

      // Group fragments into rows by baseline proximity, then order each row L→R.
      let row: { x: number; s: string }[] = [];
      let rowY: number | null = null;
      const flush = () => {
        if (row.length === 0) return;
        const text = row
          .sort((a, b) => a.x - b.x)
          .map((c) => c.s)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (text) out.push(text);
        row = [];
      };
      for (const it of items) {
        if (rowY !== null && Math.abs(it.y - rowY) > 2.5) flush();
        row.push({ x: it.x, s: it.s });
        rowY = it.y;
      }
      flush();
    }
    if (out.length > 0) return out;
  } catch {
    /* fall back to flattened text */
  }
  try {
    const result = await pdfParse(Buffer.from(data));
    return (result.text ?? '')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  } catch {
    return [];
  }
}

interface BiomarkerLike {
  id: string;
  name: string;
  unit: string;
  slug: string;
  minPlausible: number;
  maxPlausible: number;
  tags?: string[];
}

/** Common lab abbreviations → biomarker slug, to lift match rates. */
const SLUG_ALIASES: Record<string, string[]> = {
  hba1c: ['hba1c', 'a1c', 'glycated hemoglobin', 'glycated haemoglobin'],
  'fasting-glucose': ['glucose', 'fasting glucose', 'fbs', 'fpg'],
  'ldl-cholesterol': ['ldl', 'ldl cholesterol', 'ldl-c'],
  'hdl-cholesterol': ['hdl', 'hdl cholesterol', 'hdl-c'],
  triglycerides: ['triglycerides', 'tg'],
  'total-cholesterol': ['total cholesterol', 'cholesterol total', 'cholesterol'],
  tsh: ['tsh', 'thyroid stimulating hormone'],
  'free-t4': ['free t4', 'ft4'],
  'free-t3': ['free t3', 'ft3'],
  'vitamin-d-25oh': ['vitamin d', '25-oh', '25 oh vitamin d', '25-hydroxyvitamin d', '25(oh)'],
  'vitamin-b12': ['vitamin b12', 'b12', 'cobalamin'],
  ferritin: ['ferritin'],
  hemoglobin: ['hemoglobin', 'haemoglobin', 'hgb', 'hb'],
  hematocrit: ['hematocrit', 'haematocrit', 'hct'],
  wbc: ['wbc', 'white blood cell', 'leukocyte'],
  rbc: ['rbc', 'red blood cell'],
  platelets: ['platelets', 'plt'],
  creatinine: ['creatinine', 'creat'],
  alt: ['alt', 'sgpt', 'alanine aminotransferase'],
  ast: ['ast', 'sgot', 'aspartate aminotransferase'],
  'uric-acid': ['uric acid'],
  'hscrp-cardiac': ['hs-crp', 'hscrp', 'high sensitivity crp'],
  'alkaline-phosphatase': ['alkaline phosphatase', 'alp', 'alk phos'],
  'blood-urea-nitrogen': ['blood urea nitrogen', 'bun'],
  'serum-urea': ['serum urea', 'urea', 'blood urea'],
  'psa-total': ['psa', 'psa total', 'prostate specific antigen', 'total psa'],
  'indirect-bilirubin': ['indirect bilirubin', 'unconjugated bilirubin'],
  'total-bilirubin': ['total bilirubin'],
  'direct-bilirubin': ['direct bilirubin', 'conjugated bilirubin'],
  'total-protein': ['total protein', 'serum total protein'],
  albumin: ['albumin', 'serum albumin'],
};

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * First standalone number on a line. Requires the number not be embedded in an
 * alphanumeric token, so marker names like "A1C", "B12", "T3" don't yield a
 * bogus value (the "1" in "A1C").
 */
function extractNumber(line: string): number | null {
  const m = line.match(
    /(?:^|[^A-Za-z0-9.])(-?\d{1,3}(?:,\d{3})*(?:\.\d+)?|-?\d+(?:\.\d+)?)(?=[^A-Za-z0-9]|$)/,
  );
  if (!m) return null;
  const n = Number(m[1]!.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

/** A line that is just a number — the value in "name / value / unit" layouts. */
function pureNumberLine(line: string): number | null {
  return /^[-+]?\d+(?:\.\d+)?$/.test(line.trim()) ? Number(line.trim()) : null;
}

interface RefRange {
  raw: string;
  low: number | null;
  high: number | null;
}

/**
 * Find the reference range printed for a result by scanning the few lines after
 * its value. Labs print these glued to the unit ("U/L40 - 129"), as bounds
 * ("Up to 0.90", "< 5", "> 55"), or on their own line ("60 - 160",
 * "Normal: 4.5 - 5.7"). Returns the first recognisable range, raw + parsed.
 */
function extractRange(
  lines: string[],
  valueIdx: number,
  stop?: (idx: number) => boolean,
): RefRange | null {
  for (let k = valueIdx; k <= valueIdx + 3 && k < lines.length; k++) {
    // Don't let a range bleed in from the next result (labs that print the
    // range before the value leave only the following marker's range nearby).
    if (k > valueIdx && stop?.(k)) break;
    const raw = lines[k]!.trim();
    // A wordy, number-free line is the next result's name (e.g. "VLDL
    // Cholesterol, Serum") — stop before borrowing its range. Units like
    // "mg/dL" are short single tokens and don't trip this.
    if (k > valueIdx && !/\d/.test(raw) && (raw.match(/[a-zA-Z]{3,}/g)?.length ?? 0) >= 2) break;
    // Skip prose: real reference ranges aren't wordy. A reconstructed table row
    // ("Lymphocytes 43 (20 - 40) …") has few words; a clinical note has many.
    if ((raw.match(/[a-zA-Z]{4,}/g)?.length ?? 0) > 5) continue;
    // Skip "bad/intermediate" tier rows of a multi-tier reference (e.g. Vitamin D
    // "Deficiency <20", "Insufficiency 21-29") so we capture the normal tier
    // ("Sufficiency 30-100"), not a threshold that would misclassify a good value.
    if (/deficien|insufficien|high\s*risk|borderline|prediabet|diabetic|hypervitamin|abnormal/i.test(raw)) continue;
    const low = raw.toLowerCase();

    const upTo = low.match(/up\s*to\s*:?\s*(\d+(?:\.\d+)?)/);
    if (upTo) return { raw, low: null, high: Number(upTo[1]) };

    // Worded directional bounds, e.g. HDL "No risk: More than 55".
    const moreThan = low.match(/more than\s*(\d+(?:\.\d+)?)/);
    if (moreThan) return { raw, low: Number(moreThan[1]), high: null };
    const lessThan = low.match(/less than\s*(\d+(?:\.\d+)?)/);
    if (lessThan) return { raw, low: null, high: Number(lessThan[1]) };

    // A bounded "low - high" anywhere on the line (in same-row table layouts the
    // value precedes the range, e.g. "Hemoglobin 14.3 g/dL (13.0 - 17.0)").
    const dash = raw.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/);
    if (dash) return { raw, low: Number(dash[1]), high: Number(dash[2]) };

    const lt = low.match(/[<≤]\s*(\d+(?:\.\d+)?)/);
    if (lt) return { raw, low: null, high: Number(lt[1]) };

    const gt = low.match(/[>≥]\s*(\d+(?:\.\d+)?)/);
    if (gt) return { raw, low: Number(gt[1]), high: null };
  }
  return null;
}

interface Candidate {
  bm: BiomarkerLike;
  needles: string[];
  base: number; // base confidence for this needle set
}

export async function parseLabPdf(
  data: Buffer | Uint8Array,
  biomarkers: BiomarkerLike[],
): Promise<ParsedLabRow[]> {
  const lines = await extractLines(data instanceof Buffer ? new Uint8Array(data) : data);
  if (lines.length === 0) return [];

  // Build candidate needles per biomarker.
  const candidates: Candidate[] = biomarkers.map((bm) => {
    const needles = new Set<string>();
    const name = normalize(bm.name);
    needles.add(name);
    // Drop a trailing parenthetical, e.g. "Vitamin D3 (25-OH)" → "vitamin d3".
    const noParen = normalize(bm.name.replace(/\(.*?\)/g, ''));
    if (noParen) needles.add(noParen);
    for (const alias of SLUG_ALIASES[bm.slug] ?? []) needles.add(normalize(alias));
    return { bm, needles: [...needles], base: 1 };
  });

  // Best match per biomarker (one row each, highest confidence wins).
  const best = new Map<string, ParsedLabRow>();

  // The single most specific biomarker a line names (full-name match first, then
  // longest needle), or null. Shared by the main match and the forward-scan stop.
  const bestCandidate = (nline: string): { cand: Candidate; needle: string; full: boolean } | null => {
    let pick: { cand: Candidate; needle: string; full: boolean } | null = null;
    for (const cand of candidates) {
      // Negative context: don't let generic haemoglobin match an HbA1c line.
      // "glycohemoglobin (hba1c)" has no word boundary before "a1c", so match
      // the a1c/glyco substrings directly rather than a bounded \ba1c\b.
      if (cand.bm.slug === 'hemoglobin' && /a1c|glyco/.test(nline)) continue;
      // "ldl" is a substring of "vldl" and appears in "ldl/hdl" ratio lines;
      // keep LDL/HDL from matching VLDL, non-HDL, or the cholesterol ratios.
      if (cand.bm.slug === 'ldl-cholesterol' && /vldl|ldl\s*\/\s*hdl/.test(nline)) continue;
      if (cand.bm.slug === 'hdl-cholesterol' && /non[-\s]?hdl|\/\s*hdl|hdl\s*\//.test(nline)) continue;
      // 25-OH vitamin D is a different test from 1,25-OH (calcitriol).
      if (cand.bm.slug === 'vitamin-d-25oh' && /1[.,]\s*25/.test(nline)) continue;
      // The bare "cholesterol" alias must not match the HDL/LDL/VLDL/ratio lines
      // (ratios like "T.Cholesterol / HDL" always contain hdl/ldl, so matching
      // those names covers them — don't reject the "mg/dL" unit slash).
      if (cand.bm.slug === 'total-cholesterol' && /hdl|ldl|vldl|non[-\s]?hdl/.test(nline)) continue;

      let matchedNeedle: string | null = null;
      for (const needle of cand.needles) {
        if (needle.length < 2) continue;
        // Whole-name match is strong; short alias must be word-bounded.
        if (needle.length <= 4) {
          const re = new RegExp(`(^|[^a-z0-9])${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`);
          if (re.test(nline)) matchedNeedle = needle;
        } else if (nline.includes(needle)) {
          matchedNeedle = needle;
        }
        if (matchedNeedle) break;
      }
      if (!matchedNeedle) continue;

      const full = matchedNeedle === normalize(cand.bm.name);
      const better =
        !pick ||
        (full && !pick.full) ||
        (full === pick.full && matchedNeedle.length > pick.needle.length);
      if (better) pick = { cand, needle: matchedNeedle, full };
    }
    return pick;
  };

  // A short line that names a *different* marker — where a forward value-scan
  // must stop so one marker can't grab the value below it.
  const startsOtherMarker = (idx: number, currentId: string): boolean => {
    const l = lines[idx]!;
    if (l.trim().length > 45) return false; // long lines are prose/notes
    const c = bestCandidate(normalize(l));
    return c !== null && c.cand.bm.id !== currentId;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const nline = normalize(line);

    // Skip long prose (clinical notes) — they aren't result rows and can falsely
    // contain a marker name (e.g. a note that mentions "TSH").
    if (line.length > 60 && extractNumber(line) === null) continue;

    const pick = bestCandidate(nline);
    if (!pick) continue;

    // Value: the first standalone number on a following line (labs print
    // name → unit → [notes] → value), stopping before the next marker; failing
    // that, an inline number on the name line itself.
    let value: number | null = null;
    let valueIdx = i;
    // 1) Same-row layout: the value is the first number *after* the marker name
    //    on this line ("Fasting Blood Glucose 97 mg/dl 70 - 109"). Reading after
    //    the name avoids a number embedded in it ("25(OH)").
    const after = nline.slice(nline.indexOf(pick.needle) + pick.needle.length);
    value = extractNumber(after);
    // 2) Stacked layout: the value is on a following row, as its leading token
    //    ("183 mg/dL Desirable: < 200") or alone. Requiring it at the start
    //    avoids grabbing a range bound, an ID, or a mid-row number from a note;
    //    the scan stops at the next named marker.
    if (value === null) {
      for (let k = i + 1; k <= i + 8 && k < lines.length; k++) {
        if (startsOtherMarker(k, pick.cand.bm.id)) break;
        const row = lines[k]!;
        const m = row.match(/^[-+]?\d+(?:\.\d+)?$/) ?? row.match(/^([-+]?\d+(?:\.\d+)?)\s+\D/);
        if (m) {
          value = Number(m[1] ?? m[0]);
          valueIdx = k;
          break;
        }
      }
    }
    if (value === null) continue;

    const { cand, full } = pick;
    const inRange = value >= cand.bm.minPlausible && value <= cand.bm.maxPlausible;
    let confidence = full ? 0.85 : 0.6;
    if (inRange) confidence += 0.1;
    confidence = Math.min(confidence, 0.97);

    const existing = best.get(cand.bm.id);
    if (!existing || confidence > existing.confidence) {
      const range = extractRange(lines, valueIdx, (k) => startsOtherMarker(k, cand.bm.id));
      best.set(cand.bm.id, {
        biomarkerId: cand.bm.id,
        biomarkerName: cand.bm.name,
        matchedName: cand.bm.name,
        value,
        unit: cand.bm.unit,
        confidence,
        include: confidence >= 0.6 && inRange,
        referenceRange: range?.raw ?? null,
        refLow: range?.low ?? null,
        refHigh: range?.high ?? null,
      });
    }
  }

  return [...best.values()].sort((a, b) => b.confidence - a.confidence);
}
