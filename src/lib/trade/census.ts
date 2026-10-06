import "server-only";
import { after } from "next/server";
import { ymKey, type Ym } from "./periods";

/**
 * Live U.S. Census Bureau International Trade API calls (imports), for the few views the monthly
 * snapshot does not hold: a non-Türkiye partner's monthly line and US ports for one product.
 * Every query names a closed month range, so a response never changes and is cached for 30 days.
 * The key stays on the server. Docs: https://www.census.gov/data/developers/data-sets/international-trade.html
 */
const BASE = "https://api.census.gov/data/timeseries/intltrade/imports";
const MONTH = 60 * 60 * 24 * 30;

export class TradeDataError extends Error {
  constructor(public code: "not_configured" | "upstream" | "timeout") {
    super(`Trade data unavailable: ${code}`);
  }
}

export const censusConfigured = () => Boolean(process.env.CENSUS_API_KEY);

type Row = Record<string, string>;

/** How long a page view waits. A slower answer still finishes in the background and lands in the cache. */
const WAIT_MS = 30_000;

async function query(dataset: "hs" | "porths", params: Record<string, string>): Promise<Row[]> {
  const key = process.env.CENSUS_API_KEY;
  if (!key) throw new TradeDataError("not_configured");
  const search = new URLSearchParams({ ...params, key });
  const pending = fetch(`${BASE}/${dataset}?${search}`, {
    next: { revalidate: MONTH, tags: ["trade-data"] },
    signal: AbortSignal.timeout(240_000),
  });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const waited = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), WAIT_MS);
  });
  let res: Response | null;
  try {
    res = await Promise.race([pending, waited]);
  } catch (error) {
    throw new TradeDataError(error instanceof Error && error.name === "TimeoutError" ? "timeout" : "upstream");
  } finally {
    clearTimeout(timer);
  }
  if (!res) {
    // Too slow for this visitor: keep the request alive after the response so the next one is instant.
    const settled = pending.then((r) => r.text()).catch(() => undefined);
    after(() => settled);
    throw new TradeDataError("timeout");
  }
  if (res.status === 204) return []; // no trade for this filter
  if (!res.ok) throw new TradeDataError("upstream");
  const text = await res.text();
  if (!text) return [];
  try {
    const [header, ...rows] = JSON.parse(text) as string[][];
    return rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
  } catch {
    throw new TradeDataError("upstream"); // the API answers some failures with a plain-text page
  }
}

const num = (v: string | undefined) => (v ? Number(v) || 0 : 0);
const range = (from: Ym, to: Ym) => `from ${ymKey(from)} to ${ymKey(to)}`;

/** Monthly value of one product ("-" = all goods) from one partner, keyed by "YYYY-MM". */
export async function monthlyValues(hs: string, cty: string, from: Ym, to: Ym): Promise<Map<string, number>> {
  const rows = await query("hs", { get: "GEN_VAL_MO", I_COMMODITY: hs, CTY_CODE: cty, time: range(from, to) });
  return new Map(rows.map((r) => [r.time, num(r.GEN_VAL_MO)]));
}

export type PortRow = { port: string; name: string; gen: number; ves: number };

/** Imports of one product from one partner by US port of entry, summed over the months given. */
export async function portTotals(cty: string, hs: string, from: Ym, to: Ym): Promise<PortRow[]> {
  const rows = await query("porths", {
    get: "PORT,PORT_NAME,GEN_VAL_MO,VES_VAL_MO",
    CTY_CODE: cty,
    I_COMMODITY: hs,
    time: range(from, to),
  });
  const byPort = new Map<string, PortRow>();
  for (const r of rows) {
    if (!r.PORT || r.PORT === "-") continue;
    const p = byPort.get(r.PORT) ?? { port: r.PORT, name: r.PORT_NAME, gen: 0, ves: 0 };
    p.gen += num(r.GEN_VAL_MO);
    p.ves += num(r.VES_VAL_MO);
    byPort.set(r.PORT, p);
  }
  return [...byPort.values()];
}
