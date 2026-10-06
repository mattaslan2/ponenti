"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Mail, Minus, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LeadForm } from "@/components/forms/lead-form";
import { track } from "@/lib/analytics";
import { cashFreed, form5472Exposure, paymentDaysRange } from "@/lib/calculators";
import { formatNumber, formatUsd, formatUsdRounded } from "@/lib/format";
import { pricing } from "@/lib/pricing";

/** Fires calculator_used once per calculator, after the visitor changes an input. */
function useUsedOnce(name: string, deps: unknown[]) {
  const first = useRef(true);
  const sent = useRef(false);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (sent.current) return;
    const id = window.setTimeout(() => {
      sent.current = true;
      track("calculator_used", { calculator: name });
    }, 800);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

function NumberField({
  id,
  label,
  value,
  onChange,
  locale,
  suffix,
  max,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (n: number) => void;
  locale: Locale;
  suffix?: string;
  max: number;
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(String(value));
  return (
    <div>
      <Label htmlFor={id} className="text-[0.9375rem] font-medium text-navy">
        {label}
      </Label>
      <div className="relative mt-2">
        <Input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          value={focused ? draft : formatNumber(value, locale)}
          onFocus={() => {
            setDraft(String(value));
            setFocused(true);
          }}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, 13);
            setDraft(digits);
            onChange(Math.min(max, Number(digits || 0)));
          }}
          className="pr-12 text-[1.0625rem] [font-variant-numeric:tabular-nums]"
        />
        {suffix && <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[0.875rem] text-mist">{suffix}</span>}
      </div>
    </div>
  );
}

export function CashCalculator() {
  const t = useTranslations("calculators");
  const locale = useLocale() as Locale;
  const uid = useId();
  const [sales, setSales] = useState(3_000_000);
  const [current, setCurrent] = useState(62);
  const [target, setTarget] = useState(40);
  const [emailOpen, setEmailOpen] = useState(false);
  const result = cashFreed(sales, current, target);
  const invalid = target >= current;
  useUsedOnce("cash_freed", [sales, current, target]);

  const example = t("cash.example", {
    sales: formatUsd(3_000_000, locale),
    result: formatUsdRounded(cashFreed(3_000_000, 62, 40), locale),
  });

  return (
    <article aria-labelledby={`${uid}-title`} className="rounded-sm border border-line bg-paper p-6 sm:p-8">
      <h2 id={`${uid}-title`} className="text-display-md">
        {t("cash.title")}
      </h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        <NumberField id={`${uid}-sales`} label={t("cash.sales")} value={sales} onChange={setSales} locale={locale} max={1e11} />
        <NumberField id={`${uid}-current`} label={t("cash.current")} value={current} onChange={setCurrent} locale={locale} max={365} />
        <NumberField id={`${uid}-target`} label={t("cash.target")} value={target} onChange={setTarget} locale={locale} max={365} />
      </div>
      <div className="mt-8 border-t border-brass/70 pt-6" aria-live="polite">
        <p className="text-[0.9375rem] text-mist">{t("cash.result")}</p>
        {invalid ? (
          <p className="mt-2 text-risk-high">{t("cash.invalid")}</p>
        ) : (
          <div className="numeral mt-1 text-navy">{formatUsdRounded(result, locale)}</div>
        )}
      </div>
      <p className="mt-5 text-[0.9375rem] text-graphite">{t("cash.formula")}</p>
      <p className="mt-1 text-[0.9375rem] text-mist">{example}</p>
      <p className="mt-1 text-[0.875rem] text-mist">{t("cash.note")}</p>
      {!emailOpen ? (
        <Button variant="outline" className="mt-6" onClick={() => setEmailOpen(true)} disabled={invalid}>
          <Mail aria-hidden="true" />
          {t("emailCta")}
        </Button>
      ) : (
        <LeadForm
          className="mt-6 border-t border-line pt-6"
          formType="calc_cash"
          paymentDays={paymentDaysRange(current)}
          context={JSON.stringify({ sales, current, target, result: Math.round(result) })}
          submitLabel={t("emailCta")}
        />
      )}
    </article>
  );
}

export function Form5472Calculator({ sourceUrl, sourceLabel, opensNewTab }: { sourceUrl: string; sourceLabel: string; opensNewTab: string }) {
  const t = useTranslations("calculators");
  const locale = useLocale() as Locale;
  const uid = useId();
  const [years, setYears] = useState(3);
  const [emailOpen, setEmailOpen] = useState(false);
  const result = form5472Exposure(years);
  const penalty = formatUsd(pricing.form5472Penalty, locale);
  useUsedOnce("form_5472", [years]);

  return (
    <article aria-labelledby={`${uid}-title`} className="rounded-sm border border-line bg-paper p-6 sm:p-8">
      <h2 id={`${uid}-title`} className="text-display-md">
        {t("form5472.title")}
      </h2>
      <div className="mt-6">
        <Label htmlFor={`${uid}-years`} className="text-[0.9375rem] font-medium text-navy">
          {t("form5472.years")}
        </Label>
        <div className="mt-2 flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label={t("form5472.decrease")} onClick={() => setYears((y) => Math.max(0, y - 1))}>
            <Minus aria-hidden="true" />
          </Button>
          <Input
            id={`${uid}-years`}
            inputMode="numeric"
            value={years}
            onChange={(e) => setYears(Math.min(20, Number(e.target.value.replace(/\D/g, "") || 0)))}
            className="w-20 text-center text-[1.0625rem]"
          />
          <Button variant="outline" size="icon" aria-label={t("form5472.increase")} onClick={() => setYears((y) => Math.min(20, y + 1))}>
            <Plus aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="mt-8 border-t border-brass/70 pt-6" aria-live="polite">
        <p className="text-[0.9375rem] text-mist">{t("form5472.result")}</p>
        <div className="numeral mt-1 text-navy">{formatUsd(result, locale)}</div>
      </div>
      <p className="mt-5 text-[0.9375rem] text-graphite">{t("form5472.formula", { penalty })}</p>
      <p className="mt-1 text-[0.9375rem] text-mist">{t("form5472.continuation", { penalty })}</p>
      <p className="mt-1 text-[0.9375rem] text-mist">{t("form5472.multiple")}</p>
      <p className="mt-2 text-[0.875rem]">
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="link">
          {sourceLabel}
          <span className="sr-only"> {opensNewTab}</span>
        </a>
      </p>
      {!emailOpen ? (
        <Button variant="outline" className="mt-6" onClick={() => setEmailOpen(true)}>
          <Mail aria-hidden="true" />
          {t("emailCta")}
        </Button>
      ) : (
        <LeadForm
          className="mt-6 border-t border-line pt-6"
          formType="calc_5472"
          segment="us_entity"
          context={JSON.stringify({ years, result })}
          submitLabel={t("emailCta")}
        />
      )}
    </article>
  );
}
