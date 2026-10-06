#!/usr/bin/env node
/**
 * Builds the trade data snapshot the trade pages read (src/data/trade/snapshot/), so that
 * no page view waits on the Census API (its answers take anywhere from 1 to 80+ seconds).
 *
 *   CENSUS_API_KEY=... node scripts/build-trade-snapshot.mjs [--force] [--cache <dir>]
 *
 * Run by .github/workflows/trade-snapshot.yml. Exits without changes when the latest Census
 * month is already in the snapshot (unless --force). About 1,200 queries, 15 to 60 minutes.
 * --cache keeps raw responses on disk so an interrupted local run can resume.
 *
 * What it writes (all values are US general imports in dollars unless noted):
 *   meta.json            latest month, the 36 months shown, comparison basis, country index
 *   partners.json        all goods, monthly, every partner: value, consumption value, duty, air, vessel
 *   products/<ch>.json   per HS6 code in chapter <ch>:
 *                          w  world  [r12, r12Prev, ytd, ytdPrev, con12, duty12]
 *                          c  partners [[countryIndex, ...same six]]
 *                          mw world monthly value (36), mt Türkiye monthly value (36)
 *                          p  Türkiye ports [[port, value12, vessel12]]
 *   countries/<code>.json  HS4 rows [[hs4, ytd, ytdPrev]] for one partner (overview lists)
 *   world.json           HS4 rows [[hs4, ytd]] for all partners
 *   ports.json           port names, and the top 8 ports per partner (all goods, last 12 months)
 * r12 = last 12 months, r12Prev = the 12 before. ytd follows the site's basis: January to the
 * latest month (from April on) or the last full year (January to March).
 */
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const outDir = path.join(root, "src/data/trade/snapshot");
const args = process.argv.slice(2);
const force = args.includes("--force");
const cacheDir = args.includes("--cache") ? path.resolve(args[args.indexOf("--cache") + 1]) : null;
const key = process.env.CENSUS_API_KEY;
if (!key) {
  console.error("Set CENSUS_API_KEY.");
  process.exit(1);
}

const BASE = "https://api.census.gov/data/timeseries/intltrade/imports";
const TURKIYE = "4890";
const WORLD = "-";
const CONCURRENCY = Number(process.env.SNAPSHOT_CONCURRENCY || 6);
const TIMEOUT_MS = 240_000;
const BACKOFF_S = [0, 5, 20, 60, 120, 240];

/* Months */
const ymKey = ({ y, m }) => `${y}-${String(m).padStart(2, "0")}`;
const parseYm = (s) => {
  const [y, m] = s.split("-").map(Number);
  return { y, m };
};
const addMonths = ({ y, m }, n) => {
  const i = y * 12 + (m - 1) + n;
  return { y: Math.floor(i / 12), m: (i % 12) + 1 };
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Census access: retries, timeouts, optional on-disk cache */
let finished = 0;
let total = 0;
const t0 = Date.now();
const elapsed = () => `${Math.round((Date.now() - t0) / 1000)}s`;

function parse(text) {
  if (!text) return [];
  const [header, ...rows] = JSON.parse(text);
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

async function census(dataset, params, label, attempts = BACKOFF_S.length) {
  const sp = new URLSearchParams(params);
  const id = `${dataset}?${sp}`;
  const cacheFile = cacheDir && path.join(cacheDir, `${createHash("sha1").update(id).digest("hex")}.json`);
  if (cacheFile) {
    try {
      const rows = parse(await fs.readFile(cacheFile, "utf8"));
      tick();
      return rows;
    } catch {
      /* not cached yet */
    }
  }
  sp.set("key", key);
  const url = `${BASE}/${dataset}?${sp}`;
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      const text = res.status === 204 ? "" : await res.text();
      if (res.status !== 200 && res.status !== 204) throw new Error(`HTTP ${res.status} ${text.slice(0, 100)}`);
      let rows;
      try {
        rows = parse(text);
      } catch {
        throw new Error(`not JSON: ${text.slice(0, 100).replace(/\s+/g, " ")}`);
      }
      if (cacheFile) await fs.writeFile(cacheFile, text);
      tick();
      return rows;
    } catch (error) {
      if (attempt >= attempts) throw new Error(`${label} failed after ${attempt} attempts: ${error.message}`);
      const wait = BACKOFF_S[attempt];
      console.warn(`  retry ${attempt} in ${wait}s, ${label}: ${String(error.message).slice(0, 120)}`);
      await sleep(wait * 1000);
    }
  }
}

function tick() {
  finished++;
  if (finished % 25 === 0 || finished === total) console.log(`  ${finished}/${total} queries, ${elapsed()}`);
}

/** Runs jobs with limited concurrency; any failure aborts the build. */
async function pool(jobs, size = CONCURRENCY) {
  const results = new Array(jobs.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, jobs.length) }, async () => {
      while (next < jobs.length) {
        const i = next++;
        results[i] = await jobs[i]();
      }
    }),
  );
  return results;
}

const num = (v) => (v ? Number(v) || 0 : 0);

/* 1. Latest published month; stop early when the snapshot already has it */
total = 2; // this probe and the partners query; the rest are counted below
const now = new Date();
const probeFrom = addMonths({ y: now.getUTCFullYear(), m: now.getUTCMonth() + 1 }, -9);
const probe = await census("hs", { get: "GEN_VAL_MO", CTY_CODE: WORLD, I_COMMODITY: WORLD, time: `from ${ymKey(probeFrom)}` }, "latest month");
const published = probe
  .filter((r) => num(r.GEN_VAL_MO) > 0)
  .map((r) => r.time)
  .sort();
if (!published.length) throw new Error("Census returned no recent months");
const latestKey = published[published.length - 1];
const latest = parseYm(latestKey);

let previous = null;
try {
  previous = JSON.parse(await fs.readFile(path.join(outDir, "meta.json"), "utf8")).latest;
} catch {
  /* first build */
}
if (previous === latestKey && !force) {
  console.log(`Snapshot already has ${latestKey}; nothing to do.`);
  process.exit(0);
}
console.log(`Building snapshot for ${latestKey} (previous: ${previous ?? "none"})`);

/* Periods: YTD at five points gives the last 12 months, the 12 before, and both YTD bases */
const P = [
  latest, // g0
  { y: latest.y - 1, m: 12 }, // g1: previous full year
  addMonths(latest, -12), // g2
  { y: latest.y - 2, m: 12 }, // g3
  addMonths(latest, -24), // g4
].map(ymKey);
const times = [...new Set(P)];
const slotsFor = (t) => P.flatMap((p, i) => (p === t ? [i] : []));
const basis = latest.m >= 4 ? { kind: "ytd", cur: 0, prev: 2 } : { kind: "year", cur: 1, prev: 3 };
const months = Array.from({ length: 36 }, (_, i) => ymKey(addMonths(latest, i - 35)));

/* 2. All goods, monthly, every partner (overview headline, trend, duty, transport) */
const countriesFile = JSON.parse(await fs.readFile(path.join(root, "src/data/trade/countries.json"), "utf8"));
const known = new Set(countriesFile.countries.map((c) => c.code));
const partnersRows = await census(
  "hs",
  { get: "CTY_CODE,GEN_VAL_MO,CON_VAL_MO,CAL_DUT_MO,AIR_VAL_MO,VES_VAL_MO", I_COMMODITY: WORLD, time: `from ${months[0]} to ${latestKey}` },
  "partners monthly",
);
const monthIndex = new Map(months.map((m, i) => [m, i]));
const partners = new Map();
for (const r of partnersRows) {
  if (r.CTY_CODE !== WORLD && !known.has(r.CTY_CODE)) continue; // drop regional groupings
  const i = monthIndex.get(r.time);
  if (i === undefined) continue;
  let p = partners.get(r.CTY_CODE);
  if (!p) partners.set(r.CTY_CODE, (p = Array.from({ length: 5 }, () => new Array(36).fill(0))));
  p[0][i] = num(r.GEN_VAL_MO);
  p[1][i] = num(r.CON_VAL_MO);
  p[2][i] = num(r.CAL_DUT_MO);
  p[3][i] = num(r.AIR_VAL_MO);
  p[4][i] = num(r.VES_VAL_MO);
}
// Partners with any trade in the last 24 months get product detail.
const active = [...partners.entries()]
  .filter(([code, p]) => code !== WORLD && p[0].slice(12).some((v) => v > 0))
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([code]) => code);
const countryIndex = new Map(active.map((c, i) => [c, i]));
console.log(`${active.length} partners with trade in the last 24 months`);

/* 3. Queries */
const cube = new Map(); // hs6 -> Map(country -> [g0..g4, c0, c1, c2, d0, d1, d2])
const monthlyWorld = new Map(); // hs6 -> number[36]
const monthlyTr = new Map();
const portNames = new Map();
const portsByCountry = new Map(); // country -> Map(port -> [gen12, ves12])
const portsTr = new Map(); // hs6 -> Map(port -> [gen12, ves12])
let trPortsOk = true;

const jobs = [];
for (const cty of [WORLD, ...active]) {
  for (const t of times) {
    jobs.push(async () => {
      const rows = await census(
        "hs",
        { get: "I_COMMODITY,GEN_VAL_YR,CON_VAL_YR,CAL_DUT_YR", CTY_CODE: cty, COMM_LVL: "HS6", time: t },
        `HS6 ${cty} ${t}`,
      );
      const slots = slotsFor(t);
      for (const r of rows) {
        const code = r.I_COMMODITY;
        if (!/^\d{6}$/.test(code)) continue;
        let byCty = cube.get(code);
        if (!byCty) cube.set(code, (byCty = new Map()));
        let v = byCty.get(cty);
        if (!v) byCty.set(cty, (v = new Array(11).fill(0)));
        for (const s of slots) {
          v[s] = num(r.GEN_VAL_YR);
          if (s <= 2) {
            v[5 + s] = num(r.CON_VAL_YR);
            v[8 + s] = num(r.CAL_DUT_YR);
          }
        }
      }
    });
  }
}
for (const [cty, target] of [
  [WORLD, monthlyWorld],
  [TURKIYE, monthlyTr],
]) {
  months.forEach((month, i) => {
    jobs.push(async () => {
      const rows = await census("hs", { get: "I_COMMODITY,GEN_VAL_MO", CTY_CODE: cty, COMM_LVL: "HS6", time: month }, `monthly ${cty} ${month}`);
      for (const r of rows) {
        if (!/^\d{6}$/.test(r.I_COMMODITY)) continue;
        let a = target.get(r.I_COMMODITY);
        if (!a) target.set(r.I_COMMODITY, (a = new Array(36).fill(0)));
        a[i] = num(r.GEN_VAL_MO);
      }
    });
  });
}
// Ports: last 12 months = YTD(g0) + YTD(g1) - YTD(g2), for value and vessel value.
const portSign = (t) => slotsFor(t).reduce((s, slot) => s + (slot === 0 || slot === 1 ? 1 : slot === 2 ? -1 : 0), 0);
for (const t of [...new Set(P.slice(0, 3))]) {
  const sign = portSign(t);
  if (!sign) continue;
  jobs.push(async () => {
    const rows = await census("porths", { get: "PORT,PORT_NAME,CTY_CODE,GEN_VAL_YR,VES_VAL_YR", I_COMMODITY: WORLD, time: t }, `ports all ${t}`);
    for (const r of rows) {
      if (!r.PORT || r.PORT === "-" || !known.has(r.CTY_CODE)) continue;
      if (r.PORT_NAME) portNames.set(r.PORT, r.PORT_NAME);
      let m = portsByCountry.get(r.CTY_CODE);
      if (!m) portsByCountry.set(r.CTY_CODE, (m = new Map()));
      const v = m.get(r.PORT) ?? [0, 0];
      v[0] += sign * num(r.GEN_VAL_YR);
      v[1] += sign * num(r.VES_VAL_YR);
      m.set(r.PORT, v);
    }
  });
  jobs.push(async () => {
    // Optional: the heaviest query, and the one the API most often rejects. Without it, Türkiye's
    // product pages load their ports live like other partners (meta.trPorts = false).
    let rows;
    try {
      rows = await census(
        "porths",
        { get: "PORT,PORT_NAME,I_COMMODITY,GEN_VAL_YR,VES_VAL_YR", CTY_CODE: TURKIYE, COMM_LVL: "HS6", time: t },
        `ports TR HS6 ${t}`,
        4,
      );
    } catch (error) {
      trPortsOk = false;
      tick();
      console.warn(`  skipping Türkiye product ports: ${error.message.slice(0, 160)}`);
      return;
    }
    for (const r of rows) {
      if (!r.PORT || r.PORT === "-" || !/^\d{6}$/.test(r.I_COMMODITY)) continue;
      if (r.PORT_NAME) portNames.set(r.PORT, r.PORT_NAME);
      let m = portsTr.get(r.I_COMMODITY);
      if (!m) portsTr.set(r.I_COMMODITY, (m = new Map()));
      const v = m.get(r.PORT) ?? [0, 0];
      v[0] += sign * num(r.GEN_VAL_YR);
      v[1] += sign * num(r.VES_VAL_YR);
      m.set(r.PORT, v);
    }
  });
}

total += jobs.length;
console.log(`${jobs.length} queries to run, ${CONCURRENCY} at a time`);
// Slow port queries first, so they overlap with the many small ones.
await pool([...jobs.slice(-6), ...jobs.slice(0, -6)]);

/* 4. Assemble */
const clamp = (v) => (v > 0 ? Math.round(v) : 0);
function six(v) {
  return [
    clamp(v[0] + v[1] - v[2]), // r12
    clamp(v[2] + v[3] - v[4]), // r12Prev
    clamp(v[basis.cur]), // ytd
    clamp(v[basis.prev]), // ytdPrev
    clamp(v[5] + v[6] - v[7]), // con12
    clamp(v[8] + v[9] - v[10]), // duty12
  ];
}
const any = (a) => a.some((x) => x > 0);

const chapters = new Map();
const countryHs4 = new Map(); // country -> Map(hs4 -> [ytd, ytdPrev])
const worldHs4 = new Map();
let worldSum6 = 0;
let trSum6 = 0;
for (const [code, byCty] of [...cube.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  const ch = code.slice(0, 2);
  const hs4 = code.slice(0, 4);
  const entry = {};
  const w = byCty.get(WORLD);
  if (w) {
    entry.w = six(w);
    worldSum6 += entry.w[0];
    const h = worldHs4.get(hs4) ?? [0];
    h[0] += entry.w[2];
    worldHs4.set(hs4, h);
  }
  const rows = [];
  for (const [cty, v] of byCty) {
    if (cty === WORLD) continue;
    const s = six(v);
    if (!any(s)) continue;
    rows.push([countryIndex.get(cty), ...s]);
    if (cty === TURKIYE) trSum6 += s[0];
    let m = countryHs4.get(cty);
    if (!m) countryHs4.set(cty, (m = new Map()));
    const h = m.get(hs4) ?? [0, 0];
    h[0] += s[2];
    h[1] += s[3];
    m.set(hs4, h);
  }
  if (rows.length) entry.c = rows.sort((a, b) => b[1] - a[1]);
  const mw = monthlyWorld.get(code);
  if (mw && any(mw)) entry.mw = mw.map(clamp);
  const mt = monthlyTr.get(code);
  if (mt && any(mt)) entry.mt = mt.map(clamp);
  const pt = trPortsOk && portsTr.get(code);
  if (pt) {
    const ports = [...pt.entries()].map(([port, [g, v]]) => [port, clamp(g), clamp(v)]).filter((p) => p[1] > 0);
    if (ports.length) entry.p = ports.sort((a, b) => b[1] - a[1]);
  }
  if (!entry.w && !entry.c) continue;
  if (!chapters.has(ch)) chapters.set(ch, {});
  chapters.get(ch)[code] = entry;
}

/* 5. Sanity checks: product detail must add up to the all-goods totals */
const sum12 = (code) => {
  const p = partners.get(code);
  return p ? p[0].slice(24).reduce((s, v) => s + v, 0) : 0;
};
for (const [label, detail, overall] of [
  ["world", worldSum6, sum12(WORLD)],
  ["Türkiye", trSum6, sum12(TURKIYE)],
]) {
  const gap = overall ? Math.abs(detail - overall) / overall : 1;
  console.log(`check ${label}: HS6 sum ${(detail / 1e9).toFixed(3)}B vs all goods ${(overall / 1e9).toFixed(3)}B (${(gap * 100).toFixed(3)}%)`);
  if (gap > 0.005) throw new Error(`HS6 detail does not add up for ${label}; snapshot not written`);
}
if (chapters.size < 90) throw new Error(`only ${chapters.size} chapters; snapshot not written`);

/* 6. Write to a temporary folder, then swap it in */
const tmp = `${outDir}.tmp`;
await fs.rm(tmp, { recursive: true, force: true });
await fs.mkdir(path.join(tmp, "products"), { recursive: true });
await fs.mkdir(path.join(tmp, "countries"), { recursive: true });
const write = (file, data) => fs.writeFile(path.join(tmp, file), JSON.stringify(data));

await write("meta.json", {
  version: 1,
  latest: latestKey,
  generated: new Date().toISOString(),
  source: "U.S. Census Bureau, International Trade API (timeseries/intltrade/imports)",
  months,
  basis: { kind: basis.kind, cur: P[basis.cur], prev: P[basis.prev] },
  countries: active,
  trPorts: trPortsOk,
});
await write("partners.json", Object.fromEntries([...partners.entries()].filter(([c]) => c === WORLD || countryIndex.has(c))));
for (const [ch, data] of chapters) await write(`products/${ch}.json`, data);
for (const [cty, m] of countryHs4) {
  const rows = [...m.entries()]
    .filter(([, v]) => any(v))
    .sort((a, b) => b[1][0] - a[1][0])
    .map(([hs4, v]) => [hs4, ...v]);
  await write(`countries/${cty}.json`, rows);
}
await write(
  "world.json",
  [...worldHs4.entries()].sort((a, b) => b[1][0] - a[1][0]).map(([hs4, v]) => [hs4, ...v]),
);
await write("ports.json", {
  names: Object.fromEntries([...portNames.entries()].sort()),
  countries: Object.fromEntries(
    [...portsByCountry.entries()].map(([cty, m]) => {
      const ports = [...m.entries()]
        .map(([port, [g, v]]) => [port, clamp(g), clamp(v)])
        .filter((p) => p[1] > 0)
        .sort((a, b) => b[1] - a[1]);
      return [cty, { t: ports.reduce((s, p) => s + p[1], 0), p: ports.slice(0, 8) }];
    }),
  ),
});

const old = `${outDir}.old`;
await fs.rm(old, { recursive: true, force: true });
await fs.rename(outDir, old).catch(() => {});
await fs.rename(tmp, outDir);
await fs.rm(old, { recursive: true, force: true });
console.log(`Snapshot ${latestKey} written: ${chapters.size} chapters, ${cube.size} HS6 codes, ${active.length} partners, ${elapsed()}`);
