/**
 * Official sources behind every regulatory claim on the site.
 * Each claim links here; if a rule changes, update the URL and the copy together.
 * Verified on 2026-10-05.
 */
export const sources = {
  irs5472: "https://www.irs.gov/instructions/i5472",
  irsInternationalPenalties: "https://www.irs.gov/payments/international-information-reporting-penalties",
  frImporterData:
    "https://www.federalregister.gov/documents/2026/08/19/2026-16911/accuracy-of-importer-of-record-data-submitted-to-cbp",
  frEo14411: "https://www.federalregister.gov/documents/2026/06/10/2026-11595/strengthening-customs-enforcement",
  frElectronicRefunds: "https://www.federalregister.gov/documents/2026/01/02/2025-24171/electronic-refunds",
  frIeepaRefundsHeld:
    "https://www.federalregister.gov/documents/2026/10/05/2026-20228/agency-information-collection-activities-court-ordered-refunds-under-the-international-emergency",
  scotusWayfair: "https://www.supremecourt.gov/opinions/17pdf/585us1r58_pok0.pdf",
  ecfr7216: "https://www.ecfr.gov/current/title-26/section-301.7216-2",
  ecfrSafeguards: "https://www.ecfr.gov/current/title-16/section-314.3",
  irsPub5708: "https://www.irs.gov/pub/irs-pdf/p5708.pdf",
  ecfrCustomsBusiness: "https://www.ecfr.gov/current/title-19/section-111.1",
  ftcDebtCollection: "https://consumer.ftc.gov/articles/debt-collection-faqs",
} as const;

export type SourceKey = keyof typeof sources;
