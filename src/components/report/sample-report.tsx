import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { formatNumber, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Sample weekly cash report and quarterly scorecard. All figures are invented
 * examples and always carry the "Örnek veriler / Sample data" label.
 */
const sample = {
  cash: 412300,
  dso: 47,
  dsoPrev: 58,
  overdueCount: 14,
  overdueAmount: 86400,
  payablesCount: 9,
  payablesAmount: 63750,
  orders: 38,
  scorecard: {
    dso: [58, 47],
    overdue: [0.18, 0.11],
    orders: [371, 412],
    errors: [7, 3],
    filings: ["9/9", "9/9"],
  },
} as const;

export function SampleBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-xs border border-risk-medium/60 bg-risk-medium/10 px-2 py-0.5 text-[0.75rem] font-semibold tracking-wide text-risk-medium",
        className,
      )}
    >
      Örnek veriler / Sample data
    </span>
  );
}

export async function SampleReport({ compact = false }: { compact?: boolean }) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("report");
  const usd = (n: number) => formatUsd(n, locale);
  const pct = (n: number) =>
    new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", { style: "percent", maximumFractionDigits: 0 }).format(n);

  const tiles = [
    { label: t("cash"), value: usd(sample.cash) },
    { label: t("dso"), value: t("days", { days: sample.dso }), sub: t("dsoPrev", { days: sample.dsoPrev }) },
    { label: t("overdue"), value: t("overdueValue", { count: sample.overdueCount, amount: usd(sample.overdueAmount) }) },
    { label: t("payables"), value: t("payablesValue", { count: sample.payablesCount, amount: usd(sample.payablesAmount) }) },
    { label: t("orders"), value: t("ordersValue", { count: sample.orders }) },
  ];

  return (
    <div className={cn("grid gap-5", !compact && "lg:grid-cols-5")}>
      <figure className={cn("rounded-sm border border-line bg-paper p-5 shadow-quiet sm:p-6", !compact && "lg:col-span-3")}>
        <figcaption className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-display text-xl font-semibold text-navy">{t("weekLabel")}</span>
          <SampleBadge />
        </figcaption>
        <p className="mt-1 text-sm text-mist">{t("weekOf")}</p>
        <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xs border border-line bg-line sm:grid-cols-3">
          {tiles.map((tile) => (
            <div key={tile.label} className="bg-paper p-3.5">
              <dt className="text-[0.8125rem] text-mist">{tile.label}</dt>
              <dd className="mt-1 font-display text-[1.375rem] leading-tight font-semibold text-navy [font-variant-numeric:lining-nums_tabular-nums]">
                {tile.value}
              </dd>
              {tile.sub && <dd className="text-[0.75rem] text-mist">{tile.sub}</dd>}
            </div>
          ))}
          <div className="bg-paper p-3.5">
            <dt className="text-[0.8125rem] text-mist">{t("filings")}</dt>
            <dd className="mt-1 space-y-1 text-[0.8125rem] leading-snug text-navy">
              <span className="block">{t("filing1")}</span>
              <span className="block">{t("filing2")}</span>
            </dd>
          </div>
        </dl>
      </figure>

      {!compact && (
        <figure className="rounded-sm border border-line bg-paper p-5 shadow-quiet sm:p-6 lg:col-span-2">
          <figcaption className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-display text-xl font-semibold text-navy">{t("scorecardLabel")}</span>
            <SampleBadge />
          </figcaption>
          <p className="mt-1 text-sm text-mist">{t("quarter")}</p>
          <table className="mt-5 w-full text-[0.875rem]">
            <thead>
              <tr className="border-b border-navy/30 text-left text-mist">
                <th scope="col" className="py-2 pr-2 font-medium">{t("metric")}</th>
                <th scope="col" className="py-2 pr-2 text-right font-medium">{t("previous")}</th>
                <th scope="col" className="py-2 text-right font-medium">{t("current")}</th>
              </tr>
            </thead>
            <tbody className="[font-variant-numeric:tabular-nums]">
              <tr className="border-b border-line">
                <th scope="row" className="py-2 pr-2 text-left font-normal">{t("rowDso")}</th>
                <td className="py-2 pr-2 text-right">{t("days", { days: sample.scorecard.dso[0] })}</td>
                <td className="py-2 text-right font-semibold text-navy">{t("days", { days: sample.scorecard.dso[1] })}</td>
              </tr>
              <tr className="border-b border-line">
                <th scope="row" className="py-2 pr-2 text-left font-normal">{t("rowOverdue")}</th>
                <td className="py-2 pr-2 text-right">{pct(sample.scorecard.overdue[0])}</td>
                <td className="py-2 text-right font-semibold text-navy">{pct(sample.scorecard.overdue[1])}</td>
              </tr>
              <tr className="border-b border-line">
                <th scope="row" className="py-2 pr-2 text-left font-normal">{t("rowOrders")}</th>
                <td className="py-2 pr-2 text-right">{formatNumber(sample.scorecard.orders[0], locale)}</td>
                <td className="py-2 text-right font-semibold text-navy">{formatNumber(sample.scorecard.orders[1], locale)}</td>
              </tr>
              <tr className="border-b border-line">
                <th scope="row" className="py-2 pr-2 text-left font-normal">{t("rowErrors")}</th>
                <td className="py-2 pr-2 text-right">{sample.scorecard.errors[0]}</td>
                <td className="py-2 text-right font-semibold text-navy">{sample.scorecard.errors[1]}</td>
              </tr>
              <tr>
                <th scope="row" className="py-2 pr-2 text-left font-normal">{t("rowFilings")}</th>
                <td className="py-2 pr-2 text-right">{sample.scorecard.filings[0]}</td>
                <td className="py-2 text-right font-semibold text-navy">{sample.scorecard.filings[1]}</td>
              </tr>
            </tbody>
          </table>
        </figure>
      )}
    </div>
  );
}
