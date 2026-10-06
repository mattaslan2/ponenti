import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { getPathname, Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { FinalCta } from "@/components/home/sections";
import { TradeFilters } from "@/components/trade/trade-filters";
import { TrendChart } from "@/components/trade/trend-chart";
import { ChangeList, PortList, ProductHeader, ProductList, SectionTitle, StatTile, deltaOf } from "@/components/trade/blocks";
import { DataNotes, TradeLead, TradeLoading, TradeMessage, chartLabels, countryOptions, filterLabels } from "@/components/trade/trade-ui";
import { getCountryOverview } from "@/lib/trade/analysis";
import { TradeDataError, censusConfigured } from "@/lib/trade/census";
import { TURKIYE, countryByIso, countryName, type Country } from "@/lib/trade/countries";
import { basisLabel, monthLabel, pct, usdCompact, windowLabel } from "@/lib/trade/format";
import { HS_BASIS_YEAR, searchHs } from "@/lib/trade/hs";
import { buildMetadata } from "@/lib/seo";
import { productHref } from "@/lib/trade/links";

export async function generateMetadata({ params }: PageProps<"/[locale]/trade-data">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "meta.trade" });
  return buildMetadata({
    locale,
    href: "/trade-data",
    title: t("title"),
    description: t("description"),
  });
}

export default async function TradeDataPage({ params, searchParams }: PageProps<"/[locale]/trade-data">) {
  const locale = (await params).locale as Locale;
  const sp = await searchParams;
  const country = countryByIso(typeof sp.country === "string" ? sp.country : null) ?? TURKIYE;
  const query = typeof sp.q === "string" ? sp.q.slice(0, 80).trim() : "";
  const t = await getTranslations("trade");

  return (
    <>
      <div className="border-b border-line bg-ivory">
        <div className="page pt-12 pb-10 sm:pt-20 sm:pb-14">
          <p className="eyebrow text-brass-deep">{t("eyebrow")}</p>
          <h1 className="mt-3 max-w-4xl text-display-xl">{t("title")}</h1>
          <p className="mt-5 max-w-2xl text-lead text-mist">{t("intro")}</p>
          <div className="mt-8 max-w-4xl">
            <TradeFilters
              action={getPathname({ locale, href: "/trade-data" })}
              country={country.iso2}
              query={query}
              countries={countryOptions(locale)}
              labels={await filterLabels()}
            />
          </div>
        </div>
      </div>

      {query && <SearchResults query={query} locale={locale} country={country} />}

      {censusConfigured() ? (
        <Suspense key={country.code} fallback={<TradeLoading label={t("loading")} />}>
          <Overview country={country} locale={locale} />
        </Suspense>
      ) : (
        <TradeMessage>{t("errors.notConfigured")}</TradeMessage>
      )}

      <TradeLead context={{ country: country.iso2 }} />
      <DataNotes locale={locale} />
      <FinalCta location="trade_data_final" title={t("ctaTitle")} body={t("ctaBody")} />
    </>
  );
}

async function SearchResults({ query, locale, country }: { query: string; locale: Locale; country: Country }) {
  const t = await getTranslations("trade");
  const results = searchHs(query, locale, 15);
  return (
    <section aria-labelledby="trade-search-title" className="border-b border-line py-10 sm:py-12">
      <div className="page max-w-4xl">
        <h2 id="trade-search-title" className="text-display-sm">
          {t("search.title", { query })}
        </h2>
        {results.length ? (
          <ul className="mt-5 divide-y divide-line border-y border-line">
            {results.map((r) => (
              <li key={r.code} className="py-3">
                <Link
                  href={productHref(r.code, country.iso2)}
                  className="link text-[0.9375rem]"
                  lang={locale === "tr" && r.level > 2 ? "en" : undefined}
                >
                  <span className="mr-2 font-semibold text-cobalt [font-variant-numeric:tabular-nums]">{r.code}</span>
                  {r.label}
                </Link>
                <p className="mt-0.5 text-[0.8125rem] text-mist">
                  {t("search.meta", {
                    year: HS_BASIS_YEAR,
                    value: usdCompact(r.usImports, locale),
                  })}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-mist">{t("search.empty", { query })}</p>
        )}
      </div>
    </section>
  );
}

async function Overview({ country, locale }: { country: Country; locale: Locale }) {
  const t = await getTranslations("trade");
  let data;
  try {
    data = await getCountryOverview(country.code, locale);
  } catch (error) {
    if (error instanceof TradeDataError) return <TradeMessage>{t("errors.unavailable")}</TradeMessage>;
    throw error;
  }
  const name = countryName(country, locale);
  const window = windowLabel(data.windows.cur.first, data.windows.cur.last, locale);
  const period = basisLabel(data.basis, locale);
  const labels = await chartLabels();
  const hrefFor = (code: string) => productHref(code, country.iso2);

  return (
    <section aria-labelledby="trade-overview-title" className="py-12 sm:py-16">
      <div className="page">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="trade-overview-title" className="text-display-lg">
              {t("overview.title", { country: name })}
            </h2>
            <p className="mt-3 text-mist">{t("overview.intro", { window })}</p>
          </div>
          <p className="text-[0.875rem] text-mist">{t("freshness", { month: monthLabel(data.latest, locale, "long") })}</p>
        </div>

        {data.value === 0 ? (
          <p className="mt-8 text-mist">{t("overview.noData", { country: name })}</p>
        ) : (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile
                label={`${t("overview.kpiValue")} (${window})`}
                value={usdCompact(data.value, locale)}
                delta={deltaOf(data.growth, locale, t("overview.vsPrev"))}
              />
              <StatTile
                label={t("overview.kpiShare")}
                value={pct(data.share, locale)}
                note={
                  data.rank
                    ? t("overview.rank", {
                        rank: data.rank,
                        total: data.partners,
                      })
                    : undefined
                }
              />
              <StatTile
                label={t("overview.kpiDuty")}
                value={data.dutyRate === null ? "–" : pct(data.dutyRate, locale)}
                delta={
                  data.dutyRate !== null && data.prevDutyRate !== null
                    ? deltaOf(data.dutyRate - data.prevDutyRate, locale, t("overview.vsPrev"), { upIsGood: false, points: true })
                    : null
                }
                note={
                  data.prevDutyRate !== null
                    ? t("overview.dutyPrev", {
                        rate: pct(data.prevDutyRate, locale),
                      })
                    : undefined
                }
              />
              <StatTile
                label={t("overview.kpiVessel")}
                value={data.vesselShare === null ? "–" : pct(data.vesselShare, locale, { digits: 0 })}
                note={
                  data.airShare !== null
                    ? t("overview.airShare", {
                        rate: pct(data.airShare, locale, { digits: 0 }),
                      })
                    : undefined
                }
              />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <TrendChart
                points={data.monthly.map((p) => ({
                  month: p.month,
                  value: p.value,
                }))}
                locale={locale}
                title={t("overview.trendTitle")}
                subtitle={t("overview.trendSubtitle")}
                labels={labels}
              />
              <TrendChart
                points={data.monthly.map((p) => ({
                  month: p.month,
                  value: p.duty,
                }))}
                locale={locale}
                kind="pct"
                title={t("overview.dutyTitle")}
                subtitle={t("overview.dutySubtitle")}
                labels={{ ...labels, value: t("cols.duty") }}
              />
            </div>

            <div className="mt-14">
              <SectionTitle title={t("overview.productsTitle")} intro={t("overview.productsIntro", { period })} />
              <ProductHeader
                labels={{
                  product: t("cols.product"),
                  value: t("cols.value"),
                  growth: t("cols.growth"),
                  share: t("cols.usShare"),
                }}
              />
              <ProductList
                rows={data.topProducts}
                locale={locale}
                hrefFor={hrefFor}
                labels={{
                  value: t("cols.value"),
                  growth: t("cols.growth"),
                  share: t("cols.usShare"),
                  code: t("cols.code"),
                }}
              />
            </div>

            <div className="mt-14 grid gap-10 lg:grid-cols-2">
              <div>
                <SectionTitle title={t("overview.gainersTitle")} intro={t("overview.changeIntro", { period })} />
                <ChangeList rows={data.gainers} locale={locale} hrefFor={hrefFor} />
              </div>
              <div>
                <SectionTitle title={t("overview.declinersTitle")} intro={t("overview.changeIntro", { period })} />
                <ChangeList rows={data.decliners} locale={locale} hrefFor={hrefFor} negative />
              </div>
            </div>

            {data.ports.length > 0 && (
              <div className="mt-14 max-w-3xl">
                <SectionTitle title={t("overview.portsTitle")} intro={t("overview.portsIntro", { country: name })} />
                <PortList rows={data.ports} locale={locale} labels={{ share: t("cols.share"), vessel: t("cols.vessel") }} />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
