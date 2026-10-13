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

  // The market figures on the home page. Verified on 2026-10-13.
  censusTradeApi: "https://www.census.gov/data/developers/data-sets/international-trade.html",
  frSection301ForcedLabor:
    "https://www.federalregister.gov/documents/2026/07/28/2026-15181/notice-of-actions-in-section-301-investigations-of-acts-policies-and-practices-of-various-economies",
  ustrSection301ForcedLaborRelease:
    "https://ustr.gov/about/policy-offices/press-office/press-releases/2026/july/ustr-takes-action-forced-labor-section-301-investigations",
  cbpCsmsSection301ForcedLabor: "https://content.govdelivery.com/accounts/USDHSCBP/bulletins/421d887",
  fdaInspectionObservations:
    "https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/inspection-references/inspection-observations",
  fdaInspectionObservationsFy2025: "https://www.fda.gov/media/190190/download?attachment",
  fdaFsvp: "https://www.fda.gov/food/food-safety-modernization-act-fsma/fsma-final-rule-foreign-supplier-verification-programs-fsvp-importers-food-humans-and-animals",

  // Turkish export support (Ministry of Trade, TCMB). Verified on 2026-10-12.
  trDecree5973: "https://ticaret.gov.tr/data/69afdacb269de120c032b73a/5973%20Say%C4%B1l%C4%B1%20Karar.pdf",
  trUnitRentCircular:
    "https://ticaret.gov.tr/data/633420e513b8769ec0647ee9/Birim%20Kira%20Deste%C4%9Fine%20%C4%B0li%C5%9Fkin%20Genelge.pdf",
  trPromotionCircular:
    "https://ticaret.gov.tr/data/6334210013b8769ec0647eec/Tan%C4%B1t%C4%B1m%20Deste%C4%9Fine%20%C4%B0li%C5%9Fkin%20Genelge.pdf",
  trTrademarkCircular:
    "https://ticaret.gov.tr/data/63341fab13b8769ec0647ed5/30.06.2025%20Yurtd%C4%B1%C5%9F%C4%B1%20Marka%20Tescil%20Deste%C4%9Fine%20%C4%B0li%C5%9Fkin%20Genelge.pdf",
  trEexportDecree: "https://ticaret.gov.tr/data/632b13e013b8767974670b91/E-ihracat%20Karar.pdf",
  trEexportCircular:
    "https://ticaret.gov.tr/data/6447baf113b8761694f892bb/E-%C4%B0HRACAT%20DESTEKLER%C4%B0NE%20%C4%B0L%C4%B0%C5%9EK%C4%B0N%20GENELGE%2013.04.2026.pdf",
  trEexportLimits2026:
    "https://ticaret.gov.tr/data/632b145a13b8767974670b9a/2026%20Y%C4%B1l%C4%B1na%20%C4%B0li%C5%9Fkin%20E-%C4%B0hracat%20Destekleri%20%C3%9Cst%20Limitleri.xlsx",
  trLimits2026Branding:
    "https://ticaret.gov.tr/data/63c0063e13b8763b44f9df24/Markala%C5%9Fma%20Dairesi%20-%202026%20Destek%20Limitleri.pdf",
  trLimits2026MarketEntry:
    "https://ticaret.gov.tr/data/63c0063e13b8763b44f9df24/2026%20Destek%20%C3%9Cst%20Limitleri_Ur-GE%20ve%20Ye%C5%9Fil%20D%C3%B6n%C3%BC%C5%9F%C3%BCm%20Destekleri.pdf",
  trTargetCountries: "https://ticaret.gov.tr/ihracat/pazara-giris/hedef-ve-oncelikli-ulkeler",
  trMarketEntryDocuments:
    "https://ticaret.gov.tr/data/5b8d8f3013b876125c08b3a8/Destek%20Kapsam%C4%B1ndaki%20Pazara%20Giri%C5%9F%20Belgeleri%20Ek-1B%2028.02.2024.pdf",
  tcmbRates: "https://www.tcmb.gov.tr/kurlar/kurlar_tr.html",
} as const;

export type SourceKey = keyof typeof sources;
