import "server-only";
import { cache } from "react";
import { latestMonth, levelYtd, partnersMonthly, portsMonthly, type MonthlyRow } from "./census";
import { COUNTRIES, countryByCode, type Country } from "./countries";
import { growth } from "./format";
import { getHs, hsAncestors, hsChildren, hsLabel, type HsCode } from "./hs";
import { addMonths, monthsEnding, ymKey, ytdBasis, type Ym, type YtdBasis } from "./periods";
import { tariffLines, type TariffLine } from "./usitc";

/**
 * Turns raw Census rows into what the trade pages show. "Last 12 months" (R12)
 * is the latest 12 published months; the comparison is the 12 months before.
 * Values are general imports (customs value, USD). The effective duty rate is
 * calculated duty divided by the value of imports for consumption.
 */
const WORLD = "-";
const COUNTRY_CODES = new Set(COUNTRIES.map((c) => c.code));

export type Totals = {
  gen: number;
  con: number;
  duty: number;
  air: number;
  ves: number;
};
const empty = (): Totals => ({ gen: 0, con: 0, duty: 0, air: 0, ves: 0 });
export const dutyRate = (t: Totals) => (t.con > 0 ? t.duty / t.con : null);

export type Windows = {
  cur: { first: Ym; last: Ym; keys: Set<string> };
  prev: { first: Ym; last: Ym; keys: Set<string> };
};
function windowsFor(latest: Ym): Windows {
  const cur = monthsEnding(latest, 12);
  const prev = monthsEnding(addMonths(latest, -12), 12);
  return {
    cur: { first: cur[0], last: cur[11], keys: new Set(cur.map(ymKey)) },
    prev: { first: prev[0], last: prev[11], keys: new Set(prev.map(ymKey)) },
  };
}

function sumByPartner(rows: MonthlyRow[], keys: Set<string>): Map<string, Totals> {
  const out = new Map<string, Totals>();
  for (const r of rows) {
    if (!keys.has(r.month)) continue;
    const t = out.get(r.cty) ?? empty();
    t.gen += r.gen;
    t.con += r.con;
    t.duty += r.duty;
    t.air += r.air;
    t.ves += r.ves;
    out.set(r.cty, t);
  }
  return out;
}

export type MonthPoint = { month: string; value: number; duty: number | null };

function seriesFor(rows: MonthlyRow[], cty: string, months: Ym[]): MonthPoint[] {
  const byMonth = new Map(rows.filter((r) => r.cty === cty).map((r) => [r.month, r]));
  return months.map((m) => {
    const r = byMonth.get(ymKey(m));
    return {
      month: ymKey(m),
      value: r?.gen ?? 0,
      duty: r && r.con > 0 ? r.duty / r.con : null,
    };
  });
}

/** Partners ranked by R12 value (countries only, no regional groupings). */
function ranking(totals: Map<string, Totals>) {
  return [...totals.entries()]
    .filter(([code, t]) => COUNTRY_CODES.has(code) && t.gen > 0)
    .sort((a, b) => b[1].gen - a[1].gen)
    .map(([code, t], i) => ({ code, rank: i + 1, totals: t }));
}

export type PartnerStat = {
  country: Country;
  rank: number;
  value: number;
  prevValue: number;
  growth: number | null;
  share: number;
  dutyRate: number | null;
};

export type ProductRow = {
  code: string;
  label: string;
  chapter: string;
  value: number;
  prevValue: number;
  change: number;
  growth: number | null;
  /** Share of all US imports of this product (same period). */
  share: number | null;
};

export type PortStat = {
  port: string;
  name: string;
  value: number;
  share: number;
  vesselShare: number | null;
};

function portStats(rows: { port: string; name: string; gen: number; ves: number }[], total: number): PortStat[] {
  const byPort = new Map<string, { name: string; gen: number; ves: number }>();
  for (const r of rows) {
    const p = byPort.get(r.port) ?? { name: r.name, gen: 0, ves: 0 };
    p.gen += r.gen;
    p.ves += r.ves;
    byPort.set(r.port, p);
  }
  return [...byPort.entries()]
    .filter(([, p]) => p.gen > 0)
    .sort((a, b) => b[1].gen - a[1].gen)
    .slice(0, 8)
    .map(([port, p]) => ({
      port,
      name: p.name,
      value: p.gen,
      share: total > 0 ? p.gen / total : 0,
      vesselShare: p.gen > 0 ? p.ves / p.gen : null,
    }));
}

function productRows(
  cur: { code: string; gen: number }[],
  prev: { code: string; gen: number }[],
  world: { code: string; gen: number }[],
  locale: string,
  filter: (code: string) => boolean,
): ProductRow[] {
  const prevBy = new Map(prev.map((r) => [r.code, r.gen]));
  const worldBy = new Map(world.map((r) => [r.code, r.gen]));
  const codes = new Set([...cur.map((r) => r.code), ...prev.map((r) => r.code)].filter(filter));
  const curBy = new Map(cur.map((r) => [r.code, r.gen]));
  return [...codes].flatMap((code) => {
    const hs = getHs(code);
    if (!hs) return [];
    const value = curBy.get(code) ?? 0;
    const prevValue = prevBy.get(code) ?? 0;
    const worldValue = worldBy.get(code) ?? 0;
    return [
      {
        code,
        label: hsLabel(hs, locale),
        chapter: locale === "tr" ? hs.chapter.nameTr : hs.chapter.nameEn,
        value,
        prevValue,
        change: value - prevValue,
        growth: growth(value, prevValue),
        share: worldValue > 0 ? value / worldValue : null,
      },
    ];
  });
}

/* Country overview: everything the US imports from one partner */

export type CountryOverview = {
  latest: Ym;
  windows: Windows;
  basis: YtdBasis;
  country: Country;
  value: number;
  prevValue: number;
  growth: number | null;
  share: number;
  rank: number | null;
  prevRank: number | null;
  partners: number;
  dutyRate: number | null;
  prevDutyRate: number | null;
  vesselShare: number | null;
  airShare: number | null;
  monthly: MonthPoint[];
  topProducts: ProductRow[];
  gainers: ProductRow[];
  decliners: ProductRow[];
  ports: PortStat[];
};

export const getCountryOverview = cache(async (countryCode: string, locale: string): Promise<CountryOverview> => {
  const country = countryByCode(countryCode)!;
  const latest = await latestMonth();
  const basis = ytdBasis(latest);
  const w = windowsFor(latest);
  const [all, ytdCur, ytdPrev, worldYtd, ports] = await Promise.all([
    partnersMonthly(WORLD, addMonths(latest, -35)),
    levelYtd(country.code, 4, basis.cur),
    levelYtd(country.code, 4, basis.prev),
    levelYtd(WORLD, 4, basis.cur),
    portsMonthly(country.code, WORLD, w.cur.first),
  ]);

  const cur = sumByPartner(all, w.cur.keys);
  const prev = sumByPartner(all, w.prev.keys);
  const mine = cur.get(country.code) ?? empty();
  const minePrev = prev.get(country.code) ?? empty();
  const world = cur.get(WORLD) ?? empty();
  const rankNow = ranking(cur);
  const rankPrev = ranking(prev);

  // Chapters 98 and 99 are US reporting provisions (returned goods, low-value estimates), not products.
  const rows = productRows(ytdCur, ytdPrev, worldYtd, locale, (code) => !code.startsWith("98") && !code.startsWith("99"));
  return {
    latest,
    windows: w,
    basis,
    country,
    value: mine.gen,
    prevValue: minePrev.gen,
    growth: growth(mine.gen, minePrev.gen),
    share: world.gen > 0 ? mine.gen / world.gen : 0,
    rank: rankNow.find((r) => r.code === country.code)?.rank ?? null,
    prevRank: rankPrev.find((r) => r.code === country.code)?.rank ?? null,
    partners: rankNow.length,
    dutyRate: dutyRate(mine),
    prevDutyRate: dutyRate(minePrev),
    vesselShare: mine.gen > 0 ? mine.ves / mine.gen : null,
    airShare: mine.gen > 0 ? mine.air / mine.gen : null,
    monthly: seriesFor(all, country.code, monthsEnding(latest, 36)),
    topProducts: [...rows].sort((a, b) => b.value - a.value).slice(0, 12),
    gainers: rows
      .filter((r) => r.change > 0)
      .sort((a, b) => b.change - a.change)
      .slice(0, 8),
    decliners: rows
      .filter((r) => r.change < 0)
      .sort((a, b) => a.change - b.change)
      .slice(0, 8),
    ports: portStats(
      ports,
      ports.reduce((s, p) => s + p.gen, 0),
    ),
  };
});

/* Product view: one HS code, all partners, the selected partner highlighted */

export type ProductView = {
  hs: HsCode;
  label: string;
  ancestors: { code: string; label: string }[];
  latest: Ym;
  windows: Windows;
  basis: YtdBasis;
  country: Country;
  world: {
    value: number;
    prevValue: number;
    growth: number | null;
    dutyRate: number | null;
    monthly: MonthPoint[];
  };
  selected: {
    value: number;
    prevValue: number;
    growth: number | null;
    share: number;
    prevShare: number;
    rank: number | null;
    dutyRate: number | null;
    monthly: MonthPoint[];
  };
  partners: number;
  suppliers: PartnerStat[];
  ports: PortStat[];
  children: ProductRow[];
  tariff: TariffLine[] | null;
};

export const getProductView = cache(async (code: string, countryCode: string, locale: string): Promise<ProductView | null> => {
  const hs = getHs(code);
  if (!hs) return null;
  const country = countryByCode(countryCode)!;
  const latest = await latestMonth();
  const basis = ytdBasis(latest);
  const w = windowsFor(latest);
  const childLevel = hs.level < 6 ? ((hs.level + 2) as 4 | 6) : null;
  const [all, ports, childCur, childPrev, childWorld, tariff] = await Promise.all([
    partnersMonthly(hs.code, addMonths(latest, -35)),
    portsMonthly(country.code, hs.code, w.cur.first),
    childLevel ? levelYtd(country.code, childLevel, basis.cur) : Promise.resolve([]),
    childLevel ? levelYtd(country.code, childLevel, basis.prev) : Promise.resolve([]),
    childLevel ? levelYtd(WORLD, childLevel, basis.cur) : Promise.resolve([]),
    hs.level === 6 ? tariffLines(hs.code, latest.y) : Promise.resolve(null),
  ]);

  const cur = sumByPartner(all, w.cur.keys);
  const prev = sumByPartner(all, w.prev.keys);
  const world = cur.get(WORLD) ?? empty();
  const worldPrev = prev.get(WORLD) ?? empty();
  const mine = cur.get(country.code) ?? empty();
  const minePrev = prev.get(country.code) ?? empty();
  const ranked = ranking(cur);
  const prevBy = new Map(ranking(prev).map((r) => [r.code, r.totals]));

  const toStat = (r: (typeof ranked)[number]): PartnerStat => {
    const p = prevBy.get(r.code)?.gen ?? 0;
    return {
      country: countryByCode(r.code)!,
      rank: r.rank,
      value: r.totals.gen,
      prevValue: p,
      growth: growth(r.totals.gen, p),
      share: world.gen > 0 ? r.totals.gen / world.gen : 0,
      dutyRate: dutyRate(r.totals),
    };
  };
  const suppliers = ranked.slice(0, 10).map(toStat);
  const mineRanked = ranked.find((r) => r.code === country.code);
  if (mineRanked && mineRanked.rank > 10) suppliers.push(toStat(mineRanked));

  const childCodes = new Set(hsChildren(hs.code).map((c) => c.code));
  const children = childLevel
    ? productRows(childCur, childPrev, childWorld, locale, (c) => childCodes.has(c))
        .filter((r) => r.value > 0 || r.prevValue > 0)
        .sort((a, b) => b.value - a.value || b.prevValue - a.prevValue)
        .slice(0, 15)
    : [];

  return {
    hs,
    label: hsLabel(hs, locale),
    ancestors: hsAncestors(hs.code).map((a) => ({
      code: a.code,
      label: hsLabel(a, locale),
    })),
    latest,
    windows: w,
    basis,
    country,
    world: {
      value: world.gen,
      prevValue: worldPrev.gen,
      growth: growth(world.gen, worldPrev.gen),
      dutyRate: dutyRate(world),
      monthly: seriesFor(all, WORLD, monthsEnding(latest, 36)),
    },
    selected: {
      value: mine.gen,
      prevValue: minePrev.gen,
      growth: growth(mine.gen, minePrev.gen),
      share: world.gen > 0 ? mine.gen / world.gen : 0,
      prevShare: worldPrev.gen > 0 ? minePrev.gen / worldPrev.gen : 0,
      rank: mineRanked?.rank ?? null,
      dutyRate: dutyRate(mine),
      monthly: seriesFor(all, country.code, monthsEnding(latest, 36)),
    },
    partners: ranked.length,
    suppliers,
    ports: portStats(
      ports,
      ports.reduce((s, p) => s + p.gen, 0),
    ),
    children,
    tariff,
  };
});

/* Compact snapshot for prospect pages and lead emails */

export type ProductSnapshot = Pick<ProductView, "hs" | "label" | "latest" | "windows" | "country" | "partners"> & {
  value: number;
  growth: number | null;
  share: number;
  rank: number | null;
  worldValue: number;
  worldGrowth: number | null;
};

export async function getProductSnapshot(code: string, countryCode: string, locale: string): Promise<ProductSnapshot | null> {
  const hs = getHs(code);
  if (!hs) return null;
  const country = countryByCode(countryCode)!;
  const latest = await latestMonth();
  const w = windowsFor(latest);
  const all = await partnersMonthly(hs.code, addMonths(latest, -35));
  const cur = sumByPartner(all, w.cur.keys);
  const prev = sumByPartner(all, w.prev.keys);
  const world = cur.get(WORLD) ?? empty();
  const worldPrev = prev.get(WORLD) ?? empty();
  const mine = cur.get(country.code) ?? empty();
  const minePrev = prev.get(country.code) ?? empty();
  const ranked = ranking(cur);
  return {
    hs,
    label: hsLabel(hs, locale),
    latest,
    windows: w,
    country,
    partners: ranked.length,
    value: mine.gen,
    growth: growth(mine.gen, minePrev.gen),
    share: world.gen > 0 ? mine.gen / world.gen : 0,
    rank: ranked.find((r) => r.code === country.code)?.rank ?? null,
    worldValue: world.gen,
    worldGrowth: growth(world.gen, worldPrev.gen),
  };
}
