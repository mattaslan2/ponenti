// Unit checks for the support estimator math and the TCMB rate parser.
// Run: npm run test:support  (Node 22.18+ runs the TypeScript sources directly)
import assert from "node:assert/strict";
import { estimateSupport, SUPPORT_EXAMPLE, SUPPORT_RULES } from "../src/lib/support.ts";
import { parseTcmbXml } from "../src/lib/tcmb.ts";

const FX = 49.2471;
const results = [];
const check = (name, fn) => {
  try {
    fn();
    results.push({ name, pass: true });
  } catch (error) {
    results.push({ name, pass: false, extra: error.message.split("\n")[0] });
  }
};
const line = (estimate, key) => estimate.lines.find((l) => l.line === key);
const input = (overrides = {}) => ({ ...SUPPORT_EXAMPLE, ...overrides, costs: { ...SUPPORT_EXAMPLE.costs, ...(overrides.costs ?? {}) } });

check("example: each line is cost x fx x rate, rounded", () => {
  const e = estimateSupport(input(), FX);
  assert.equal(line(e, "rent").base.tl, Math.round(60_000 * FX * 0.5));
  assert.equal(line(e, "rent").target.tl, Math.round(60_000 * FX * 0.7));
  assert.equal(line(e, "fulfillment").target.tl, Math.round(36_000 * FX * 0.7));
  assert.equal(line(e, "trademark").target.tl, Math.round(4_000 * FX * 0.7));
  assert.equal(line(e, "promotion").base.tl, Math.round(30_000 * FX * 0.5));
});

check("documents stay at 50% in the target column", () => {
  const e = estimateSupport(input(), FX);
  assert.equal(line(e, "documents").base.tl, line(e, "documents").target.tl);
  assert.equal(line(e, "documents").target.rate, 0.5);
});

check("totals are the sum of the lines; USD is TL / fx", () => {
  const e = estimateSupport(input(), FX);
  for (const which of ["base", "target"]) {
    const tl = e.lines.reduce((acc, l) => acc + l[which].tl, 0);
    assert.equal(e.total[which].tl, tl);
    assert.equal(e.total[which].usd, Math.round(tl / FX));
  }
});

check("rent above the 2026 cap is held at 9,862,972 TL", () => {
  const e = estimateSupport(input({ costs: { rent: 500_000 } }), FX);
  assert.equal(line(e, "rent").base.tl, SUPPORT_RULES.lines.rent.capTl);
  assert.deepEqual(line(e, "rent").base.limits, ["cap"]);
});

check("rent and promotion stop at half of US exports", () => {
  const e = estimateSupport(input({ usExportsUsd: 40_000 }), FX);
  const ceiling = Math.round(40_000 * FX * 0.5);
  assert.equal(line(e, "rent").base.tl, ceiling);
  assert.ok(line(e, "rent").base.limits.includes("exports"));
  assert.equal(line(e, "promotion").target.tl, ceiling);
  // Fulfillment, documents and trademark have no export ceiling.
  assert.equal(line(e, "trademark").target.limits.length, 0);
});

check("fulfillment counts costs up to 10% of US online sales", () => {
  const e = estimateSupport(input({ usOnlineSalesUsd: 200_000 }), FX);
  assert.equal(line(e, "fulfillment").base.tl, Math.round(20_000 * FX * 0.5));
  assert.deepEqual(line(e, "fulfillment").base.limits, ["onlineSales"]);
});

check("a company under 1 year gets no rent or promotion support", () => {
  const e = estimateSupport(input({ companyOverOneYear: false }), FX);
  assert.equal(line(e, "rent").target.tl, 0);
  assert.equal(line(e, "promotion").base.tl, 0);
  assert.deepEqual(line(e, "rent").base.limits, ["companyAge"]);
  assert.ok(line(e, "trademark").base.tl > 0);
});

check("rent and promotion are prorated to the ownership share", () => {
  const e = estimateSupport(input({ ownershipPct: 60 }), FX);
  assert.equal(line(e, "rent").base.tl, Math.round(60_000 * FX * 0.5 * 0.6));
  assert.equal(line(e, "trademark").base.tl, Math.round(4_000 * FX * 0.5));
});

check("without a US unit, promotion uses the trademark-linked cap", () => {
  const e = estimateSupport(input({ costs: { rent: 0, promotion: 2_000_000 } }), FX);
  assert.equal(line(e, "promotion").capTl, SUPPORT_RULES.promotionWithoutUnitCapTl);
  assert.equal(line(e, "promotion").base.tl, SUPPORT_RULES.promotionWithoutUnitCapTl);
});

check("bad numbers never produce negative or NaN support", () => {
  const e = estimateSupport(input({ costs: { rent: -5, fulfillment: Number.NaN }, ownershipPct: 140 }), FX);
  for (const l of e.lines) for (const which of ["base", "target"]) assert.ok(Number.isFinite(l[which].tl) && l[which].tl >= 0);
  const zero = estimateSupport(input(), 0);
  assert.equal(zero.total.target.tl, 0);
});

const XML = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="isokur.xsl"?>
<Tarih_Date Tarih="12.10.2026" Date="10/12/2026"  Bulten_No="2026/192" >
	<Currency CrossOrder="0" Kod="USD" CurrencyCode="USD">
			<Unit>1</Unit>
			<Isim>ABD DOLARI</Isim>
			<CurrencyName>US DOLLAR</CurrencyName>
			<ForexBuying>49.2471</ForexBuying>
			<ForexSelling>49.3358</ForexSelling>
	</Currency>
	<Currency CrossOrder="1" Kod="AUD" CurrencyCode="AUD">
			<Unit>1</Unit>
			<ForexBuying>34.2625</ForexBuying>
	</Currency>
</Tarih_Date>`;

check("TCMB XML: USD ForexBuying and the bulletin date", () => {
  assert.deepEqual(parseTcmbXml(XML), { rate: 49.2471, date: "2026-10-12", live: true });
});

check("TCMB XML: garbage is rejected, not guessed", () => {
  assert.equal(parseTcmbXml("<html>maintenance</html>"), null);
  assert.equal(parseTcmbXml(XML.replace("49.2471", "0.0001")), null);
});

for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.extra ? `  (${r.extra})` : ""}`);
const failed = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
