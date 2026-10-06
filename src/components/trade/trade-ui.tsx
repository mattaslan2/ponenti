import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { LeadForm } from "@/components/forms/lead-form";
import { SourceLink } from "@/components/external-link";
import { COUNTRIES, TURKIYE, countryName } from "@/lib/trade/countries";
import { HS_BASIS_YEAR } from "@/lib/trade/hs";
import { pick } from "@/lib/messages";

/** Shared pieces of the trade-data pages. */

export function countryOptions(locale: string) {
  const named = COUNTRIES.map((c) => ({
    iso2: c.iso2,
    name: countryName(c, locale),
    imports: c.imports,
  }));
  const top = named.filter((c) => c.iso2 !== "TR").slice(0, 15);
  const topSet = new Set(top.map((c) => c.iso2));
  const rest = named.filter((c) => c.iso2 !== "TR" && !topSet.has(c.iso2)).sort((a, b) => a.name.localeCompare(b.name, locale));
  return {
    top: [{ iso2: TURKIYE.iso2, name: countryName(TURKIYE, locale) }, ...top.map(({ iso2, name }) => ({ iso2, name }))],
    rest: rest.map(({ iso2, name }) => ({ iso2, name })),
  };
}

export async function filterLabels() {
  const t = await getTranslations("trade.filters");
  return {
    search: t("search"),
    placeholder: t("placeholder"),
    hint: t("hint"),
    noResults: t("noResults"),
    country: t("country"),
    countryTop: t("countryTop"),
    countryAll: t("countryAll"),
    apply: t("apply"),
    usImports: t("usImports", { year: HS_BASIS_YEAR }),
    fromTurkiye: t("fromTurkiye"),
    chapter: t("chapter"),
  };
}

export async function chartLabels() {
  const t = await getTranslations("trade");
  return {
    table: t("chart.table"),
    month: t("cols.month"),
    value: t("cols.value"),
    scrub: t("chart.scrub"),
    noData: t("chart.noData"),
  };
}

export function TradeMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="page py-12">
      <p role="status" className="max-w-2xl rounded-sm border border-line bg-paper p-6 text-[1rem] text-graphite">
        {children}
      </p>
    </div>
  );
}

export function TradeLoading({ label }: { label: string }) {
  return (
    <div className="page py-12" aria-busy="true">
      <p role="status" className="text-[0.9375rem] text-mist">
        {label}
      </p>
      <div aria-hidden="true" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-36 rounded-sm border border-line bg-paper/70" />
        ))}
      </div>
      <div aria-hidden="true" className="mt-6 h-72 rounded-sm border border-line bg-paper/70" />
    </div>
  );
}

export async function TradeLead({ context }: { context: { hs?: string; country: string } }) {
  const t = await getTranslations("trade.lead");
  const messages = await getMessages();
  return (
    <section aria-labelledby="trade-lead-title" className="border-t border-line bg-sand py-14 sm:py-20">
      <div className="page grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-14">
        <div>
          <h2 id="trade-lead-title" className="text-display-md">
            {t("title")}
          </h2>
          <p className="mt-4 max-w-xl text-lead text-mist">{t("body")}</p>
        </div>
        <div className="rounded-sm border border-line bg-paper p-6 sm:p-8">
          <NextIntlClientProvider messages={pick(messages, ["forms", "common"])}>
            <LeadForm formType="trade_data" context={JSON.stringify(context)} submitLabel={t("submit")} />
          </NextIntlClientProvider>
        </div>
      </div>
    </section>
  );
}

export async function DataNotes({ locale, withTariff = false }: { locale: string; withTariff?: boolean }) {
  const t = await getTranslations("trade.notes");
  const common = await getTranslations("common");
  return (
    <section aria-labelledby="trade-notes-title" className="py-14 sm:py-16">
      <div className="page">
        <div className="max-w-4xl">
          <h2 id="trade-notes-title" className="text-display-sm">
            {t("title")}
          </h2>
          <ul className="mt-5 list-disc space-y-2 pl-5 text-[0.9375rem] text-mist marker:text-brass">
            <li>{t("value")}</li>
            <li>{t("window")}</li>
            <li>{t("duty")}</li>
            <li>{t("release")}</li>
            <li>{common("informational")}</li>
          </ul>
          <p className="mt-6 text-[0.9375rem]">
            <span className="text-mist">{common("sources")}: </span>
            <SourceLink href="https://www.census.gov/data/developers/data-sets/international-trade.html">{t("sourceCensus")}</SourceLink>
            {withTariff && (
              <>
                {" · "}
                <SourceLink href="https://hts.usitc.gov/">{t("sourceUsitc")}</SourceLink>
              </>
            )}
          </p>
          <p className="mt-4 text-[0.8125rem] text-mist">
            {t("census")}
            {locale !== "en" && (
              <span lang="en" className="mt-1 block">
                {t("censusOfficial")}
              </span>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
