import "server-only";
import index from "@/data/trade/hs-index.json";
import { HS_ALIASES_TR, HS_CHAPTERS_TR } from "@/data/trade/hs-tr";

/**
 * HS product codes (2, 4 and 6 digits; the first 6 digits of a Turkish GTİP
 * code and of a US HTS code are the same international HS code).
 */
type Row = [code: string, description: string, usImports: number, fromTurkiye: number];

export type HsLevel = 2 | 4 | 6;

export type HsCode = {
  code: string;
  level: HsLevel;
  /** Official US description (English). */
  description: string;
  chapter: { code: string; nameTr: string; nameEn: string };
  /** US imports in the index basis year, all countries and from Türkiye (search ranking only). */
  usImports: number;
  fromTurkiye: number;
};

const rows = index.codes as Row[];
const byCode = new Map(rows.map((r) => [r[0], r]));
export const HS_BASIS_YEAR = index.basisYear;

function toHs(r: Row): HsCode {
  const chapterCode = r[0].slice(0, 2);
  const chapterRow = byCode.get(chapterCode);
  return {
    code: r[0],
    level: r[0].length as HsLevel,
    description: r[1],
    chapter: {
      code: chapterCode,
      nameTr: HS_CHAPTERS_TR[chapterCode] ?? chapterRow?.[1] ?? chapterCode,
      nameEn: chapterRow?.[1] ?? chapterCode,
    },
    usImports: r[2],
    fromTurkiye: r[3],
  };
}

/** Accepts "5702", "5702.42", "570242", a 12-digit GTİP or a 10-digit HTS; returns a 2/4/6-digit HS code. */
export function normalizeHs(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length < 2) return null;
  const len = Math.min(6, digits.length - (digits.length % 2));
  return digits.slice(0, len);
}

export function getHs(code: string): HsCode | null {
  const row = byCode.get(code);
  return row ? toHs(row) : null;
}

/** Display name: Turkish chapter names in Turkish; deeper levels keep the US wording. */
export function hsLabel(hs: HsCode, locale: string): string {
  if (hs.level === 2) return locale === "tr" ? hs.chapter.nameTr : hs.description;
  return hs.description;
}

/** The next level down (HS2 → HS4, HS4 → HS6). */
export function hsChildren(code: string): HsCode[] {
  if (code.length >= 6) return [];
  const len = code.length + 2;
  return rows.filter((r) => r[0].length === len && r[0].startsWith(code)).map(toHs);
}

/** HS2 and HS4 parents of a code, top-down. */
export function hsAncestors(code: string): HsCode[] {
  const out: HsCode[] = [];
  for (let len = 2; len < code.length; len += 2) {
    const parent = getHs(code.slice(0, len));
    if (parent) out.push(parent);
  }
  return out;
}

/** Codes Türkiye ships the most of (index basis year), for the sitemap and suggestions. */
export function topTurkishCodes(level: HsLevel, n: number): string[] {
  return rows
    .filter((r) => r[0].length === level && r[3] > 0)
    .sort((a, b) => b[3] - a[3])
    .slice(0, n)
    .map((r) => r[0]);
}

/* Search */

/** Lower-case and strip Turkish and other diacritics so "fındık", "FINDIK" and "findik" match. */
export function fold(s: string): string {
  return s
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const folded = rows.map((r) => ({
  row: r,
  text: fold(r[1]),
  chapterTr: r[0].length === 2 ? fold(HS_CHAPTERS_TR[r[0]] ?? "") : "",
}));
const aliases = HS_ALIASES_TR.map((a) => ({
  terms: a.terms.map(fold),
  codes: a.codes,
}));

export type HsSuggestion = {
  code: string;
  level: HsLevel;
  label: string;
  chapter: string;
  usImports: number;
  fromTurkiye: number;
};

export function searchHs(query: string, locale: string, limit = 10): HsSuggestion[] {
  const q = fold(query);
  if (!q) return [];
  const scores = new Map<string, number>();
  const digitQuery = /^\d{2,}$/.test(query.replace(/[\s.\-]/g, ""));
  const add = (code: string, score: number) => {
    if (!byCode.has(code)) return;
    // Chapters 98 and 99 are US reporting provisions, not products: only on an explicit code search.
    if (!digitQuery && (code.startsWith("98") || code.startsWith("99"))) return;
    scores.set(code, Math.max(scores.get(code) ?? 0, score));
  };

  const digits = query.replace(/[\s.\-]/g, "");
  if (/^\d{2,}$/.test(digits)) {
    const code = normalizeHs(digits)!;
    add(code, 1000);
    for (const r of rows) if (r[0].startsWith(code) && r[0] !== code) add(r[0], 500 - r[0].length * 10);
  } else {
    const tokens = q.split(" ").filter((t) => t.length >= 2);
    if (!tokens.length) return [];
    // Turkish everyday words
    for (const a of aliases) {
      const hit = a.terms.find((t) => t === q || t.startsWith(q) || (q.length >= 4 && q.includes(t)));
      if (hit) a.codes.forEach((c, i) => add(c, 300 - i * 5 + (hit === q ? 50 : 0)));
    }
    // Chapter names (Turkish) and official descriptions (English), word-prefix match on every token
    const wordPrefix = (text: string) => tokens.every((t) => text.startsWith(t) || text.includes(` ${t}`));
    for (const f of folded) {
      if (f.chapterTr && wordPrefix(f.chapterTr)) add(f.row[0], 200);
      if (wordPrefix(f.text)) add(f.row[0], 100 + (f.row[0].length === 4 ? 15 : f.row[0].length === 2 ? 5 : 10));
    }
  }

  return [...scores.entries()]
    .map(([code, score]) => ({ hs: getHs(code)!, score }))
    .sort((a, b) => b.score - a.score || b.hs.usImports - a.hs.usImports)
    .slice(0, limit)
    .map(({ hs }) => ({
      code: hs.code,
      level: hs.level,
      label: hsLabel(hs, locale),
      chapter: locale === "tr" ? hs.chapter.nameTr : hs.chapter.nameEn,
      usImports: hs.usImports,
      fromTurkiye: hs.fromTurkiye,
    }));
}
