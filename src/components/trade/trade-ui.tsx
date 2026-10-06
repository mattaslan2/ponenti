import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { LeadForm } from "@/components/forms/lead-form";
import { SourceLink } from "@/components/external-link";
import { COUNTRIES, TURKIYE, countryName } from "@/lib/trade/countries";
import { HS_BASIS_YEAR } from "@/lib/trade/hs";
import { pick } from "@/lib/messages";

/** Shared pieces of the trade-data pages. */

export function countryOptions(locale: string) {
  // The Census list also carries retired entities ("Israel prior to 1989", "Serbia prior to
  // 2009") under the ISO code of today's country. The list is ordered by imports, so keeping
  // the first entry per code keeps the current country and drops the duplicate menu line.
  const seen = new Set<string>();
  const named = COUNTRIES.filter((c) => !seen.has(c.iso2) && seen.add(c.iso2)).map((c) => ({
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
    <div className="page py-section">
      <p role="status" className="max-w-2xl border-l border-brass pl-5 text-navy">
        {children}
      </p>
    </div>
  );
}

export function TradeLoading({ label }: { label: string }) {
  return (
    <div className="page py-section" aria-busy="true">
      <p role="status" className="text-small text-mist">
        {label}
      </p>
      <div aria-hidden="true" className="mt-8 grid border-t border-navy sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-36 border-b border-line lg:border-b-0" />
        ))}
      </div>
      <div aria-hidden="true" className="mt-12 h-72 bg-sand/60" />
    </div>
  );
}

export async function TradeLead({ context }: { context: { hs?: string; country: string } }) {
  const t = await getTranslations("trade.lead");
  const messages = await getMessages();
  return (
    // On the ivory ground with a hairline above: the sand band is kept for the closing call on every page.
    <section aria-labelledby="trade-lead-title">
      <div className="page">
        <div aria-hidden="true" className="rule" data-reveal="rule" />
        <div className="grid gap-x-8 gap-y-14 py-section lg:grid-cols-12">
          <div className="lg:col-span-6">
            <h2 id="trade-lead-title" className="max-w-[16ch] text-display-lg">
              {t("title")}
            </h2>
            <p className="mt-6 max-w-md text-lead text-mist">{t("body")}</p>
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <div className="sheet p-6 sm:p-10">
              <NextIntlClientProvider messages={pick(messages, ["forms", "common"])}>
                <LeadForm formType="trade_data" context={JSON.stringify(context)} submitLabel={t("submit")} />
              </NextIntlClientProvider>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export async function DataNotes({ locale, withTariff = false }: { locale: string; withTariff?: boolean }) {
  const t = await getTranslations("trade.notes");
  const common = await getTranslations("common");
  return (
    <section aria-labelledby="trade-notes-title">
      <div className="page">
        <div aria-hidden="true" className="rule" data-reveal="rule" />
        <div className="py-band lg:grid lg:grid-cols-12 lg:gap-x-8">
          <h2 id="trade-notes-title" className="eyebrow kicker font-sans lg:col-span-4 lg:self-start lg:pt-1">
            {t("title")}
          </h2>
          <div className="mt-8 lg:col-span-8 lg:mt-0">
            <ul className="max-w-2xl space-y-3 text-small text-mist">
              <li>{t("value")}</li>
              <li>{t("window")}</li>
              <li>{t("duty")}</li>
              <li>{t("release")}</li>
              <li>{common("informational")}</li>
            </ul>
            <p className="mt-8 text-small">
              <span className="text-mist-soft">{common("sources")}: </span>
              <SourceLink href="https://www.census.gov/data/developers/data-sets/international-trade.html">{t("sourceCensus")}</SourceLink>
              {withTariff && (
                <>
                  {" · "}
                  <SourceLink href="https://hts.usitc.gov/">{t("sourceUsitc")}</SourceLink>
                </>
              )}
            </p>
            <p className="mt-4 max-w-2xl text-caption text-mist-soft">
              {t("census")}
              {locale !== "en" && (
                <span lang="en" className="mt-1 block">
                  {t("censusOfficial")}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
