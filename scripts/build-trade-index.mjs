#!/usr/bin/env node
/**
 * Builds the static lookup data behind the trade-data tool:
 *   src/data/trade/hs-index.json   HS2/HS4/HS6 codes, English descriptions, 2025 US imports
 *                                  (all countries and from Türkiye), used for product search.
 *   src/data/trade/countries.json  Census country codes with ISO codes and 2025 US imports.
 *
 * Run once a year (or when you want fresher search ranking):
 *   CENSUS_API_KEY=... USITC_DATAWEB_TOKEN=... node scripts/build-trade-index.mjs [year]
 * The live pages never read these values as statistics; they query the APIs.
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const outDir = path.join(root, "src/data/trade");
const year = Number(process.argv[2] ?? new Date().getUTCFullYear() - 1);
const key = process.env.CENSUS_API_KEY;
const usitcToken = process.env.USITC_DATAWEB_TOKEN;
if (!key || !usitcToken) {
  console.error("Set CENSUS_API_KEY and USITC_DATAWEB_TOKEN.");
  process.exit(1);
}

const CENSUS = "https://api.census.gov/data/timeseries/intltrade/imports/hs";
const TURKIYE = "4890";

async function census(params) {
  const url = `${CENSUS}?${params}&key=${key}`;
  const res = await fetch(url);
  if (res.status === 204) return [];
  if (!res.ok) throw new Error(`Census ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const [header, ...rows] = await res.json();
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

/** Census descriptions are upper case; store them in sentence case. */
const ACRONYMS = ["U.S.", "TV", "TVS", "PVC", "LED", "LCD", "DNA", "CD", "DVD", "USB", "GPS", "MDF", "LNG", "LPG", "ABS", "HIV"];
function sentenceCase(s) {
  let out = s.trim().toLowerCase();
  out = out.charAt(0).toUpperCase() + out.slice(1);
  for (const a of ACRONYMS) out = out.replace(new RegExp(`\\b${a.toLowerCase().replace(/\./g, "\\.")}(?=\\W|$)`, "g"), a);
  return out.replace(/\s+/g, " ");
}

const period = `time=${year}-12`;
const [world2, world4, world6, tr] = await Promise.all([
  census(`get=I_COMMODITY,I_COMMODITY_LDESC,GEN_VAL_YR&CTY_CODE=-&COMM_LVL=HS2&${period}`),
  census(`get=I_COMMODITY,I_COMMODITY_LDESC,GEN_VAL_YR&CTY_CODE=-&COMM_LVL=HS4&${period}`),
  census(`get=I_COMMODITY,I_COMMODITY_LDESC,GEN_VAL_YR&CTY_CODE=-&COMM_LVL=HS6&${period}`),
  census(`get=I_COMMODITY,COMM_LVL,GEN_VAL_YR&CTY_CODE=${TURKIYE}&${period}`),
]);

const trValue = new Map(tr.filter((r) => r.COMM_LVL !== "HS10").map((r) => [r.I_COMMODITY, Number(r.GEN_VAL_YR)]));
const codes = [...world2, ...world4, ...world6]
  .filter((r) => /^\d{2}(\d{2}){0,2}$/.test(r.I_COMMODITY))
  .map((r) => [r.I_COMMODITY, sentenceCase(r.I_COMMODITY_LDESC), Number(r.GEN_VAL_YR), trValue.get(r.I_COMMODITY) ?? 0])
  .sort((a, b) => a[0].localeCompare(b[0]));

// Countries: Census codes (USITC uses the same) with ISO codes, minus regional groupings.
const usitc = await fetch("https://datawebws.usitc.gov/dataweb/api/v2/country/getAllCountries", {
  headers: { Authorization: `Bearer ${usitcToken}` },
}).then((r) => {
  if (!r.ok) throw new Error(`USITC ${r.status}`);
  return r.json();
});
const totals = await census(`get=CTY_CODE,CTY_NAME,GEN_VAL_YR&I_COMMODITY=-&${period}`);
const totalByCode = new Map(totals.map((r) => [r.CTY_CODE, Number(r.GEN_VAL_YR)]));
const countries = usitc.options
  .filter((o) => /^[1-9]\d{3}$/.test(o.value) && /^[A-Z]{2}$/.test(o.iso2 ?? ""))
  .map((o) => ({ code: o.value, iso2: o.iso2, name: o.name.replace(/\s+-\s+[A-Z]{2}\s+-\s+[A-Z]{3}$/, "").trim(), imports: totalByCode.get(o.value) ?? 0 }))
  .sort((a, b) => b.imports - a.imports);

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "hs-index.json"),
  JSON.stringify({ basisYear: year, source: "U.S. Census Bureau, International Trade API (imports/hs)", fields: ["code", "description", "usImports", "fromTurkiye"], codes }),
);
fs.writeFileSync(path.join(outDir, "countries.json"), JSON.stringify({ basisYear: year, countries }, null, 1));
console.log(`hs-index.json: ${codes.length} codes (${world2.length} HS2, ${world4.length} HS4, ${world6.length} HS6); countries.json: ${countries.length} countries`);
