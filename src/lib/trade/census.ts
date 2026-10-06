import "server-only";
import { addMonths, parseYm, ymKey, type Ym } from "./periods";

/**
 * U.S. Census Bureau International Trade API (imports). The key stays on the
 * server; every response is cached for a day (the data changes once a month).
 * Docs: https://www.census.gov/data/developers/data-sets/international-trade.html
 */
const BASE = "https://api.census.gov/data/timeseries/intltrade/imports";
const DAY = 60 * 60 * 24;

export class TradeDataError extends Error {
  constructor(public code: "not_configured" | "upstream" | "timeout") {
    super(`Trade data unavailable: ${code}`);
  }
}

export const censusConfigured = () => Boolean(process.env.CENSUS_API_KEY);

type Row = Record<string, string>;

async function query(dataset: "hs" | "porths", params: Record<string, string>, revalidate = DAY): Promise<Row[]> {
  const key = process.env.CENSUS_API_KEY;
  if (!key) throw new TradeDataError("not_configured");
  const search = new URLSearchParams({ ...params, key });
  let res: Response;
  try {
    res = await fetch(`${BASE}/${dataset}?${search}`, {
      next: { revalidate, tags: ["trade-data"] },
      signal: AbortSignal.timeout(25_000),
    });
  } catch (error) {
    throw new TradeDataError(error instanceof Error && error.name === "TimeoutError" ? "timeout" : "upstream");
  }
  if (res.status === 204) return []; // no trade for this filter
  if (!res.ok) throw new TradeDataError("upstream");
  const text = await res.text();
  if (!text) return [];
  const [header, ...rows] = JSON.parse(text) as string[][];
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

const num = (v: string | undefined) => (v ? Number(v) || 0 : 0);

/** Latest month with published data (the Census releases about five weeks after month end). */
export async function latestMonth(): Promise<Ym> {
  const now = new Date();
  const from = addMonths({ y: now.getUTCFullYear(), m: now.getUTCMonth() + 1 }, -9);
  const rows = await query(
    "hs",
    {
      get: "GEN_VAL_MO",
      CTY_CODE: "-",
      I_COMMODITY: "-",
      time: `from ${ymKey(from)}`,
    },
    6 * 60 * 60,
  );
  const months = rows
    .filter((r) => num(r.GEN_VAL_MO) > 0)
    .map((r) => r.time)
    .sort();
  if (!months.length) throw new TradeDataError("upstream");
  return parseYm(months[months.length - 1]);
}

export type MonthlyRow = {
  cty: string;
  month: string;
  gen: number;
  con: number;
  duty: number;
  air: number;
  ves: number;
};

/** Monthly imports of one product ("-" = all goods) from every partner, from `from` to the latest month. */
export async function partnersMonthly(hs: string, from: Ym): Promise<MonthlyRow[]> {
  const rows = await query("hs", {
    get: "CTY_CODE,GEN_VAL_MO,CON_VAL_MO,CAL_DUT_MO,AIR_VAL_MO,VES_VAL_MO",
    I_COMMODITY: hs,
    time: `from ${ymKey(from)}`,
  });
  return rows.map((r) => ({
    cty: r.CTY_CODE,
    month: r.time,
    gen: num(r.GEN_VAL_MO),
    con: num(r.CON_VAL_MO),
    duty: num(r.CAL_DUT_MO),
    air: num(r.AIR_VAL_MO),
    ves: num(r.VES_VAL_MO),
  }));
}

export type YtdRow = { code: string; gen: number; con: number; duty: number };

/** Year-to-date imports at one HS level (HS2/HS4/HS6) from one partner ("-" = all partners). */
export async function levelYtd(cty: string, level: 2 | 4 | 6, at: Ym): Promise<YtdRow[]> {
  const rows = await query("hs", {
    get: "I_COMMODITY,GEN_VAL_YR,CON_VAL_YR,CAL_DUT_YR",
    CTY_CODE: cty,
    COMM_LVL: `HS${level}`,
    time: ymKey(at),
  });
  return rows.map((r) => ({
    code: r.I_COMMODITY,
    gen: num(r.GEN_VAL_YR),
    con: num(r.CON_VAL_YR),
    duty: num(r.CAL_DUT_YR),
  }));
}

export type PortRow = {
  port: string;
  name: string;
  month: string;
  gen: number;
  ves: number;
  air: number;
};

/** Monthly imports by US port of entry for one partner and product ("-" = all goods). */
export async function portsMonthly(cty: string, hs: string, from: Ym): Promise<PortRow[]> {
  const rows = await query("porths", {
    get: "PORT,PORT_NAME,GEN_VAL_MO,VES_VAL_MO,AIR_VAL_MO",
    CTY_CODE: cty,
    I_COMMODITY: hs,
    time: `from ${ymKey(from)}`,
  });
  return rows
    .filter((r) => r.PORT && r.PORT !== "-")
    .map((r) => ({
      port: r.PORT,
      name: r.PORT_NAME,
      month: r.time,
      gen: num(r.GEN_VAL_MO),
      ves: num(r.VES_VAL_MO),
      air: num(r.AIR_VAL_MO),
    }));
}
