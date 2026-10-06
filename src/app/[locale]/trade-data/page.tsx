import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { getPathname, Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { FinalCta } from "@/components/home/sections";
import { TradeFilters } from "@/components/trade/trade-filters";
import { TrendChart } from "@/components/trade/trend-chart";
import { ChangeList, PortList, ProductHeader, ProductList, SectionTitle, StatRow, StatTile, deltaOf } from "@/components/trade/blocks";
import { DataNotes, TradeLead, TradeLoading, TradeMessage, chartLabels, countryOptions, filterLabels } from "@/components/trade/trade-ui";
import { getCountryOverview } from "@/lib/trade/analysis";
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
      <div className="page">
        <div className="pt-band pb-band">
          <p className="eyebrow kicker">{t("eyebrow")}</p>
          <h1 className="mt-6 max-w-[22ch] text-display-xl">{t("title")}</h1>
          <p className="mt-8 max-w-2xl text-lead text-mist">{t("intro")}</p>
          <div className="mt-12 max-w-4xl">
            <TradeFilters
              action={getPathname({ locale, href: "/trade-data" })}
              country={country.iso2}
              query={query}
              countries={countryOptions(locale)}
              labels={await filterLabels()}
            />
          </div>
        </div>
        <div aria-hidden="true" className="rule" />
      </div>

      {query && <SearchResults query={query} locale={locale} country={country} />}

      <Suspense key={country.code} fallback={<TradeLoading label={t("loading")} />}>
        <Overview country={country} locale={locale} />
      </Suspense>

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
    <section aria-labelledby="trade-search-title">
      <div className="page pt-band">
        <h2 id="trade-search-title" className="text-display-md">
          {t("search.title", { query })}
        </h2>
        {results.length ? (
          <ul className="figures mt-8 max-w-4xl border-t border-navy">
            {results.map((r) => (
              <li key={r.code} className="border-b border-line py-4">
                <Link
                  href={productHref(r.code, country.iso2)}
                  className="group text-small text-navy"
                  lang={locale === "tr" && r.level > 2 ? "en" : undefined}
                >
                  <span className="mr-2 font-semibold">{r.code}</span>
                  <span className="underline decoration-transparent underline-offset-[0.26em] transition-[text-decoration-color] duration-200 group-hover:decoration-brass group-focus-visible:decoration-brass">
                    {r.label}
                  </span>
                </Link>
                <p className="mt-1 text-caption text-mist-soft">
                  {t("search.meta", {
                    year: HS_BASIS_YEAR,
                    value: usdCompact(r.usImports, locale),
                  })}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-mist">{t("search.empty", { query })}</p>
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
    console.error("[trade] overview failed", error);
    return <TradeMessage>{t("errors.unavailable")}</TradeMessage>;
  }
  const name = countryName(country, locale);
  const window = windowLabel(data.windows.cur.first, data.windows.cur.last, locale);
  const period = basisLabel(data.basis, locale);
  const labels = await chartLabels();
  const hrefFor = (code: string) => productHref(code, country.iso2);

  return (
    <section aria-labelledby="trade-overview-title">
      <div className="page py-section">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <div>
            <h2 id="trade-overview-title" className="text-display-lg">
              {t("overview.title", { country: name })}
            </h2>
            <p className="mt-4 text-mist">{t("overview.intro", { window })}</p>
          </div>
          <p className="shrink-0 text-caption text-mist-soft">{t("freshness", { month: monthLabel(data.latest, locale, "long") })}</p>
        </div>

        {data.value === 0 ? (
          <p className="mt-10 text-mist">{t("overview.noData", { country: name })}</p>
        ) : (
          <>
            <div className="mt-12">
              <StatRow>
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
              </StatRow>
            </div>

            <div className="mt-20 grid gap-x-16 gap-y-16 lg:grid-cols-2">
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

            <div className="mt-24">
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

            <div className="mt-24 grid gap-x-16 gap-y-20 lg:grid-cols-2">
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
              <div className="mt-24 max-w-3xl">
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
