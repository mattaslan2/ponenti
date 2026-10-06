import type { Locale } from "@/i18n/routing";

const intlLocale = (locale: Locale) => (locale === "tr" ? "tr-TR" : "en-US");

/** $2.500 in Turkish, $2,500 in English. */
export function formatUsd(value: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

/** Rounded to the nearest $1,000 for "about $181K"-style results. */
export function formatUsdRounded(value: number, locale: Locale): string {
  const step = value >= 10000 ? 1000 : 100;
  return formatUsd(Math.round(value / step) * step, locale);
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: 0 }).format(value);
}

/** Formats a calendar date (YYYY-MM-DD) without timezone drift. */
export function formatDate(iso: string, locale: Locale): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(intlLocale(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1)));
}

/** All prices pre-formatted for message placeholders. */
export function priceArgs(locale: Locale, p: typeof import("./pricing").pricing) {
  const f = (n: number) => formatUsd(n, locale);
  return {
    check: f(p.check),
    essentials: f(p.plans.essentials),
    standard: f(p.plans.standard),
    complete: f(p.plans.complete),
  };
}
