import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { getPathname, Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { SourceLink } from "@/components/external-link";
import { FinalCta } from "@/components/home/sections";
import { TradeFilters } from "@/components/trade/trade-filters";
import { TrendChart } from "@/components/trade/trend-chart";
import { PortList, ProductHeader, ProductList, SectionTitle, StatTile, SupplierHeader, SupplierList, deltaOf } from "@/components/trade/blocks";
import { DataNotes, TradeLead, TradeLoading, TradeMessage, chartLabels, countryOptions, filterLabels } from "@/components/trade/trade-ui";
import { getProductView } from "@/lib/trade/analysis";
import { TradeDataError, censusConfigured } from "@/lib/trade/census";
import { TURKIYE, countryByIso, countryName, type Country } from "@/lib/trade/countries";
import { basisLabel, monthLabel, pct, usdCompact, windowLabel } from "@/lib/trade/format";
import { getHs, hsAncestors, hsLabel, normalizeHs, type HsCode } from "@/lib/trade/hs";
import { buildMetadata } from "@/lib/seo";
import { productHref } from "@/lib/trade/links";

type Props = PageProps<"/[locale]/trade-data/[hs]">;

async function resolve(props: Props) {
  const { locale, hs: raw } = (await props.params) as {
    locale: Locale;
    hs: string;
  };
  const sp = await props.searchParams;
  const code = normalizeHs(decodeURIComponent(raw));
  const hs = code ? getHs(code) : null;
  const country = countryByIso(typeof sp.country === "string" ? sp.country : null) ?? TURKIYE;
  return { locale, raw, code, hs, country };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale, hs, country } = await resolve(props);
  if (!hs) return {};
  const t = await getTranslations({ locale, namespace: "meta.tradeProduct" });
  const label = hsLabel(hs, locale);
  return buildMetadata({
    locale,
    href: { pathname: "/trade-data/[hs]", params: { hs: hs.code } },
    title: t("title", { code: hs.code, country: countryName(country, locale) }),
    description: t("description", {
      label: label.length > 140 ? `${label.slice(0, 137)}…` : label,
    }),
  });
}

export default async function TradeProductPage(props: Props) {
  const { locale, raw, code, hs, country } = await resolve(props);
  if (!hs || !code) notFound();
  if (code !== raw) {
    permanentRedirect(getPathname({ locale, href: productHref(code, country.iso2) }));
  }
  const t = await getTranslations("trade");
  const label = hsLabel(hs, locale);
  const englishTitle = locale === "tr" && hs.level > 2;

  return (
    <>
      <div className="border-b border-line bg-ivory">
        <div className="page pt-10 pb-10 sm:pt-14 sm:pb-14">
          <nav aria-label={t("product.backToOverview")} className="text-[0.875rem] text-mist">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <li>
                <Link href="/trade-data" className="link">
                  {t("product.backToOverview")}
                </Link>
              </li>
              {hsAncestors(hs.code).map((a) => (
                <li key={a.code} className="flex items-center gap-2">
                  <span aria-hidden="true">/</span>
                  <Link href={productHref(a.code, country.iso2)} className="link">
                    {a.code}
                  </Link>
                </li>
              ))}
              <li className="flex items-center gap-2" aria-current="page">
                <span aria-hidden="true">/</span>
                {hs.code}
              </li>
            </ol>
          </nav>
          <p className="mt-6 eyebrow text-brass-deep">{t("product.eyebrow", { code: hs.code })}</p>
          <h1 className="mt-3 max-w-4xl text-display-lg" lang={englishTitle ? "en" : undefined}>
            {label}
          </h1>
          <p className="mt-4 text-[0.9375rem] text-mist">
            {hs.level > 2 &&
              t("product.chapter", {
                code: hs.chapter.code,
                name: locale === "tr" ? hs.chapter.nameTr : hs.chapter.nameEn,
              })}
            {englishTitle && <span className="block text-[0.8125rem]">{t("product.officialName")}</span>}
          </p>
          <div className="mt-8 max-w-4xl">
            <TradeFilters
              action={getPathname({ locale, href: "/trade-data" })}
              country={country.iso2}
              hs={hs.code}
              countries={countryOptions(locale)}
              labels={await filterLabels()}
            />
          </div>
        </div>
      </div>

      {censusConfigured() ? (
        <Suspense key={`${hs.code}-${country.code}`} fallback={<TradeLoading label={t("loading")} />}>
          <ProductSection hs={hs} country={country} locale={locale} />
        </Suspense>
      ) : (
        <TradeMessage>{t("errors.notConfigured")}</TradeMessage>
      )}

      <TradeLead context={{ hs: hs.code, country: country.iso2 }} />
      <DataNotes locale={locale} withTariff={hs.level === 6} />
      <FinalCta location="trade_product_final" title={t("ctaTitle")} body={t("ctaBody")} />
    </>
  );
}

const htsFormat = (c: string) => `${c.slice(0, 4)}.${c.slice(4, 6)}.${c.slice(6, 8)}`;

async function ProductSection({ hs, country, locale }: { hs: HsCode; country: Country; locale: Locale }) {
  const t = await getTranslations("trade");
  let data;
  try {
    data = await getProductView(hs.code, country.code, locale);
  } catch (error) {
    if (error instanceof TradeDataError) return <TradeMessage>{t("errors.unavailable")}</TradeMessage>;
    throw error;
  }
  if (!data) return <TradeMessage>{t("errors.unknownCode")}</TradeMessage>;

  const name = countryName(country, locale);
  const window = windowLabel(data.windows.cur.first, data.windows.cur.last, locale);
  const period = basisLabel(data.basis, locale);
  const labels = await chartLabels();
  const names = Object.fromEntries(data.suppliers.map((s) => [s.country.code, countryName(s.country, locale)]));
  const hrefFor = (code: string) => productHref(code, country.iso2);

  return (
    <section aria-label={t("product.eyebrow", { code: hs.code })} className="py-12 sm:py-16">
      <div className="page">
        <p className="text-[0.875rem] text-mist">{t("freshness", { month: monthLabel(data.latest, locale, "long") })}</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label={t("product.kpiWorld")}
            value={usdCompact(data.world.value, locale)}
            delta={deltaOf(data.world.growth, locale, t("overview.vsPrev"))}
          />
          <StatTile
            label={t("product.kpiSelected", { country: name })}
            value={usdCompact(data.selected.value, locale)}
            delta={deltaOf(data.selected.growth, locale, t("overview.vsPrev"))}
          />
          <StatTile
            label={t("product.kpiShare")}
            value={pct(data.selected.share, locale)}
            delta={
              data.selected.value > 0
                ? deltaOf(data.selected.share - data.selected.prevShare, locale, t("product.sharePrev"), { points: true })
                : null
            }
            note={
              data.selected.rank
                ? t("product.rank", {
                    rank: data.selected.rank,
                    total: data.partners,
                  })
                : t("product.noRank")
            }
          />
          <StatTile
            label={t("product.kpiDuty")}
            value={data.selected.dutyRate === null ? "–" : pct(data.selected.dutyRate, locale)}
            note={
              data.world.dutyRate !== null
                ? t("product.dutyWorld", {
                    rate: pct(data.world.dutyRate, locale),
                  })
                : undefined
            }
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <TrendChart
            points={data.world.monthly.map((p) => ({
              month: p.month,
              value: p.value,
            }))}
            locale={locale}
            title={t("product.chartWorld")}
            subtitle={t("product.chartSubtitle")}
            labels={labels}
            muted
          />
          <TrendChart
            points={data.selected.monthly.map((p) => ({
              month: p.month,
              value: p.value,
            }))}
            locale={locale}
            title={t("product.chartSelected", { country: name })}
            subtitle={t("product.chartSubtitle")}
            labels={labels}
          />
        </div>

        {data.suppliers.length > 0 && (
          <div className="mt-14">
            <SectionTitle as="h2" title={t("product.suppliersTitle")} intro={t("product.suppliersIntro", { window })} />
            <SupplierHeader
              labels={{
                country: t("cols.country"),
                value: t("cols.value"),
                share: t("cols.share"),
                growth: t("cols.growth"),
                duty: t("cols.duty"),
              }}
            />
            <SupplierList
              rows={data.suppliers}
              selected={country.code}
              locale={locale}
              names={names}
              labels={{
                value: t("cols.value"),
                share: t("cols.share"),
                growth: t("cols.growth"),
                duty: t("cols.duty"),
              }}
            />
          </div>
        )}

        {data.children.length > 0 && (
          <div className="mt-14">
            <SectionTitle as="h2" title={t("product.childrenTitle")} intro={t("product.childrenIntro", { period, country: name })} />
            <ProductHeader
              labels={{
                product: t("cols.product"),
                value: t("cols.value"),
                growth: t("cols.growth"),
                share: t("cols.usShare"),
              }}
            />
            <ProductList
              rows={data.children}
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
        )}

        {hs.level === 6 && (
          <div className="mt-14">
            <SectionTitle as="h2" title={t("product.tariffTitle")} intro={t("product.tariffIntro")} />
            {data.tariff?.length ? (
              <>
                <ul className="mt-6 divide-y divide-line rounded-sm border border-line bg-paper sm:hidden">
                  {data.tariff.map((l) => (
                    <li key={l.hts8} className="p-4">
                      <p className="flex items-baseline justify-between gap-3">
                        <span className="[font-variant-numeric:tabular-nums]">{htsFormat(l.hts8)}</span>
                        <span className="font-medium text-navy">
                          <span className="sr-only">{t("cols.rate")}: </span>
                          {/^free$/i.test(l.general) ? t("product.free") : l.general || "–"}
                        </span>
                      </p>
                      <p className="mt-1 text-[0.875rem] text-mist" lang="en">
                        {l.description}
                      </p>
                    </li>
                  ))}
                </ul>
                <div
                  className="mt-6 hidden overflow-x-auto rounded-sm border border-line bg-paper sm:block"
                  role="region"
                  aria-label={t("product.tariffTitle")}
                  tabIndex={0}
                >
                  <table className="w-full min-w-[36rem] text-[0.9375rem]">
                    <thead className="bg-sand text-left text-[0.8125rem] text-mist">
                      <tr>
                        <th scope="col" className="px-4 py-2.5 font-medium">
                          {t("cols.hts")}
                        </th>
                        <th scope="col" className="px-4 py-2.5 font-medium">
                          {t("cols.description")}
                        </th>
                        <th scope="col" className="px-4 py-2.5 text-right font-medium whitespace-nowrap">
                          {t("cols.rate")}
                        </th>
                        <th scope="col" className="px-4 py-2.5 text-right font-medium">
                          {t("cols.units")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.tariff.map((l) => (
                        <tr key={l.hts8} className="border-t border-line align-top">
                          <td className="px-4 py-3 whitespace-nowrap [font-variant-numeric:tabular-nums]">{htsFormat(l.hts8)}</td>
                          <td className="px-4 py-3 text-graphite" lang="en">
                            {l.description}
                          </td>
                          <td className="px-4 py-3 text-right font-medium whitespace-nowrap text-navy">
                            {/^free$/i.test(l.general) ? t("product.free") : l.general || "–"}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap text-mist">{l.units.join(", ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="mt-4 text-mist">{t("product.tariffNone")}</p>
            )}
            <p className="mt-3 text-[0.9375rem]">
              <SourceLink href={`https://hts.usitc.gov/search?query=${hs.code}`}>{t("product.tariffLink")}</SourceLink>
            </p>
          </div>
        )}

        {data.ports.length > 0 && (
          <div className="mt-14 max-w-3xl">
            <SectionTitle as="h2" title={t("product.portsTitle")} intro={t("product.portsIntro", { country: name })} />
            <PortList rows={data.ports} locale={locale} labels={{ share: t("cols.share"), vessel: t("cols.vessel") }} />
          </div>
        )}
      </div>
    </section>
  );
}
