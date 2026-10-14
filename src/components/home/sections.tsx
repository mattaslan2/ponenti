import type { CSSProperties } from "react";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Cpu, FolderLock, KeyRound, PenLine, ScrollText, UserRound } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { Section } from "@/components/section";
import { CompassCard } from "@/components/brand/compass-card";
import { ArrowLink, BookButton, RiskTestLink, WhatsAppButton } from "@/components/cta";
import { SourceLink } from "@/components/external-link";
import { Confirm, ReplaceWithReal, ShowAfterEOConfirms } from "@/components/placeholders";
import { SampleReport } from "@/components/report/sample-report";
import { Sparkline } from "@/components/trade/sparkline";
import { findArticleByKey, listArticles } from "@/lib/content";
import { formatDate, formatNumber, formatUsd, priceArgs } from "@/lib/format";
import { MARKET_RULES, SECTION_301_ARTICLE_KEY } from "@/lib/market";
import { pricing } from "@/lib/pricing";
import { isPlaceholder, site } from "@/lib/site";
import { sources } from "@/lib/sources";
import { SUPPORT_RULES } from "@/lib/support";
import { getMarketFacts, type PortStat } from "@/lib/trade/analysis";
import { basisLabel, monthLabel, pct, usdCompact, windowLabel } from "@/lib/trade/format";
import { parseYm } from "@/lib/trade/periods";
import { shortProductName } from "@/lib/trade/short-names";
import { cn } from "@/lib/utils";

async function currentLocale() {
  return (await getLocale()) as Locale;
}

const em = (chunks: React.ReactNode) => <em>{chunks}</em>;

/**
 * The hero says who we are, what we do, for whom and what it costs, then asks
 * for one action. Nothing in it claims trust: proof has its own section below.
 * The compass card is the only image, and it is the name: ponente, the west.
 */
export async function Hero() {
  const locale = await currentLocale();
  const t = await getTranslations("home.hero");
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div className="page relative">
        <CompassCard
          locale={locale}
          rays
          className="compass-live pointer-events-none absolute top-1/2 right-0 hidden size-[clamp(30rem,46vw,42rem)] translate-x-[38%] -translate-y-1/2 lg:block"
        />
        <div className="relative pt-14 pb-band sm:pt-band lg:max-w-[38rem] xl:max-w-[46rem]">
          <p className="eyebrow kicker enter">{t("eyebrow")}</p>
          <h1 id="hero-title" className="enter enter-1 mt-8 text-display-xl">
            {t.rich("title", { em })}
          </h1>
          <p className="enter enter-2 mt-8 max-w-[34rem] text-lead text-navy">{t("subtitle")}</p>
          <p className="enter enter-3 mt-6 max-w-[34rem] text-small text-mist">{t("price", priceArgs(locale, pricing))}</p>
          <div id="hero-actions" className="enter enter-4 mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <BookButton location="hero" />
            <WhatsAppButton location="hero" />
            <RiskTestLink location="hero" className="self-start sm:ml-3 sm:self-auto" />
          </div>
        </div>
      </div>
    </section>
  );
}

/** "NORFOLK-NEWPORT NEWS, VA" → "Norfolk"; "JFK INTERNATIONAL AIRPORT, NY" → "JFK". */
function shortPortName(port: PortStat): string {
  const city = port.name.replace(/,\s*[A-Z]{2}$/, "").split(/-|\//)[0].trim();
  if (/\bJFK\b/.test(city)) return "JFK";
  return city
    .toLowerCase()
    .replace(/\s+international airport$/, "")
    .replace(/\b([a-z])/g, (c) => c.toUpperCase());
}

function joinList(items: string[], locale: Locale): string {
  return new Intl.ListFormat(locale === "tr" ? "tr-TR" : "en-US", { style: "long", type: "conjunction" }).format(items);
}

/**
 * The market, in six figures, between the hero and the proof: what Türkiye ships
 * to the US, what it pays at the border and where it lands. Four figures come
 * from the Census snapshot behind the trade pages and move with it every month;
 * the Section 301 rate and the FDA count are typed in with their sources
 * (src/lib/market.ts). The header names Türkiye as the first market, so the
 * section stays true as other countries are added.
 */
export async function Market() {
  const locale = await currentLocale();
  const t = await getTranslations("home.market");
  const [m, article] = await Promise.all([getMarketFacts(locale), findArticleByKey(SECTION_301_ARTICLE_KEY, locale)]);
  const month = monthLabel(m.latest, locale, "long");
  const first = m.monthly[0];
  const last = m.monthly[m.monthly.length - 1];
  const rate = (value: number | null, digits = 1) => (value === null ? "–" : pct(value, locale, { digits }));
  const ports = joinList(m.topPorts.map(shortPortName), locale);
  const airport = m.topAirport ? shortPortName(m.topAirport) : "JFK";
  const figures = [
    {
      key: "f1",
      value: usdCompact(m.value, locale),
      unit: t("f1.unit", { window: windowLabel(m.windows.cur.first, m.windows.cur.last, locale) }),
      text: t("f1.text", { growth: m.growth === null ? "–" : pct(m.growth, locale, { signed: true }) }),
      source: t("f1.source"),
      href: sources.censusTradeApi,
      chart: {
        values: m.monthly.map((p) => p.value),
        label: t("f1.chart", {
          first: monthLabel(parseYm(first.month), locale),
          last: monthLabel(parseYm(last.month), locale),
          from: usdCompact(first.value, locale),
          to: usdCompact(last.value, locale),
        }),
      },
    },
    {
      key: "f2",
      value: rate(m.dutyRate),
      share: m.dutyRate,
      unit: t("f2.unit"),
      text: t("f2.text", { rate: rate(m.dutyRate2y) }),
      source: t("f2.source"),
      href: sources.censusTradeApi,
    },
    {
      key: "f3",
      value: pct(MARKET_RULES.section301.rate, locale),
      share: MARKET_RULES.section301.rate,
      unit: t("f3.unit"),
      text: t("f3.text", { date: formatDate(MARKET_RULES.section301.effective, locale) }),
      source: t("f3.source", { citation: MARKET_RULES.section301.citation }),
      href: sources.frSection301ForcedLabor,
    },
    {
      key: "f4",
      value: rate(m.vesselShare, 0),
      share: m.vesselShare,
      unit: t("f4.unit"),
      text: t("f4.text", { air: rate(m.airShare, 0) }),
      source: t("f4.source"),
      href: sources.censusTradeApi,
    },
    {
      key: "f5",
      value: pct(m.topPortsShare, locale, { digits: 0 }),
      share: m.topPortsShare,
      unit: t("f5.unit"),
      text: t("f5.text", { ports, airport }),
      source: t("f5.source"),
      href: sources.censusTradeApi,
    },
    {
      key: "f6",
      value: formatNumber(MARKET_RULES.fsvp.noFsvpCitations, locale),
      unit: t("f6.unit", { year: String(MARKET_RULES.fsvp.fiscalYear) }),
      text: t("f6.text"),
      source: t("f6.source", { year: String(MARKET_RULES.fsvp.fiscalYear) }),
      href: sources.fdaInspectionObservations,
    },
  ];
  const lines = m.topProducts.map((p) => shortProductName(p.code, locale));
  return (
    <Section
      id="market"
      layout="split"
      eyebrow={t("eyebrow")}
      title={t.rich("title", { em })}
      intro={t("intro", { month })}
      aside={
        <div className="flex flex-col items-start gap-1">
          <ArrowLink href="/trade-data" data-track="cta_click" data-track-label="market_trade_data" data-track-location="market">
            {t("link")}
          </ArrowLink>
          {article && (
            <ArrowLink
              href={{ pathname: "/insights/[slug]", params: { slug: article.slug } }}
              data-track="cta_click"
              data-track-label="market_article"
              data-track-location="market"
            >
              {t("article")}
            </ArrowLink>
          )}
        </div>
      }
    >
      <dl className="grid border-t border-line sm:grid-cols-2">
        {figures.map((f, i) => (
          <div
            key={f.key}
            data-reveal
            className={cn("flex flex-col border-b border-line py-8 sm:py-10", i % 2 === 1 ? "sm:border-l sm:pl-8 lg:pl-10" : "sm:pr-8 lg:pr-10")}
          >
            <dt className="eyebrow">{t(`${f.key}.kicker`)}</dt>
            <dd className="mt-5">
              <span
                data-count
                className="block font-display text-[clamp(2.25rem,1.7rem+1.9vw,3rem)] leading-none font-medium tracking-[-0.015em] whitespace-nowrap text-navy"
              >
                {f.value}
              </span>
              <span className="mt-3 block text-small text-mist-soft">{f.unit}</span>
            </dd>
            {f.chart && (
              <dd className="mt-5">
                <Sparkline values={f.chart.values} label={f.chart.label} />
              </dd>
            )}
            {"share" in f && typeof f.share === "number" && (
              <dd className="mt-5 max-w-[15rem]">
                {/* The share as a brass line out of a full one; it fills when the block shows. */}
                <span aria-hidden="true" className="meter block" style={{ "--value": Math.min(1, f.share) } as CSSProperties} />
              </dd>
            )}
            <dd className="mt-5 max-w-xs flex-1 text-small text-mist">{f.text}</dd>
            <dd className="mt-6 text-caption text-mist-soft">
              <SourceLink href={f.href}>{f.source}</SourceLink>
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-8">
        <p className="eyebrow">{t("linesLabel", { period: basisLabel(m.basis, locale) })}</p>
        {/* The largest lines pass by slowly (CSS); under reduced motion they wrap as a plain list. */}
        <div className="ticker mt-4 border-b border-line pb-4" aria-label={lines.join(", ")}>
          <div className="ticker-track">
            {[false, true].map((copy) => (
              <ul key={String(copy)} aria-hidden={copy || undefined} className={cn("flex shrink-0 items-baseline pr-10", copy && "ticker-copy")}>
                {lines.map((line) => (
                  <li key={line} className="flex items-baseline whitespace-nowrap font-display text-[1.375rem] leading-none font-medium text-navy">
                    {line}
                    <span aria-hidden="true" className="mx-5 inline-block size-1.5 translate-y-[-0.2em] rounded-full bg-brass" />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
        <p className="mt-6 max-w-3xl text-caption text-mist-soft">{t("note", { month, date: formatDate(MARKET_RULES.checkedOn, locale) })}</p>
      </div>
    </Section>
  );
}

/**
 * Proof, as its own section: things a visitor can check today, each with the
 * link that checks it. No adjectives, no badges, no "trusted by".
 *
 * A card is here only if its claim can be checked. The founder's background is
 * checkable on LinkedIn and nowhere on this site, so that card appears when
 * site.founder.linkedin is set; until then the section says "three", not "four".
 */
export async function Trust() {
  const locale = await currentLocale();
  const t = await getTranslations("home.trust");
  const common = await getTranslations("common");
  const name = site.founder.name[locale];
  const linkedin = isPlaceholder(site.founder.linkedin) ? null : site.founder.linkedin;
  const cards = [
    { key: "prices", href: "/services" },
    { key: "limits", href: { pathname: "/", hash: "limits" } },
    { key: "sources", href: "/insights" },
  ] as const;
  const linkClass = "link mt-2 inline-flex min-h-11 items-center gap-2 text-small font-medium";
  const track = (key: string) => ({ "data-track": "cta_click", "data-track-label": `proof_${key}`, "data-track-location": "proof" });
  return (
    <Section id="proof" layout={linkedin ? "split" : "stack"} space="band" eyebrow={t("eyebrow")} title={t(linkedin ? "title" : "titleThree")}>
      <ul className={cn("grid gap-x-12 gap-y-12", linkedin ? "sm:grid-cols-2" : "md:grid-cols-3")}>
        {linkedin && (
          <li data-reveal className="border-t border-line pt-6">
            <p className="eyebrow">{t("founder.label")}</p>
            <h3 className="mt-4 text-display-sm">{t("founder.title")}</h3>
            <p className="mt-3 text-small text-mist">
              <Confirm note="founder credential line">{t("founder.body", { name })}</Confirm>
            </p>
            <a href={linkedin} target="_blank" rel="noopener noreferrer me" className={linkClass} {...track("founder")}>
              {t("founder.link")}
              <ArrowUpRight aria-hidden="true" className="nudge-up size-4 shrink-0" />
              <span className="sr-only"> {common("opensNewTab")}</span>
            </a>
          </li>
        )}
        {cards.map(({ key, href }) => (
          <li key={key} data-reveal className="border-t border-line pt-6">
            <p className="eyebrow">{t(`${key}.label`)}</p>
            <h3 className="mt-4 text-display-sm">{t(`${key}.title`)}</h3>
            <p className="mt-3 max-w-md text-small text-mist">{t(`${key}.body`)}</p>
            <ArrowLink href={href} className="mt-2 text-small" {...track(key)}>
              {t(`${key}.link`)}
            </ArrowLink>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export async function Doors() {
  const t = await getTranslations("home.doors");
  const doors = [
    { key: "us", href: { pathname: "/services", hash: "plans" } },
    { key: "tr", href: { pathname: "/services", hash: "cash-desk" } },
  ] as const;
  return (
    <Section id="doors" eyebrow={t("eyebrow")} title={t("title")}>
      <div className="grid border-t border-line md:grid-cols-2">
        {doors.map(({ key, href }, i) => (
          <div key={key} data-reveal className={cn("border-b border-line", i === 0 ? "md:border-r md:pr-12 lg:pr-16" : "md:pl-12 lg:pl-16")}>
            <Link
              href={href}
              data-track="cta_click"
              data-track-label={`door_${key}`}
              data-track-location="doors"
              className="hover-rule flex h-full flex-col py-10 md:py-14"
            >
              <h3 className="text-display-md">{t(`${key}.title`)}</h3>
              <p className="mt-5 max-w-md flex-1 text-mist">{t(`${key}.body`)}</p>
              <span className="mt-10 inline-flex items-center gap-2 text-[0.9375rem] font-medium text-navy">
                {t(`${key}.link`)}
                <ArrowRight aria-hidden="true" className="nudge size-4" />
              </span>
            </Link>
          </div>
        ))}
      </div>
    </Section>
  );
}

export async function FactsBand() {
  const locale = await currentLocale();
  const t = await getTranslations("home.facts");
  const facts = [
    { key: "f1", value: formatUsd(pricing.form5472Penalty, locale), unit: t("f1.unit"), href: sources.irs5472 },
    { key: "f2", value: t("f2.value"), unit: t("f2.unit"), href: sources.frImporterData },
    { key: "f3", value: t("f3.value"), unit: t("f3.unit"), href: null },
  ] as const;
  return (
    <Section id="facts" tone="navy" eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")}>
      <div className="grid border-t border-line-navy md:grid-cols-3">
        {facts.map(({ key, value, unit, href }, i) => (
          <div
            key={key}
            data-reveal
            className={cn(
              "flex flex-col border-b border-line-navy py-10 md:border-b-0 md:py-12",
              i > 0 && "md:border-l md:border-line-navy md:pl-10",
              i < facts.length - 1 && "md:pr-10",
            )}
          >
            <p className="eyebrow">{t(`${key}.kicker`)}</p>
            <p className="mt-6 text-ivory">
              <span data-count={key === "f1" || undefined} className="block font-display text-[clamp(2.75rem,1.9rem+2.9vw,4.25rem)] leading-none font-medium tracking-[-0.02em] whitespace-nowrap">
                {value}
              </span>
              <span className="mt-3 block text-small text-ivory-soft">{unit}</span>
            </p>
            <p className="mt-6 max-w-xs flex-1 text-ivory-dim">{t(`${key}.text`)}</p>
            <p className="mt-8 text-caption text-ivory-soft">
              {href ? (
                <SourceLink href={href}>{t(`${key}.source`)}</SourceLink>
              ) : (
                <Link href={{ pathname: "/services", hash: "cash-desk" }} className="link">
                  {t(`${key}.source`)}
                </Link>
              )}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/** The offer as a price list: name, scope, price. One row, one link. */
export async function Offer() {
  const locale = await currentLocale();
  const t = await getTranslations("home.offer");
  const common = await getTranslations("common");
  const f = (n: number) => formatUsd(n, locale);
  const rows = [
    { title: t("check.title"), body: t("check.body"), price: f(pricing.check), per: null, note: t("check.note"), hash: "check" },
    {
      title: t("plans.title"),
      body: t("plans.body"),
      price: f(pricing.plans.essentials),
      per: common("perMonth"),
      note: t("plans.note", { standard: f(pricing.plans.standard), complete: f(pricing.plans.complete) }),
      hash: "plans",
    },
    { title: t("cash.title"), body: t("cash.body"), price: f(pricing.cashDesk.monthly), per: common("perMonth"), note: null, hash: "cash-desk" },
    { title: t("order.title"), body: t("order.body"), price: f(pricing.orderDesk.monthly), per: common("perMonth"), note: null, hash: "order-desk" },
  ];
  return (
    <Section
      id="offer"
      layout="split"
      rule={false}
      eyebrow={t("eyebrow")}
      title={t("title")}
      intro={t("intro")}
      aside={
        <ArrowLink href="/services" data-track="cta_click" data-track-label="see_pricing" data-track-location="offer">
          {t("more")}
        </ArrowLink>
      }
    >
      <ul className="border-t border-line">
        {rows.map((row) => (
          <li key={row.hash} data-reveal className="border-b border-line">
            <Link
              href={{ pathname: "/services", hash: row.hash }}
              className="hover-rule grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-3 py-8 sm:grid-cols-12 sm:gap-x-8 sm:py-10"
            >
              <h3 className="text-display-sm sm:col-span-4">{row.title}</h3>
              <p className="order-3 col-span-2 text-small text-mist sm:order-none sm:col-span-5">{row.body}</p>
              <p className="text-right sm:col-span-3">
                <span className="font-display text-[2rem] leading-none font-medium whitespace-nowrap text-navy">{row.price}</span>
                {row.per && <span className="ml-0.5 text-small text-mist-soft">{row.per}</span>}
                {row.note && <span className="mt-2 block text-caption text-brass-deep">{row.note}</span>}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/**
 * Export support: the promise, three sourced facts and the way into the
 * estimator. The facts are Türkiye's (the first program we cover), from the
 * Ministry of Trade's circulars and 2026 caps. English pages name the program
 * above the facts; Turkish pages need no label.
 */
export async function SupportFile() {
  const locale = await currentLocale();
  const t = await getTranslations("home.support");
  const facts = [
    { key: "f1", value: t("f1.value"), href: sources.trUnitRentCircular },
    { key: "f2", value: t("f2.value", { amount: formatNumber(SUPPORT_RULES.lines.rent.capTl, locale) }), href: sources.trLimits2026Branding },
    { key: "f3", value: t("f3.value"), href: sources.trUnitRentCircular },
  ] as const;
  return (
    <Section
      id="support"
      eyebrow={t("eyebrow")}
      title={t.rich("title", { em })}
      intro={t("intro")}
    >
      {t.has("program") && <p className="mb-6 max-w-2xl text-small text-mist">{t("program")}</p>}
      <div className="grid border-t border-line md:grid-cols-3">
        {facts.map(({ key, value, href }, i) => (
          <div
            key={key}
            data-reveal
            className={cn(
              "flex flex-col border-b border-line py-10 md:py-12",
              i > 0 && "md:border-l md:pl-10",
              i < facts.length - 1 && "md:pr-10",
            )}
          >
            <p className="eyebrow">{t(`${key}.kicker`)}</p>
            <p className="mt-6">
              <span data-count className="block font-display text-[clamp(2.25rem,1.7rem+1.9vw,3.25rem)] leading-none font-medium tracking-[-0.015em] whitespace-nowrap text-navy">
                {value}
              </span>
              <span className="mt-3 block text-small text-mist-soft">{t(`${key}.unit`)}</span>
            </p>
            <p className="mt-6 max-w-xs flex-1 text-mist">{t(`${key}.text`)}</p>
            <p className="mt-8 text-caption text-mist-soft">
              <SourceLink href={href}>{t(`${key}.source`)}</SourceLink>
            </p>
          </div>
        ))}
      </div>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-10">
        <ArrowLink
          href={{ pathname: "/support-file", hash: "estimate" }}
          data-track="cta_click"
          data-track-label="support_estimate"
          data-track-location="home_support"
        >
          {t("link")}
        </ArrowLink>
        <ArrowLink href={{ pathname: "/support-file", hash: "how" }}>{t("more")}</ArrowLink>
      </div>
    </Section>
  );
}

export async function Weekly() {
  const t = await getTranslations("home.weekly");
  return (
    <Section id="weekly" tone="sand" eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")}>
      <div data-reveal>
        <div className="sheet-lift">
          <SampleReport />
        </div>
        <p className="mt-6 text-caption text-mist-soft">{t("note")}</p>
      </div>
    </Section>
  );
}

export async function WhatWeDont() {
  const t = await getTranslations("home.dont");
  const items = ["i1", "i2", "i3", "i4", "i5"] as const;
  return (
    <Section id="limits" layout="split" rule={false} eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")}>
      <ol className="border-t border-line">
        {items.map((key, index) => (
          <li key={key} data-reveal className="grid gap-x-8 gap-y-3 border-b border-line py-8 max-lg:last:border-b-0 sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:py-10">
            <span aria-hidden="true" className="font-display text-[1.375rem] leading-[1.45] font-medium text-brass-deep">
              0{index + 1}
            </span>
            <div>
              <h3 className="text-display-sm">{t(`${key}.title`)}</h3>
              <p className="mt-3 max-w-xl text-mist">{t(`${key}.body`)}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/**
 * The three newest knowledge-center articles, as the list page shows them:
 * date, title, one line. The section shows the site is kept, not just built.
 */
export async function LatestInsights() {
  const locale = await currentLocale();
  const t = await getTranslations("home.insights");
  const common = await getTranslations("common");
  const articles = (await listArticles(locale)).slice(0, 3);
  if (articles.length === 0) return null;
  return (
    <Section
      id="insights"
      eyebrow={t("eyebrow")}
      title={t("title")}
      intro={t("intro")}
      aside={
        <ArrowLink href="/insights" data-track="cta_click" data-track-label="home_insights_all" data-track-location="home_insights">
          {t("all")}
        </ArrowLink>
      }
      layout="split"
    >
      <ul className="border-t border-line">
        {articles.map((a) => (
          <li key={a.slug} data-reveal className="border-b border-line">
            <Link
              href={{ pathname: "/insights/[slug]", params: { slug: a.slug } }}
              className="hover-rule grid gap-x-8 gap-y-3 py-8 sm:grid-cols-[9.5rem_minmax(0,1fr)_auto] sm:py-10"
            >
              <p className="figures text-caption text-mist-soft sm:pt-1.5">
                <time dateTime={a.updated}>{common("updated", { date: formatDate(a.updated, locale) })}</time>
              </p>
              <div>
                <h3 className="text-display-sm">{a.title}</h3>
                <p className="mt-3 max-w-xl text-small text-mist">{a.description}</p>
              </div>
              <span className="hidden pt-1.5 sm:block">
                <ArrowRight aria-hidden="true" className="nudge size-5 text-navy" />
                <span className="sr-only">{common("readMore")}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export async function YourData() {
  const t = await getTranslations("home.data");
  const items = [
    { key: "d1", icon: KeyRound, href: null },
    { key: "d2", icon: FolderLock, href: null },
    { key: "d3", icon: ScrollText, href: sources.ecfrSafeguards },
    { key: "d4", icon: PenLine, href: sources.ecfr7216 },
    { key: "d5", icon: Cpu, href: null },
    { key: "d6", icon: UserRound, href: null },
  ] as const;
  return (
    <Section id="your-data" layout="split" eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")}>
      <ul className="grid gap-x-12 gap-y-12 sm:grid-cols-2">
        {items.map(({ key, icon: Icon, href }) => (
          <li key={key} data-reveal className="border-t border-line pt-6">
            <Icon aria-hidden="true" className="size-5 text-brass-deep" />
            <h3 className="mt-5 font-sans text-title font-semibold">{t(`${key}.title`)}</h3>
            <p className="mt-2 text-small text-mist">{t(`${key}.body`)}</p>
            {href && (
              <p className="mt-3 text-caption text-mist-soft">
                <SourceLink href={href}>{t(`${key}.source` as "d3.source")}</SourceLink>
              </p>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}

export async function FounderTeaser() {
  const locale = await currentLocale();
  const t = await getTranslations("home.founder");
  const common = await getTranslations("common");
  const name = site.founder.name[locale];
  const hasPhoto = !isPlaceholder(site.founder.photo);
  return (
    <Section id="founder" layout="split" eyebrow={t("eyebrow")} title={<Confirm note="display name">{name}</Confirm>}>
      <div data-reveal className={cn("grid gap-10", hasPhoto && "sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-12")}>
        {hasPhoto && (
          <div className="relative aspect-[4/5] w-52 overflow-hidden rounded-xs bg-sand">
            <Image src={site.founder.photo} alt={name} fill sizes="208px" className="object-cover" />
          </div>
        )}
        <div className="max-w-2xl">
          <p className="text-lead text-navy">
            <Confirm note="bio draft">{t("body")}</Confirm>
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-10 gap-y-2">
            <ArrowLink href="/about">{t("more")}</ArrowLink>
            {!isPlaceholder(site.founder.linkedin) && (
              <a href={site.founder.linkedin} className="link inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-medium" target="_blank" rel="noopener noreferrer me">
                {t("linkedin")}
                <ArrowUpRight aria-hidden="true" className="nudge-up size-4" />
                <span className="sr-only"> {common("opensNewTab")}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}

/**
 * Proof slots: testimonials, client logos, case studies, client counts, results.
 * [REPLACE WITH REAL] Nothing renders for visitors until real, verifiable content
 * (with the client's written permission) is passed to <ReplaceWithReal>.
 */
export async function ProofSlots() {
  return (
    <div className="page space-y-3 empty:hidden">
      <ReplaceWithReal label="Testimonial from a named client, with written permission" />
      <ReplaceWithReal label="Client logos, with written permission" />
      <ReplaceWithReal label="Case study with real, verifiable results" />
    </div>
  );
}

export async function PenaltyPromise() {
  const locale = await currentLocale();
  const t = await getTranslations("home.promise");
  return (
    <ShowAfterEOConfirms>
      <Section id="promise" space="band" layout="split" eyebrow={t("title")}>
        <p className="max-w-2xl font-display text-display-md font-medium text-navy">{t("body", { cap: formatUsd(pricing.penaltyPromiseCap, locale) })}</p>
      </Section>
    </ShowAfterEOConfirms>
  );
}

/**
 * The closing band, on every page: one title, the one primary action, and on
 * the right either the three questions of the first call or a page's own line.
 */
export async function FinalCta({ title, body, location }: { title?: string; body?: string; location: string }) {
  const t = await getTranslations("home.final");
  const questions = ["q1", "q2", "q3"] as const;
  return (
    <section aria-labelledby={`${location}-cta-title`} className="bg-sand">
      <div className="page py-section lg:grid lg:grid-cols-12 lg:gap-x-8">
        <div className="lg:col-span-7 lg:pr-8">
          <p className="eyebrow kicker">{t("eyebrow")}</p>
          <h2 id={`${location}-cta-title`} className="mt-6 max-w-[18ch] text-display-lg">
            {title ?? t("title")}
          </h2>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <BookButton location={location} />
            <WhatsAppButton location={location} />
            <RiskTestLink location={location} className="self-start sm:ml-3 sm:self-auto" />
          </div>
          <p className="mt-6 text-caption text-mist-soft">{t("reply")}</p>
        </div>
        <div className="mt-stack lg:col-span-5 lg:mt-0 lg:pt-10">
          {body ? (
            <p className="max-w-md text-lead text-mist">{body}</p>
          ) : (
            <>
              <p className="eyebrow">{t("lede")}</p>
              <ol className="mt-5 border-t border-navy/25">
                {questions.map((q, i) => (
                  <li key={q} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-4 border-b border-navy/25 py-5">
                    <span aria-hidden="true" className="font-display text-[1.25rem] leading-[1.5] font-medium text-brass-deep">
                      {i + 1}
                    </span>
                    <span className="font-display text-display-sm font-medium text-navy italic">{t(q)}</span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
