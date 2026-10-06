import "server-only";
import { cache } from "react";
import { monthlyValues, portTotals } from "./census";
import { COUNTRIES, TURKIYE, countryByCode, type Country } from "./countries";
import { growth } from "./format";
import { getHs, hsAncestors, hsChildren, hsLabel, type HsCode } from "./hs";
import { addMonths, monthsEnding, parseYm, ymKey, ytdBasis, type Ym, type YtdBasis } from "./periods";
import { loadChapter, loadCountryHs4, loadMeta, loadPartners, loadPorts, loadWorldHs4, type Meta, type ProductEntry, type Six } from "./snapshot";

/**
 * Turns the monthly snapshot into what the trade pages show. "Last 12 months" (R12) is the latest
 * 12 published months; the comparison is the 12 months before. Values are general imports
 * (customs value, USD). The effective duty rate is calculated duty divided by the value of
 * imports for consumption. Product lists use the year-to-date basis (see ytdBasis).
 * Only a non-Türkiye partner's monthly line and product ports are fetched live (getLive*).
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
export const dutyRate = (t: Pick<Totals, "con" | "duty">) => (t.con > 0 ? t.duty / t.con : null);

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

async function context() {
  const meta = await loadMeta();
  const latest = parseYm(meta.latest);
  return { meta, latest, windows: windowsFor(latest), basis: ytdBasis(latest) };
}

export type MonthPoint = { month: string; value: number; duty: number | null };

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

function portStats(rows: { port: string; name: string; gen: number; ves: number }[]): PortStat[] {
  const total = rows.reduce((s, r) => s + r.gen, 0);
  return rows
    .filter((r) => r.gen > 0)
    .sort((a, b) => b.gen - a.gen)
    .slice(0, 8)
    .map((r) => ({
      port: r.port,
      name: r.name,
      value: r.gen,
      share: total > 0 ? r.gen / total : 0,
      vesselShare: r.gen > 0 ? r.ves / r.gen : null,
    }));
}

function productRow(code: string, value: number, prevValue: number, worldValue: number, locale: string): ProductRow | null {
  const hs = getHs(code);
  if (!hs) return null;
  return {
    code,
    label: hsLabel(hs, locale),
    chapter: locale === "tr" ? hs.chapter.nameTr : hs.chapter.nameEn,
    value,
    prevValue,
    change: value - prevValue,
    growth: growth(value, prevValue),
    share: worldValue > 0 ? value / worldValue : null,
  };
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
  const [{ meta, latest, windows, basis }, partners, hs4, world, ports] = await Promise.all([
    context(),
    loadPartners(),
    loadCountryHs4(country.code),
    loadWorldHs4(),
    loadPorts(),
  ]);

  // Series run over Meta.months (36): the last 12 are the current window, the 12 before the previous.
  const totals = (code: string, from: number): Totals => {
    const t = empty();
    const s = partners[code];
    if (!s) return t;
    for (let i = from; i < from + 12; i++) {
      t.gen += s[0][i];
      t.con += s[1][i];
      t.duty += s[2][i];
      t.air += s[3][i];
      t.ves += s[4][i];
    }
    return t;
  };
  const ranking = (from: number) =>
    Object.keys(partners)
      .filter((code) => COUNTRY_CODES.has(code))
      .map((code) => ({ code, gen: totals(code, from).gen }))
      .filter((r) => r.gen > 0)
      .sort((a, b) => b.gen - a.gen);
  const mine = totals(country.code, 24);
  const minePrev = totals(country.code, 12);
  const all = totals(WORLD, 24);
  const rankNow = ranking(24);
  const rankPrev = ranking(12);
  const series = partners[country.code];

  // Chapters 98 and 99 are US reporting provisions (returned goods, low-value estimates), not products.
  const worldBy = new Map(world.map(([code, ytd]) => [code, ytd]));
  const rows = hs4
    .filter(([code]) => !code.startsWith("98") && !code.startsWith("99"))
    .flatMap(([code, ytd, ytdPrev]) => productRow(code, ytd, ytdPrev, worldBy.get(code) ?? 0, locale) ?? []);

  const portsOf = ports.countries[country.code];
  return {
    latest,
    windows,
    basis,
    country,
    value: mine.gen,
    prevValue: minePrev.gen,
    growth: growth(mine.gen, minePrev.gen),
    share: all.gen > 0 ? mine.gen / all.gen : 0,
    rank: rankNow.findIndex((r) => r.code === country.code) + 1 || null,
    prevRank: rankPrev.findIndex((r) => r.code === country.code) + 1 || null,
    partners: rankNow.length,
    dutyRate: dutyRate(mine),
    prevDutyRate: dutyRate(minePrev),
    vesselShare: mine.gen > 0 ? mine.ves / mine.gen : null,
    airShare: mine.gen > 0 ? mine.air / mine.gen : null,
    monthly: meta.months.map((month, i) => ({
      month,
      value: series?.[0][i] ?? 0,
      duty: series && series[1][i] > 0 ? series[2][i] / series[1][i] : null,
    })),
    topProducts: [...rows].sort((a, b) => b.value - a.value).slice(0, 12),
    gainers: rows
      .filter((r) => r.change > 0)
      .sort((a, b) => b.change - a.change)
      .slice(0, 8),
    decliners: rows
      .filter((r) => r.change < 0)
      .sort((a, b) => a.change - b.change)
      .slice(0, 8),
    ports: portsOf
      ? portsOf.p.map(([port, gen, ves]) => ({
          port,
          name: ports.names[port] ?? port,
          value: gen,
          share: portsOf.t > 0 ? gen / portsOf.t : 0,
          vesselShare: gen > 0 ? ves / gen : null,
        }))
      : [],
  };
});

/* One HS code: HS6 entries are stored, HS4 and HS2 are sums of the HS6 codes under them */

const zero = (): Six => [0, 0, 0, 0, 0, 0];
function add(into: number[], from: readonly number[]) {
  for (let i = 0; i < into.length; i++) into[i] += from[i] ?? 0;
}

type Aggregate = {
  world: Six;
  partners: Map<number, Six>;
  monthlyWorld: number[];
  monthlyTr: number[];
  portsTr: Map<string, [number, number]>;
};

function aggregate(chapter: Record<string, ProductEntry>, prefix: string): Aggregate {
  const out: Aggregate = {
    world: zero(),
    partners: new Map(),
    monthlyWorld: new Array(36).fill(0),
    monthlyTr: new Array(36).fill(0),
    portsTr: new Map(),
  };
  for (const [code, e] of Object.entries(chapter)) {
    if (!code.startsWith(prefix)) continue;
    if (e.w) add(out.world, e.w);
    for (const row of e.c ?? []) {
      let p = out.partners.get(row[0]);
      if (!p) out.partners.set(row[0], (p = zero()));
      add(p, row.slice(1) as number[]);
    }
    if (e.mw) add(out.monthlyWorld, e.mw);
    if (e.mt) add(out.monthlyTr, e.mt);
    for (const [port, gen, ves] of e.p ?? []) {
      const p = out.portsTr.get(port) ?? [0, 0];
      p[0] += gen;
      p[1] += ves;
      out.portsTr.set(port, p);
    }
  }
  return out;
}

const shareOf = (part: number, whole: number) => (whole > 0 ? part / whole : 0);
const rateOf = (v: Six) => (v[4] > 0 ? v[5] / v[4] : null);

async function productCore(hs: HsCode, country: Country) {
  const [ctx, chapter] = await Promise.all([context(), loadChapter(hs.code.slice(0, 2))]);
  const agg = aggregate(chapter, hs.code);
  const index = new Map(ctx.meta.countries.map((c, i) => [c, i]));
  const ranked = [...agg.partners.entries()]
    .map(([i, v]) => ({ code: ctx.meta.countries[i], v }))
    .filter((r) => COUNTRY_CODES.has(r.code) && r.v[0] > 0)
    .sort((a, b) => b.v[0] - a.v[0])
    .map((r, i) => ({ ...r, rank: i + 1 }));
  const selectedIndex = index.get(country.code);
  const selected = (selectedIndex !== undefined && agg.partners.get(selectedIndex)) || zero();
  return { ...ctx, chapter, agg, ranked, selected, selectedIndex };
}

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
    /** null: not in the snapshot (partners other than Türkiye); load with getLiveMonthly. */
    monthly: MonthPoint[] | null;
  };
  partners: number;
  suppliers: PartnerStat[];
  /** null: not in the snapshot (partners other than Türkiye); load with getLivePorts. */
  ports: PortStat[] | null;
  children: ProductRow[];
};

const seriesOf = (meta: Meta, values: number[]): MonthPoint[] => meta.months.map((month, i) => ({ month, value: values[i] ?? 0, duty: null }));

export const getProductView = cache(async (code: string, countryCode: string, locale: string): Promise<ProductView | null> => {
  const hs = getHs(code);
  if (!hs) return null;
  const country = countryByCode(countryCode)!;
  const { meta, latest, windows, basis, chapter, agg, ranked, selected, selectedIndex } = await productCore(hs, country);
  const isTr = country.code === TURKIYE.code;

  const toStat = (r: (typeof ranked)[number]): PartnerStat => ({
    country: countryByCode(r.code)!,
    rank: r.rank,
    value: r.v[0],
    prevValue: r.v[1],
    growth: growth(r.v[0], r.v[1]),
    share: shareOf(r.v[0], agg.world[0]),
    dutyRate: rateOf(r.v),
  });
  const suppliers = ranked.slice(0, 10).map(toStat);
  const mineRanked = ranked.find((r) => r.code === country.code);
  if (mineRanked && mineRanked.rank > 10) suppliers.push(toStat(mineRanked));

  // Sub-products for the selected partner, year-to-date, with their share of all US imports.
  const childLevel = hs.level < 6 ? hs.level + 2 : null;
  let children: ProductRow[] = [];
  if (childLevel) {
    const kids = new Map<string, { value: number; prevValue: number; world: number }>();
    for (const [code6, e] of Object.entries(chapter)) {
      if (!code6.startsWith(hs.code)) continue;
      const key = code6.slice(0, childLevel);
      const k = kids.get(key) ?? { value: 0, prevValue: 0, world: 0 };
      if (e.w) k.world += e.w[2];
      const row = selectedIndex === undefined ? undefined : e.c?.find((r) => r[0] === selectedIndex);
      if (row) {
        k.value += row[3];
        k.prevValue += row[4];
      }
      kids.set(key, k);
    }
    const childCodes = new Set(hsChildren(hs.code).map((c) => c.code));
    children = [...kids.entries()]
      .filter(([c, k]) => childCodes.has(c) && (k.value > 0 || k.prevValue > 0))
      .flatMap(([c, k]) => productRow(c, k.value, k.prevValue, k.world, locale) ?? [])
      .sort((a, b) => b.value - a.value || b.prevValue - a.prevValue)
      .slice(0, 15);
  }

  // Türkiye's ports by product are in the snapshot unless that build could not get them.
  const ports =
    isTr && meta.trPorts !== false ? portStats([...agg.portsTr.entries()].map(([port, [gen, ves]]) => ({ port, name: "", gen, ves }))) : null;
  if (ports?.length) {
    const { names } = await loadPorts();
    for (const p of ports) p.name = names[p.port] ?? p.port;
  }

  return {
    hs,
    label: hsLabel(hs, locale),
    ancestors: hsAncestors(hs.code).map((a) => ({
      code: a.code,
      label: hsLabel(a, locale),
    })),
    latest,
    windows,
    basis,
    country,
    world: {
      value: agg.world[0],
      prevValue: agg.world[1],
      growth: growth(agg.world[0], agg.world[1]),
      dutyRate: rateOf(agg.world),
      monthly: seriesOf(meta, agg.monthlyWorld),
    },
    selected: {
      value: selected[0],
      prevValue: selected[1],
      growth: growth(selected[0], selected[1]),
      share: shareOf(selected[0], agg.world[0]),
      prevShare: shareOf(selected[1], agg.world[1]),
      rank: mineRanked?.rank ?? null,
      dutyRate: rateOf(selected),
      monthly: isTr ? seriesOf(meta, agg.monthlyTr) : null,
    },
    partners: ranked.length,
    suppliers,
    ports,
    children,
  };
});

/** Monthly line for a partner the snapshot does not hold (live Census query, cached for the month). */
export async function getLiveMonthly(code: string, countryCode: string): Promise<MonthPoint[]> {
  const meta = await loadMeta();
  const values = await monthlyValues(code, countryCode, parseYm(meta.months[0]), parseYm(meta.latest));
  return meta.months.map((month) => ({ month, value: values.get(month) ?? 0, duty: null }));
}

/** US ports for one product and partner, last 12 months (live Census query, cached for the month). */
export async function getLivePorts(code: string, countryCode: string): Promise<PortStat[]> {
  const { windows } = await context();
  return portStats(await portTotals(countryCode, code, windows.cur.first, windows.cur.last));
}

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
  const { latest, windows, agg, ranked, selected } = await productCore(hs, country);
  return {
    hs,
    label: hsLabel(hs, locale),
    latest,
    windows,
    country,
    partners: ranked.length,
    value: selected[0],
    growth: growth(selected[0], selected[1]),
    share: shareOf(selected[0], agg.world[0]),
    rank: ranked.find((r) => r.code === country.code)?.rank ?? null,
    worldValue: agg.world[0],
    worldGrowth: growth(agg.world[0], agg.world[1]),
  };
}
