import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { formatNumber, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Sample weekly cash report and quarterly scorecard, set as two sheets of
 * paper. All figures are invented examples: each sheet carries the
 * "Örnek veriler / Sample data" stamp, and the section that shows them says
 * they are not a client's results.
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

/** The stamp is bilingual on purpose: a screenshot of the sheet stays labeled in either language. */
export function SampleBadge({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-xs border border-brass px-2 py-1 text-[0.75rem] leading-none font-medium whitespace-nowrap text-brass-deep", className)}>
      Örnek veriler / Sample data
    </span>
  );
}

function SheetHeader({ label, period }: { label: string; period: string }) {
  return (
    <figcaption className="border-b border-navy pb-5">
      <span className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <span className="eyebrow">{label}</span>
        <SampleBadge />
      </span>
      <span className="mt-4 block font-display text-display-sm font-medium text-navy">{period}</span>
    </figcaption>
  );
}

/** "Form 1120 and 5472 (extended): Oct 15" → ["Form 1120 and 5472 (extended)", "Oct 15"] */
function splitDue(line: string): [string, string] {
  const at = line.lastIndexOf(": ");
  return at === -1 ? [line, ""] : [line.slice(0, at), line.slice(at + 2)];
}

export async function SampleReport({ compact = false }: { compact?: boolean }) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("report");
  const usd = (n: number) => formatUsd(n, locale);
  const pct = (n: number) =>
    new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", { style: "percent", maximumFractionDigits: 0 }).format(n);

  const headline = [
    { label: t("cash"), value: usd(sample.cash), sub: null },
    { label: t("dso"), value: t("days", { days: sample.dso }), sub: t("dsoPrev", { days: sample.dsoPrev }) },
    { label: t("overdue"), value: usd(sample.overdueAmount), sub: t("invoices", { count: sample.overdueCount }) },
  ];
  const lines = [
    { label: t("payables"), detail: t("payments", { count: sample.payablesCount }), value: usd(sample.payablesAmount) },
    { label: t("orders"), detail: "", value: t("ordersValue", { count: sample.orders }) },
  ];
  const filings = [splitDue(t("filing1")), splitDue(t("filing2"))];
  const scorecard = [
    { label: t("rowDso"), prev: t("days", { days: sample.scorecard.dso[0] }), cur: t("days", { days: sample.scorecard.dso[1] }) },
    { label: t("rowOverdue"), prev: pct(sample.scorecard.overdue[0]), cur: pct(sample.scorecard.overdue[1]) },
    { label: t("rowOrders"), prev: formatNumber(sample.scorecard.orders[0], locale), cur: formatNumber(sample.scorecard.orders[1], locale) },
    { label: t("rowErrors"), prev: String(sample.scorecard.errors[0]), cur: String(sample.scorecard.errors[1]) },
    { label: t("rowFilings"), prev: sample.scorecard.filings[0], cur: sample.scorecard.filings[1] },
  ];

  return (
    <div className={cn("grid gap-8", !compact && "lg:grid-cols-12 lg:gap-8")}>
      <figure className={cn("sheet p-6 sm:p-10", !compact && "lg:col-span-7")}>
        <SheetHeader label={t("weekLabel")} period={t("weekOf")} />
        <dl className="grid gap-y-8 py-8 sm:grid-cols-3 sm:gap-x-8">
          {headline.map((item) => (
            <div key={item.label}>
              <dt className="text-caption text-mist-soft">{item.label}</dt>
              <dd className="mt-2 font-display text-[2rem] leading-none font-medium text-navy">{item.value}</dd>
              {item.sub && <dd className="figures mt-2 text-caption text-mist-soft">{item.sub}</dd>}
            </div>
          ))}
        </dl>
        <dl className="figures border-t border-line text-small">
          {lines.map((line) => (
            <div key={line.label} className="grid grid-cols-[1fr_auto] items-baseline gap-x-6 border-b border-line py-3.5 sm:grid-cols-[1fr_auto_7rem]">
              <dt className="text-navy">{line.label}</dt>
              <dd className="hidden text-mist-soft sm:block">{line.detail}</dd>
              <dd className="text-right font-medium text-navy">
                {line.value}
                {line.detail && <span className="block font-normal text-mist-soft sm:hidden">{line.detail}</span>}
              </dd>
            </div>
          ))}
          <div className="grid gap-x-6 gap-y-1 py-3.5 sm:grid-cols-[minmax(0,10rem)_1fr]">
            <dt className="text-navy">{t("filings")}</dt>
            <dd>
              {filings.map(([what, when]) => (
                <span key={what} className="flex items-baseline justify-between gap-6 text-mist">
                  <span>{what}</span>
                  <span className="shrink-0 font-medium text-navy">{when}</span>
                </span>
              ))}
            </dd>
          </div>
        </dl>
      </figure>

      {!compact && (
        <figure className="sheet p-6 sm:p-10 lg:col-span-5">
          <SheetHeader label={t("scorecardLabel")} period={t("quarter")} />
          <table className="figures mt-3 w-full text-small">
            <thead>
              <tr className="text-caption text-mist-soft">
                <th scope="col" className="py-4 pr-3 text-left font-normal">{t("metric")}</th>
                <th scope="col" className="py-4 pr-3 text-right align-bottom font-normal">{t("previous")}</th>
                <th scope="col" className="py-4 text-right align-bottom font-normal">{t("current")}</th>
              </tr>
            </thead>
            <tbody>
              {scorecard.map((row) => (
                <tr key={row.label} className="border-t border-line">
                  <th scope="row" className="py-3.5 pr-3 text-left font-normal text-navy">{row.label}</th>
                  <td className="py-3.5 pr-3 text-right whitespace-nowrap text-mist-soft">{row.prev}</td>
                  <td className="py-3.5 text-right font-medium whitespace-nowrap text-navy">{row.cur}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      )}
    </div>
  );
}
