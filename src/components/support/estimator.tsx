"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { LeadForm } from "@/components/forms/lead-form";
import { NumberField, useUsedOnce } from "@/components/calculators/fields";
import { track } from "@/lib/analytics";
import { formatDate, formatNumber, formatUsd } from "@/lib/format";
import { sources } from "@/lib/sources";
import { SUPPORT_EXAMPLE, SUPPORT_LINES, SUPPORT_RULES, estimateSupport, type LineEstimate, type SupportLine } from "@/lib/support";

export type FxRate = { rate: number; date: string; live: boolean };

const SCENARIOS = ["base", "target"] as const;

/**
 * The support estimator: annual US costs in, estimated Turkish export support
 * out, at the base rate and at the target-country rate, in USD and in TL at the
 * TCMB rate the page was built with. Everything is computed in the browser; the
 * figures leave it only if the visitor asks for a support map.
 */
export function SupportEstimator({ fx }: { fx: FxRate }) {
  const t = useTranslations("supportEstimator");
  const common = useTranslations("common");
  const locale = useLocale() as Locale;
  const uid = useId();
  const [costs, setCosts] = useState(SUPPORT_EXAMPLE.costs);
  const [ownership, setOwnership] = useState(SUPPORT_EXAMPLE.ownershipPct);
  const [usExports, setUsExports] = useState<number | null>(SUPPORT_EXAMPLE.usExportsUsd);
  const [onlineSales, setOnlineSales] = useState<number | null>(SUPPORT_EXAMPLE.usOnlineSalesUsd);
  const [overOneYear, setOverOneYear] = useState(SUPPORT_EXAMPLE.companyOverOneYear);
  const [mapOpen, setMapOpen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  useUsedOnce("support", [costs, ownership, usExports, onlineSales, overOneYear]);

  const estimate = estimateSupport(
    { costs, ownershipPct: ownership, usExportsUsd: usExports, usOnlineSalesUsd: onlineSales, companyOverOneYear: overOneYear },
    fx.rate,
  );

  useEffect(() => {
    if (mapOpen) mapRef.current?.focus();
  }, [mapOpen]);

  const usd = (n: number) => formatUsd(n, locale);
  const tl = (n: number) => t("tl", { amount: formatNumber(n, locale) });
  const rate = new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(fx.rate);
  const setCost = (line: SupportLine) => (n: number) => setCosts((c) => ({ ...c, [line]: n }));

  const capText = (l: LineEstimate) => {
    const years = SUPPORT_RULES.lines[l.line].years;
    const cap = formatNumber(l.capTl, locale);
    return years ? t("capYears", { cap, years }) : t("cap", { cap });
  };
  const limitNotes = (l: LineEstimate) => [...new Set([...l.base.limits, ...l.target.limits])].map((limit) => t(`limits.${limit}`));

  const context = JSON.stringify({ costs, ownership, exports: usExports, onlineSales, overOneYear });

  return (
    <div className="grid gap-y-16 lg:grid-cols-12 lg:gap-x-8">
      {/* Inputs */}
      <div className="lg:col-span-5 lg:pr-4">
        <fieldset>
          <legend className="eyebrow">{t("costsLegend")}</legend>
          <div className="mt-6 grid gap-7">
            {SUPPORT_LINES.map((line) => (
              <NumberField
                key={line}
                id={`${uid}-${line}`}
                label={t(`lines.${line}.label`)}
                hint={t(`lines.${line}.hint`)}
                value={costs[line]}
                onChange={setCost(line)}
                locale={locale}
                max={1e10}
              />
            ))}
          </div>
        </fieldset>
        <details className="group mt-10 border-t border-line">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-4 text-small font-medium text-navy [&::-webkit-details-marker]:hidden">
            {t("more")}
            <Plus aria-hidden="true" className="size-4 shrink-0 text-brass-deep transition-transform duration-200 group-open:rotate-45" />
          </summary>
          <div className="grid gap-7 pt-2 pb-4">
            <NumberField
              id={`${uid}-ownership`}
              label={t("ownership")}
              hint={t("ownershipHint")}
              value={ownership}
              onChange={setOwnership}
              locale={locale}
              max={100}
              suffix="%"
            />
            <NumberField
              allowEmpty
              id={`${uid}-exports`}
              label={t("exports")}
              hint={t("exportsHint")}
              value={usExports}
              onChange={setUsExports}
              locale={locale}
              max={1e11}
              placeholder={t("optional")}
            />
            <NumberField
              allowEmpty
              id={`${uid}-sales`}
              label={t("onlineSales")}
              hint={t("onlineSalesHint")}
              value={onlineSales}
              onChange={setOnlineSales}
              locale={locale}
              max={1e11}
              placeholder={t("optional")}
            />
            <label className="flex cursor-pointer items-start gap-3 text-small text-navy">
              <input
                type="checkbox"
                checked={overOneYear}
                onChange={(e) => setOverOneYear(e.target.checked)}
                aria-describedby={`${uid}-age-hint`}
                className="mt-1 size-4 shrink-0 accent-navy"
              />
              <span>
                <span className="font-medium">{t("age")}</span>
                <span id={`${uid}-age-hint`} className="mt-1 block text-caption text-mist-soft">
                  {t("ageHint")}
                </span>
              </span>
            </label>
          </div>
        </details>
      </div>

      {/* Results */}
      <div className="lg:col-span-7 lg:border-l lg:border-line lg:pl-12">
        <h3 className="eyebrow">{t("resultTitle")}</h3>
        <div className="mt-6 grid grid-cols-2 gap-x-6 border-t border-navy pt-7" aria-live="polite">
          {SCENARIOS.map((which) => (
            <div key={which}>
              <p className="text-small font-medium text-navy">{t(`${which}.title`)}</p>
              <p className="text-caption text-mist-soft">{t(`${which}.rate`)}</p>
              <p className="mt-5 font-display text-[clamp(2.25rem,1.75rem+1.8vw,3.25rem)] leading-none font-medium text-navy">
                {usd(estimate.total[which].usd)}
              </p>
              <p className="figures mt-2.5 text-small text-mist">{tl(estimate.total[which].tl)}</p>
            </div>
          ))}
        </div>

        <table className="figures mt-12 w-full border-collapse text-small">
          <caption className="sr-only">{t("tableCaption")}</caption>
          <thead>
            <tr className="border-b border-navy/40 align-bottom text-caption text-mist">
              <th scope="col" className="py-3 pr-3 text-left font-medium">
                {t("line")}
              </th>
              {SCENARIOS.map((which) => (
                <th key={which} scope="col" className="py-3 pl-3 text-right font-medium">
                  {t(`${which}.short`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {estimate.lines.map((l) => {
              const notes = limitNotes(l);
              return (
                <tr key={l.line} className="border-b border-line align-top">
                  <th scope="row" className="py-4 pr-3 text-left font-normal">
                    <span className="block font-medium text-navy">{t(`lines.${l.line}.short`)}</span>
                    <span className="mt-1 block text-caption text-mist-soft">{t("costOf", { cost: usd(l.costUsd) })}</span>
                    <span className="block text-caption text-mist-soft">{capText(l)}</span>
                    {notes.map((note) => (
                      <span key={note} className="mt-1 block text-caption text-brass-deep">
                        {note}
                      </span>
                    ))}
                  </th>
                  {SCENARIOS.map((which) => (
                    <td key={which} className="py-4 pl-3 text-right whitespace-nowrap">
                      <span className="block text-navy">{usd(l[which].usd)}</span>
                      <span className="mt-1 block text-caption text-mist-soft">{tl(l[which].tl)}</span>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="align-top">
              <th scope="row" className="py-4 pr-3 text-left font-semibold text-navy">
                {t("total")}
              </th>
              {SCENARIOS.map((which) => (
                <td key={which} className="py-4 pl-3 text-right whitespace-nowrap">
                  <span className="block font-semibold text-navy">{usd(estimate.total[which].usd)}</span>
                  <span className="mt-1 block text-caption text-mist-soft">{tl(estimate.total[which].tl)}</span>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>

        <div className="mt-8 space-y-3 text-caption text-mist-soft">
          <p>
            {t("asOf", {
              rate,
              date: formatDate(fx.date, locale),
              year: SUPPORT_RULES.limitsYear,
              checked: formatDate(SUPPORT_RULES.checkedOn, locale),
            })}{" "}
            <a href={sources.tcmbRates} target="_blank" rel="noopener noreferrer" className="link inline-flex items-baseline gap-1">
              {t("tcmb")}
              <ArrowUpRight aria-hidden="true" className="nudge-up size-3.5 shrink-0 translate-y-0.5" />
              <span className="sr-only"> {common("opensNewTab")}</span>
            </a>
          </p>
          <p>{t("assumptions")}</p>
        </div>
        <p className="mt-6 border-l border-brass pl-5 text-small text-mist">{t("estimate")}</p>

        {!mapOpen ? (
          <Button
            size="lg"
            className="mt-10"
            onClick={() => {
              setMapOpen(true);
              track("cta_click", { label: "support_map", location: "support_estimator" });
            }}
          >
            {t("cta")}
            <ArrowRight aria-hidden="true" className="nudge" />
          </Button>
        ) : (
          <div className="mt-10 border-t border-line pt-8">
            <div ref={mapRef} tabIndex={-1} className="outline-none">
              <h3 className="text-display-sm">{t("mapTitle")}</h3>
              <p className="mt-3 max-w-xl text-small text-mist">{t("mapIntro")}</p>
            </div>
            <LeadForm className="mt-8" formType="calc_support" context={context} submitLabel={t("submit")} />
          </div>
        )}
        <p className="mt-6 text-caption text-mist-soft">{t("privacy")}</p>
      </div>
    </div>
  );
}
