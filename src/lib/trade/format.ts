import type { Ym, YtdBasis } from "./periods";

/** Number formatting for the trade pages (safe on server and client). */

const UNITS = {
  tr: [
    [1e12, "trilyon"],
    [1e9, "milyar"],
    [1e6, "milyon"],
    [1e3, "bin"],
  ],
  en: [
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"],
  ],
} as const;

/** $10.0B / $10 milyar, $424.5M / $424,5 milyon. */
export function usdCompact(value: number, locale: string): string {
  const lang = locale === "tr" ? "tr" : "en";
  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  for (const [size, unit] of UNITS[lang]) {
    if (abs >= size) {
      const scaled = abs / size;
      const digits = scaled >= 100 ? 0 : 1;
      const n = new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
        maximumFractionDigits: digits,
        minimumFractionDigits: 0,
      }).format(scaled);
      return lang === "tr" ? `${sign}$${n} ${unit}` : `${sign}$${n}${unit}`;
    }
  }
  return `${sign}$${new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", { maximumFractionDigits: 0 }).format(abs)}`;
}

/** Short axis ticks: $2B / $2 mlr, $500M / $500 mn. */
export function usdAxis(value: number, locale: string): string {
  const tr = locale === "tr";
  const units: [number, string][] = tr
    ? [
        [1e12, " trl"],
        [1e9, " mlr"],
        [1e6, " mn"],
        [1e3, " bin"],
      ]
    : [
        [1e12, "T"],
        [1e9, "B"],
        [1e6, "M"],
        [1e3, "K"],
      ];
  const nf = new Intl.NumberFormat(tr ? "tr-TR" : "en-US", {
    maximumFractionDigits: 1,
  });
  for (const [size, unit] of units) if (Math.abs(value) >= size) return `$${nf.format(value / size)}${unit}`;
  return `$${nf.format(value)}`;
}

/** +5.0% / +%5,0. `value` is a ratio (0.05 = 5%). Negative values get a true minus sign. */
export function pct(value: number, locale: string, { signed = false, digits = 1 } = {}): string {
  return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    signDisplay: signed ? "exceptZero" : "auto",
  })
    .format(value)
    .replace("-", "−");
}

export function int(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function monthLabel({ y, m }: Ym, locale: string, style: "short" | "long" = "short"): string {
  return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", {
    month: style,
    year: "numeric",
    timeZone: "UTC",
  }).format(Date.UTC(y, m - 1, 1));
}

/** "Jan–Jul 2026" / "Oca–Tem 2026", or "2025" for a full year. */
export function basisLabel(basis: YtdBasis, locale: string, which: "cur" | "prev" = "cur"): string {
  const ym = basis[which];
  if (basis.kind === "year" || ym.m === 12) return String(ym.y);
  const fmt = new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", {
    month: "short",
    timeZone: "UTC",
  });
  return `${fmt.format(Date.UTC(ym.y, 0, 1))}–${fmt.format(Date.UTC(ym.y, ym.m - 1, 1))} ${ym.y}`;
}

/** "Aug 2025–Jul 2026" for a rolling 12-month window ending at `last`. */
export function windowLabel(first: Ym, last: Ym, locale: string): string {
  return `${monthLabel(first, locale)}–${monthLabel(last, locale)}`;
}

/** Growth ratio, or null when the base is zero. */
export const growth = (cur: number, prev: number) => (prev > 0 ? cur / prev - 1 : null);
