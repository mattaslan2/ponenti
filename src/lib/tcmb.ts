import "server-only";

/**
 * The Turkish central bank's indicative USD buying rate (TCMB "Gösterge
 * Niteliğindeki Merkez Bankası Kurları", ForexBuying). Support claims are paid
 * in TL at this rate on the payment document's date, so the estimator uses it.
 *
 * TCMB publishes today.xml each business day at 15:30 Türkiye time; before that,
 * and on weekends, it holds the previous bulletin. Cached for an hour. If the
 * request fails, the last checked rate is used and the page still shows its date.
 */
const TODAY_XML = "https://www.tcmb.gov.tr/kurlar/today.xml";
const HOUR = 60 * 60;

export type UsdTry = {
  /** TL per USD. */
  rate: number;
  /** Bulletin date, YYYY-MM-DD. */
  date: string;
  /** False when the fallback below was used. */
  live: boolean;
};

/** Checked on 2026-10-12 (bulletin 2026/192). Update when you touch this file. */
export const USD_TRY_FALLBACK: UsdTry = { rate: 49.2471, date: "2026-10-12", live: false };

/** Reads the USD ForexBuying rate and the bulletin date (Tarih="DD.MM.YYYY") from today.xml. */
export function parseTcmbXml(xml: string): UsdTry | null {
  const date = /<Tarih_Date\b[^>]*\bTarih="(\d{2})\.(\d{2})\.(\d{4})"/.exec(xml);
  const usd = /<Currency\b[^>]*\bCurrencyCode="USD"[^>]*>([\s\S]*?)<\/Currency>/.exec(xml);
  const buying = usd && /<ForexBuying>\s*([\d.]+)\s*<\/ForexBuying>/.exec(usd[1]);
  const unit = usd && /<Unit>\s*(\d+)\s*<\/Unit>/.exec(usd[1]);
  if (!date || !buying) return null;
  const rate = Number(buying[1]) / Number(unit?.[1] ?? 1);
  // A sanity band: anything outside it is a parsing problem, not a market move.
  if (!Number.isFinite(rate) || rate < 1 || rate > 1000) return null;
  return { rate, date: `${date[3]}-${date[2]}-${date[1]}`, live: true };
}

export async function getUsdTry(): Promise<UsdTry> {
  try {
    const res = await fetch(TODAY_XML, {
      cache: "force-cache",
      next: { revalidate: HOUR, tags: ["tcmb-rate"] },
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return USD_TRY_FALLBACK;
    return parseTcmbXml(await res.text()) ?? USD_TRY_FALLBACK;
  } catch {
    return USD_TRY_FALLBACK;
  }
}
