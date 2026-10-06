import Image from "next/image";
import {
  ArrowRight,
  Ban,
  Bot,
  Building2,
  Clock,
  FileLock2,
  KeyRound,
  Landmark,
  MapPinOff,
  PenLine,
  ShieldCheck,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { Section } from "@/components/section";
import { WindRose } from "@/components/brand/logo";
import { BookButton, RiskTestLink, WhatsAppButton } from "@/components/cta";
import { SourceLink } from "@/components/external-link";
import { Confirm, Fact, ReplaceWithReal, ShowAfterEOConfirms } from "@/components/placeholders";
import { SampleReport } from "@/components/report/sample-report";
import { formatUsd, priceArgs } from "@/lib/format";
import { pricing } from "@/lib/pricing";
import { isPlaceholder, site } from "@/lib/site";
import { sources } from "@/lib/sources";

async function currentLocale() {
  return (await getLocale()) as Locale;
}

export async function Hero() {
  const locale = await currentLocale();
  const t = await getTranslations("home.hero");
  const brand = await getTranslations("brand");
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden border-b border-line">
      <div className="page grid gap-10 pt-9 pb-14 sm:pt-14 lg:grid-cols-12 lg:gap-14 lg:pt-20 lg:pb-24">
        <div className="lg:col-span-7">
          <p className="eyebrow text-brass-deep">{t("eyebrow")}</p>
          <h1 id="hero-title" className="mt-4 text-display-xl">
            {t("title")}
          </h1>
          <p className="mt-5 max-w-2xl text-[1.0625rem] leading-relaxed text-graphite sm:text-lead">{t("subtitle")}</p>
          <p className="mt-5 max-w-2xl border-l-2 border-brass pl-4 text-[0.9375rem] leading-relaxed text-mist">
            {t("price", priceArgs(locale, pricing))}
          </p>
          <div id="hero-actions" className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <BookButton location="hero" />
            <WhatsAppButton location="hero" />
            <RiskTestLink location="hero" className="sm:ml-1" />
          </div>
        </div>

        <aside aria-labelledby="trust-title" className="lg:col-span-5 lg:pt-2">
          <div className="on-navy relative overflow-hidden rounded-sm bg-navy p-6 text-ivory shadow-quiet sm:p-8">
            <WindRose className="pointer-events-none absolute -right-16 -bottom-16 size-72 text-brass opacity-[0.12]" />
            <p id="trust-title" className="eyebrow text-brass-light">
              {t("trustLabel")}
            </p>
            <ul className="relative mt-5 space-y-5">
              <li className="flex gap-3.5">
                <UserRound aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brass-light" />
                <Confirm note="founder credential line">
                  <span>{t("trustFounder")}</span>
                </Confirm>
              </li>
              <li className="flex gap-3.5">
                <Wallet aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brass-light" />
                <span>{t("trustMoney")}</span>
              </li>
              <li className="flex gap-3.5">
                <Clock aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brass-light" />
                <span>{t("trustReply")}</span>
              </li>
            </ul>
            <div className="relative mt-7 border-t border-brass/30 pt-5">
              <p className="font-display text-xl text-ivory">{brand("pride")}</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export async function Doors() {
  const t = await getTranslations("home.doors");
  const doors = [
    { key: "us", icon: Building2, href: { pathname: "/services", hash: "plans" } },
    { key: "tr", icon: Landmark, href: { pathname: "/services", hash: "cash-desk" } },
  ] as const;
  return (
    <Section id="doors" eyebrow={t("eyebrow")} title={t("title")}>
      <div className="grid gap-5 md:grid-cols-2">
        {doors.map(({ key, icon: Icon, href }) => (
          <Link
            key={key}
            href={href}
            data-reveal
            data-track="cta_click"
            data-track-label={`door_${key}`}
            data-track-location="doors"
            className="group relative flex flex-col rounded-sm border border-line bg-paper p-6 transition-colors duration-250 hover:border-brass sm:p-8"
          >
            <Icon aria-hidden="true" className="size-7 text-brass-deep" />
            <h3 className="mt-5 text-display-md">{t(`${key}.title`)}</h3>
            <p className="mt-3 text-mist">{t(`${key}.body`)}</p>
            <span className="mt-6 inline-flex items-center gap-1.5 font-medium text-cobalt">
              {t(`${key}.link`)}
              <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </Section>
  );
}

export async function FactsBand() {
  const locale = await currentLocale();
  const t = await getTranslations("home.facts");
  const facts = [
    { value: formatUsd(pricing.form5472Penalty, locale), text: t("f1.text"), source: t("f1.source"), href: sources.irs5472, external: true },
    { value: t("f2.value"), text: t("f2.text"), source: t("f2.source"), href: sources.frImporterData, external: true },
    { value: t("f3.value"), text: t("f3.text"), source: t("f3.source"), href: null, external: false },
  ];
  return (
    <Section id="facts" tone="navy" eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")}>
      <div className="grid gap-px overflow-hidden rounded-sm border border-brass/30 bg-brass/30 md:grid-cols-3">
        {facts.map((fact) => (
          <div key={fact.value} data-reveal className="flex flex-col bg-navy p-6 sm:p-8">
            <div className="numeral text-brass-light">{fact.value}</div>
            <p className="mt-4 flex-1 text-ivory">{fact.text}</p>
            <p className="mt-5 text-[0.875rem]">
              {fact.external && fact.href ? (
                <SourceLink href={fact.href}>{fact.source}</SourceLink>
              ) : (
                <Link href={{ pathname: "/services", hash: "cash-desk" }} className="link">
                  {fact.source}
                </Link>
              )}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export async function Offer() {
  const locale = await currentLocale();
  const t = await getTranslations("home.offer");
  const common = await getTranslations("common");
  const f = (n: number) => formatUsd(n, locale);
  const cards = [
    { title: t("check.title"), body: t("check.body"), price: f(pricing.check), note: t("check.note"), hash: "check" },
    {
      title: t("plans.title"),
      body: t("plans.body"),
      price: `${f(pricing.plans.essentials)}${common("perMonth")}`,
      note: t("plans.note", { standard: f(pricing.plans.standard), complete: f(pricing.plans.complete) }),
      hash: "plans",
    },
    { title: t("cash.title"), body: t("cash.body"), price: `${f(pricing.cashDesk.monthly)}${common("perMonth")}`, note: null, hash: "cash-desk" },
    { title: t("order.title"), body: t("order.body"), price: `${f(pricing.orderDesk.monthly)}${common("perMonth")}`, note: null, hash: "order-desk" },
  ];
  return (
    <Section id="offer" tone="sand" eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")}>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.hash}
            href={{ pathname: "/services", hash: card.hash }}
            data-reveal
            className="group flex flex-col rounded-sm border border-line bg-paper p-6 transition-colors duration-250 hover:border-brass"
          >
            <h3 className="text-display-sm">{card.title}</h3>
            <div className="mt-4 font-display text-[2.25rem] leading-none font-semibold text-navy [font-variant-numeric:lining-nums]">
              {card.price}
            </div>
            {card.note && <p className="mt-1 text-[0.8125rem] text-brass-deep">{card.note}</p>}
            <p className="mt-4 flex-1 text-[0.9375rem] text-mist">{card.body}</p>
            <ArrowRight aria-hidden="true" className="mt-5 size-4 text-cobalt transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
      <p className="mt-8">
        <Link href="/services" className="link font-medium" data-track="cta_click" data-track-label="see_pricing" data-track-location="offer">
          {t("more")}
        </Link>
      </p>
    </Section>
  );
}

export async function Weekly() {
  const t = await getTranslations("home.weekly");
  const texture = site.photos.ledger;
  return (
    <Section
      id="weekly"
      eyebrow={t("eyebrow")}
      title={t("title")}
      intro={t("intro")}
      className={texture ? "bg-cover bg-center" : undefined}
      style={texture ? { backgroundImage: `linear-gradient(rgb(246 241 231 / 0.92), rgb(246 241 231 / 0.92)), url(${texture.src})` } : undefined}
    >
      <div data-reveal>
        <SampleReport />
      </div>
    </Section>
  );
}

export async function WhatWeDont() {
  const t = await getTranslations("home.dont");
  const items = [
    { key: "i1", icon: Ban },
    { key: "i2", icon: Wallet },
    { key: "i3", icon: FileLock2 },
    { key: "i4", icon: MapPinOff },
    { key: "i5", icon: Users },
  ] as const;
  return (
    <Section id="limits" tone="sand" eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")}>
      <ol className="grid gap-px overflow-hidden rounded-sm border border-line bg-line">
        {items.map(({ key, icon: Icon }, index) => (
          <li key={key} data-reveal className="grid gap-4 bg-paper p-5 sm:grid-cols-[auto_1fr] sm:gap-6 sm:p-7">
            <span className="flex items-center gap-3 sm:block">
              <span className="font-display text-[1.75rem] leading-none font-semibold text-brass-deep [font-variant-numeric:lining-nums]">
                0{index + 1}
              </span>
              <Icon aria-hidden="true" className="size-5 text-navy sm:mt-3" />
            </span>
            <div>
              <h3 className="font-display text-[1.375rem] leading-snug">{t(`${key}.title`)}</h3>
              <p className="mt-2 text-mist">{t(`${key}.body`)}</p>
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
    { key: "d2", icon: ShieldCheck, href: null },
    { key: "d3", icon: FileLock2, href: sources.ecfrSafeguards },
    { key: "d4", icon: PenLine, href: sources.ecfr7216 },
    { key: "d5", icon: Bot, href: null },
    { key: "d6", icon: UserRound, href: null },
  ] as const;
  return (
    <Section id="your-data" eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")}>
      <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ key, icon: Icon, href }) => (
          <li key={key} data-reveal className="border-t border-brass/70 pt-5">
            <Icon aria-hidden="true" className="size-6 text-brass-deep" />
            <h3 className="mt-4 font-display text-[1.375rem]">{t(`${key}.title`)}</h3>
            <p className="mt-2 text-mist">{t(`${key}.body`)}</p>
            {href && (
              <p className="mt-2 text-[0.875rem]">
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
  const name = site.founder.name[locale];
  return (
    <Section id="founder" tone="sand">
      <div className="grid items-center gap-8 md:grid-cols-[auto_1fr] md:gap-12" data-reveal>
        <div className="relative size-40 overflow-hidden rounded-sm bg-navy ring-1 ring-brass/50 sm:size-48">
          {isPlaceholder(site.founder.photo) ? (
            <div className="on-navy absolute inset-0 grid place-items-center p-3 text-center">
              <WindRose className="absolute size-32 text-brass opacity-20" />
              <span className="ph relative text-[0.75rem]">[REPLACE WITH REAL] {locale === "tr" ? "kurucu fotoğrafı" : "founder photo"}</span>
            </div>
          ) : (
            <Image src={site.founder.photo} alt={name} fill sizes="192px" className="object-cover" />
          )}
        </div>
        <div className="max-w-2xl">
          <p className="eyebrow text-brass-deep">{t("eyebrow")}</p>
          <h2 className="mt-3 text-display-lg">
            <Confirm note="display name">{name}</Confirm>
          </h2>
          <p className="mt-4 text-mist">
            <Confirm note="bio draft">{t("body")}</Confirm>
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/about" className="link font-medium">
              {t("more")}
            </Link>
            {isPlaceholder(site.founder.linkedin) ? (
              <Fact value={site.founder.linkedin} />
            ) : (
              <a href={site.founder.linkedin} className="link font-medium" target="_blank" rel="noopener noreferrer me">
                {t("linkedin")}
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
      <section aria-labelledby="promise-title" className="border-y border-brass/50 bg-paper">
        <div className="page flex flex-col gap-3 py-10 sm:flex-row sm:items-center sm:gap-8">
          <ShieldCheck aria-hidden="true" className="size-8 shrink-0 text-brass-deep" />
          <div>
            <h2 id="promise-title" className="text-display-sm">
              {t("title")}
            </h2>
            <p className="mt-1 text-mist">{t("body", { cap: formatUsd(pricing.penaltyPromiseCap, locale) })}</p>
          </div>
        </div>
      </section>
    </ShowAfterEOConfirms>
  );
}

export async function FinalCta({ title, body, location }: { title?: string; body?: string; location: string }) {
  const t = await getTranslations("home.final");
  return (
    <section aria-labelledby={`${location}-cta-title`} className="on-navy relative overflow-hidden bg-navy text-ivory">
      <div aria-hidden="true" className="iznik-field pointer-events-none absolute inset-0 opacity-[0.06]" />
      <div className="page relative py-16 sm:py-20">
        <div className="max-w-3xl">
          <h2 id={`${location}-cta-title`} className="text-display-lg text-ivory">
            {title ?? t("title")}
          </h2>
          <p className="mt-4 text-lead text-ivory-dim">{body ?? t("body")}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <BookButton location={location} variant="brass" />
            <WhatsAppButton location={location} variant="outlineLight" />
            <RiskTestLink location={location} light className="sm:ml-1" />
          </div>
        </div>
      </div>
    </section>
  );
}
