/**
 * Turkish export support for a company's US side: the rules behind the support
 * estimator and the support file page.
 *
 * Rates and conditions come from Decree 5973 (Art. 3, 4, 11, 12 and 29), the
 * E-Export Support Decree (Art. 6 and 16) and the Ministry of Trade circulars on
 * unit rent, promotion, trademark registration and e-export support. Annual caps
 * are the Ministry's 2026 tables. Every link is in sources.ts. Checked on
 * 2026-10-12.
 *
 * Each January the Ministry posts new caps: update the TL figures and limitsYear
 * together. The estimator shows estimates only. The Ministry decides every claim,
 * and pays it in TL at the TCMB buying rate of the payment document's date.
 *
 * No imports: tests/support-math.mjs runs this file directly in Node.
 */

export const SUPPORT_LINES = ["rent", "fulfillment", "documents", "trademark", "promotion"] as const;
export type SupportLine = (typeof SUPPORT_LINES)[number];

export type LineRule = {
  /** Base rate. */
  base: number;
  /** Rate when the US is on the Ministry's target-country list for the payment year (20 points more). */
  target: number;
  /** Annual cap in TL for limitsYear. */
  capTl: number;
  /** Years the support runs in one country; null when the rules set no limit. */
  years: number | null;
  /** Paid pro rata to the Turkish company's share of the US company (when the US company pays). */
  proRata: boolean;
  /** A year's support may not exceed half of that year's exports to the US. */
  halfOfExports: boolean;
  /** The Turkish company must be at least this many years old when it applies. */
  minCompanyYears: number;
};

export const SUPPORT_RULES = {
  checkedOn: "2026-10-12",
  limitsYear: 2026,
  /** Months from the payment document date to file a claim (unit rent Art. 10, promotion Art. 8, e-export Art. 15). */
  filingWindowMonths: 6,
  lines: {
    // Decree 5973 Art. 11; unit rent circular Art. 4, 7 and 13. Cap per unit (site).
    rent: { base: 0.5, target: 0.7, capTl: 9_862_972, years: 4, proRata: true, halfOfExports: true, minCompanyYears: 1 },
    // E-export decree Art. 6 and 16; e-export circular Art. 15 and 29. The US is on the e-export target list.
    // Only costs up to 10% of the company's e-commerce sales in the US count.
    fulfillment: { base: 0.5, target: 0.7, capTl: 36_993_646, years: 3, proRata: false, halfOfExports: false, minCompanyYears: 0 },
    // Decree 5973 Art. 3 (market entry documents: certifications, registrations, licenses). Estimated at 50% in both columns.
    documents: { base: 0.5, target: 0.5, capTl: 19_728_672, years: null, proRata: false, halfOfExports: false, minCompanyYears: 0 },
    // Decree 5973 Art. 4; trademark registration circular Art. 9.
    trademark: { base: 0.5, target: 0.7, capTl: 3_698_274, years: 4, proRata: false, halfOfExports: false, minCompanyYears: 0 },
    // Decree 5973 Art. 12; promotion circular Art. 4, 6 and 11. Cap per country while a supported US unit exists.
    promotion: { base: 0.5, target: 0.7, capTl: 12_329_397, years: 4, proRata: true, halfOfExports: true, minCompanyYears: 1 },
  } satisfies Record<SupportLine, LineRule>,
  /** Promotion cap without a supported US unit (tied to a trademark registered in Türkiye and filed in the US). */
  promotionWithoutUnitCapTl: 19_728_672,
  /** Fulfillment: share of the year's US e-commerce sales that can count as eligible cost. */
  fulfillmentSalesShare: 0.1,
  /** Rent and promotion: share of the year's exports to the US that caps the support. */
  exportShareCap: 0.5,
  /** Rent support covers at most this many units per company. */
  maxRentUnits: 25,
  /** Decree 5973 Art. 5: market entry project preparation, sold through a Turkish consultancy. */
  marketEntryProject: { rate: 0.5, capTl: 983_843, maxProjects: 2 },
} as const;

export type SupportInput = {
  /** Annual costs in USD. Rent is for one US site. */
  costs: Record<SupportLine, number>;
  /** The Turkish company's share of the US company, 0 to 100. */
  ownershipPct: number;
  /** The year's exports to the US in USD, from Turkish customs declarations. Null: not applied. */
  usExportsUsd: number | null;
  /** The year's e-commerce sales in the US in USD. Null: not applied. */
  usOnlineSalesUsd: number | null;
  /** Has the Turkish company existed for at least a year? */
  companyOverOneYear: boolean;
};

/** Why a line came out lower than cost x rate. */
export type SupportLimit = "cap" | "exports" | "onlineSales" | "companyAge";

export type ScenarioAmount = { tl: number; usd: number; rate: number; limits: SupportLimit[] };

export type LineEstimate = {
  line: SupportLine;
  costUsd: number;
  capTl: number;
  base: ScenarioAmount;
  target: ScenarioAmount;
};

export type SupportEstimate = {
  fx: number;
  lines: LineEstimate[];
  total: { base: { tl: number; usd: number }; target: { tl: number; usd: number } };
};

const clampMoney = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

/** The cap that applies to a line for this company (promotion depends on whether there is a US unit). */
export function capFor(line: SupportLine, input: Pick<SupportInput, "costs">): number {
  if (line === "promotion" && !(input.costs.rent > 0)) return SUPPORT_RULES.promotionWithoutUnitCapTl;
  return SUPPORT_RULES.lines[line].capTl;
}

function scenario(line: SupportLine, input: SupportInput, fx: number, which: "base" | "target"): ScenarioAmount {
  const rule: LineRule = SUPPORT_RULES.lines[line];
  const rate = rule[which];
  const limits: SupportLimit[] = [];
  let eligibleUsd = clampMoney(input.costs[line]);

  if (rule.minCompanyYears > 0 && !input.companyOverOneYear && eligibleUsd > 0) {
    return { tl: 0, usd: 0, rate, limits: ["companyAge"] };
  }
  if (line === "fulfillment" && input.usOnlineSalesUsd !== null) {
    const ceiling = clampMoney(input.usOnlineSalesUsd) * SUPPORT_RULES.fulfillmentSalesShare;
    if (eligibleUsd > ceiling) {
      eligibleUsd = ceiling;
      limits.push("onlineSales");
    }
  }

  const share = rule.proRata ? Math.min(100, Math.max(0, input.ownershipPct)) / 100 : 1;
  let tl = eligibleUsd * fx * rate * share;

  const cap = capFor(line, input);
  if (tl > cap) {
    tl = cap;
    limits.push("cap");
  }
  if (rule.halfOfExports && input.usExportsUsd !== null) {
    const ceiling = clampMoney(input.usExportsUsd) * fx * SUPPORT_RULES.exportShareCap;
    if (tl > ceiling) {
      tl = ceiling;
      limits.push("exports");
    }
  }

  const roundedTl = Math.round(tl);
  return { tl: roundedTl, usd: fx > 0 ? Math.round(roundedTl / fx) : 0, rate, limits };
}

/**
 * Estimated annual support for each cost line, at the base rate and at the
 * target-country rate. Costs convert to TL at `fx` (TL per USD); caps apply in TL.
 */
export function estimateSupport(input: SupportInput, fx: number): SupportEstimate {
  const rate = Number.isFinite(fx) && fx > 0 ? fx : 0;
  const lines = SUPPORT_LINES.map((line) => ({
    line,
    costUsd: clampMoney(input.costs[line]),
    capTl: capFor(line, input),
    base: scenario(line, input, rate, "base"),
    target: scenario(line, input, rate, "target"),
  }));
  const sum = (which: "base" | "target") => {
    const tl = lines.reduce((acc, l) => acc + l[which].tl, 0);
    return { tl, usd: rate > 0 ? Math.round(tl / rate) : 0 };
  };
  return { fx: rate, lines, total: { base: sum("base"), target: sum("target") } };
}

/** The Turkish article on why US rent claims come back (there is no English version). */
export const SUPPORT_ARTICLE_SLUG = "abd-kira-destegi-neden-reddedilir";

/** Starting figures for the estimator: a small US office and an online channel. */
export const SUPPORT_EXAMPLE: SupportInput = {
  costs: { rent: 60_000, fulfillment: 36_000, documents: 8_000, trademark: 4_000, promotion: 30_000 },
  ownershipPct: 100,
  usExportsUsd: null,
  usOnlineSalesUsd: null,
  companyOverOneYear: true,
};
