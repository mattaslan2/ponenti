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
import { formatUsd, priceArgs } from "@/lib/format";
import { pricing } from "@/lib/pricing";
import { isPlaceholder, site } from "@/lib/site";
import { sources } from "@/lib/sources";
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
          className="pointer-events-none absolute top-1/2 right-0 hidden size-[clamp(30rem,46vw,42rem)] translate-x-[38%] -translate-y-1/2 lg:block"
        />
        <div className="relative pt-14 pb-band sm:pt-band lg:max-w-[38rem] xl:max-w-[46rem]">
          <p className="eyebrow kicker">{t("eyebrow")}</p>
          <h1 id="hero-title" className="mt-8 text-display-xl">
            {t.rich("title", { em })}
          </h1>
          <p className="mt-8 max-w-[34rem] text-lead text-navy">{t("subtitle")}</p>
          <p className="mt-6 max-w-[34rem] text-small text-mist">{t("price", priceArgs(locale, pricing))}</p>
          <div id="hero-actions" className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <BookButton location="hero" />
            <WhatsAppButton location="hero" />
            <RiskTestLink location="hero" className="self-start sm:ml-3 sm:self-auto" />
          </div>
        </div>
      </div>
    </section>
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
              <span className="block font-display text-[clamp(2.75rem,1.9rem+2.9vw,4.25rem)] leading-none font-medium tracking-[-0.02em] whitespace-nowrap">{value}</span>
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

export async function Weekly() {
  const t = await getTranslations("home.weekly");
  return (
    <Section id="weekly" tone="sand" eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")}>
      <div data-reveal>
        <SampleReport />
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
