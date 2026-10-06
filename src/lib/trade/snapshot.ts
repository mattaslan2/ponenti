import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * The monthly trade data snapshot (src/data/trade/snapshot/), built from the Census API by
 * scripts/build-trade-snapshot.mjs and refreshed by a GitHub Action after each release.
 * Files are read once per server instance and kept in memory; they never change within a deployment.
 * next.config.ts lists the folder in outputFileTracingIncludes so it ships with the functions.
 */
const DIR = path.join(process.cwd(), "src/data/trade/snapshot");

/** Last 12 months, the 12 before, year-to-date (site basis), the same period a year earlier,
 *  value of imports for consumption (last 12 months) and calculated duty (last 12 months). */
export type Six = [r12: number, r12Prev: number, ytd: number, ytdPrev: number, con12: number, duty12: number];

export type ProductEntry = {
  /** All partners. */
  w?: Six;
  /** One row per partner: index into Meta.countries, then the six values. */
  c?: [number, ...Six][];
  /** Monthly value, all partners, oldest first (Meta.months). */
  mw?: number[];
  /** Monthly value from Türkiye. */
  mt?: number[];
  /** Türkiye by US port: [port code, value last 12 months, of which by vessel]. */
  p?: [string, number, number][];
};

export type Meta = {
  version: number;
  latest: string;
  generated: string;
  source: string;
  months: string[];
  basis: { kind: "ytd" | "year"; cur: string; prev: string };
  /** Census country codes; ProductEntry.c rows point here. */
  countries: string[];
  /** false when the build could not get Türkiye's ports by product (pages then load them live). */
  trPorts?: boolean;
};

/** All goods, monthly (Meta.months): general value, consumption value, duty, air value, vessel value. */
export type PartnerSeries = [gen: number[], con: number[], duty: number[], air: number[], ves: number[]];

export type PortsFile = {
  names: Record<string, string>;
  /** Per partner, all goods, last 12 months: total over all ports and the top 8 ports. */
  countries: Record<string, { t: number; p: [string, number, number][] }>;
};

const files = new Map<string, Promise<unknown>>();

function load<T>(file: string, fallback?: T): Promise<T> {
  let pending = files.get(file) as Promise<T> | undefined;
  if (!pending) {
    pending = readFile(path.join(DIR, file), "utf8").then(
      (text) => JSON.parse(text) as T,
      (error: NodeJS.ErrnoException) => {
        // A chapter or partner with no trade has no file.
        if (error.code === "ENOENT" && fallback !== undefined) return fallback;
        files.delete(file);
        throw error;
      },
    );
    files.set(file, pending);
  }
  return pending;
}

export const loadMeta = () => load<Meta>("meta.json");
export const loadPartners = () => load<Record<string, PartnerSeries>>("partners.json");
export const loadChapter = (chapter: string) => load<Record<string, ProductEntry>>(`products/${chapter}.json`, {});
export const loadCountryHs4 = (code: string) => load<[string, number, number][]>(`countries/${code}.json`, []);
export const loadWorldHs4 = () => load<[string, number][]>("world.json");
export const loadPorts = () => load<PortsFile>("ports.json");
