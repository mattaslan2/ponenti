/**
 * The two rules quoted in the market figures on the home page. The trade figures
 * next to them come from the Census snapshot (src/lib/trade/analysis.ts) and move
 * monthly; these two are typed in and dated, and re-checked by hand.
 *
 * Section 301, forced labor: 91 FR 47318 (July 28, 2026), docket USTR-2026-0265/0266.
 * Products of Türkiye carry an additional 12.5% ad valorem duty under HTSUS
 * 9903.05.79 unless an exemption heading (9903.05.85 to 9903.05.92) applies.
 * CBP guidance: CSMS #69326983.
 *
 * FSVP: FDA, Inspection Observations, fiscal year 2025 (inspections ending
 * 10/1/2024 to 9/30/2025), "Foods" tab: 21 CFR 1.502(a), "You did not develop an
 * FSVP", cited 483 times, the most-cited food observation of the year.
 */
export const MARKET_RULES = {
  checkedOn: "2026-10-13",
  section301: {
    rate: 0.125,
    effective: "2026-07-24",
    inTransitUntil: "2026-07-28",
    hts: "9903.05.79",
    citation: "91 FR 47318",
    published: "2026-07-28",
  },
  fsvp: {
    fiscalYear: 2025,
    noFsvpCitations: 483,
    rule: "21 CFR 1.502(a)",
  },
} as const;

/** The article behind the Section 301 figure (meta.key in src/content/insights). */
export const SECTION_301_ARTICLE_KEY = "section-301-forced-labor-duty";
