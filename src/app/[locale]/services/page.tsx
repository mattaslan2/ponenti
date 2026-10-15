import type { Metadata } from "next";
import { Check, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { PageHeader, Section } from "@/components/section";
import { FinalCta } from "@/components/home/sections";
import { Confirm } from "@/components/placeholders";
import { ArrowLink } from "@/components/cta";
import { SourceLink } from "@/components/external-link";
import { JsonLd } from "@/components/json-ld";
import { findArticleByKey } from "@/lib/content";
import { formatUsd, formatNumber, priceArgs } from "@/lib/format";
import { faqJsonLd } from "@/lib/jsonld";
import { FDA_ARTICLE_KEY } from "@/lib/market";
import { pricing } from "@/lib/pricing";
import { buildMetadata } from "@/lib/seo";
import { sources } from "@/lib/sources";
import { cn } from "@/lib/utils";
import { PhotoBand } from "@/components/photo";
import { site } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[locale]/services">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "meta.services" });
  return buildMetadata({ locale, href: "/services", title: t("title"), description: t("description", priceArgs(locale, pricing)) });
}

/** What a product includes, as a ruled list. */
function Includes({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cn("border-t border-line", className)}>
      {items.map((item) => (
        <li key={item} className="flex gap-3 border-b border-line py-3.5 text-small text-navy">
          <Check aria-hidden="true" className="mt-[0.2rem] size-4 shrink-0 text-brass-deep" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** A price: serif figure, with its period and any qualifier set small beside it. */
function Price({ amount, per, approx, size = "lg", className }: { amount: string; per?: string; approx?: string; size?: "lg" | "md"; className?: string }) {
  return (
    <div className={cn("flex items-baseline gap-2 text-navy", className)}>
      {approx && <span className="text-small text-mist-soft">{approx}</span>}
      <span className={cn("font-display leading-none font-medium", size === "lg" ? "text-[3.25rem]" : "text-[2.5rem]")}>{amount}</span>
      {per && <span className="text-small text-mist-soft">{per}</span>}
    </div>
  );
}

/** A scope note: what sits outside the service, in plain words. */
function Note({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("border-l border-brass pl-5 text-small text-mist", className)}>{children}</p>;
}

const keys = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}.i${i + 1}`);

export default async function ServicesPage({ params }: PageProps<"/[locale]/services">) {
  const locale = (await params).locale as Locale;
  const t = await getTranslations("services");
  const common = await getTranslations("common");
  const f = (n: number) => formatUsd(n, locale);
  const tl = (k: string) => t(k as "check.i1");

  const anchors = [
    { id: "check", label: t("check.title") },
    { id: "plans", label: t("plans.title") },
    { id: "cash-desk", label: t("cash.title") },
    { id: "order-desk", label: t("order.title") },
    { id: "full-desk", label: t("full.title") },
    { id: "hiring", label: t("hiring.title") },
    { id: "food", label: t("food.anchor") },
    { id: "terms", label: t("terms.title") },
    { id: "faq", label: t("faq.title") },
  ];

  const plans: { key: "essentials" | "standard" | "complete"; price: number; n: number }[] = [
    { key: "essentials", price: pricing.plans.essentials, n: 8 },
    { key: "standard", price: pricing.plans.standard, n: 7 },
    { key: "complete", price: pricing.plans.complete, n: 5 },
  ];

  const desks = [
    {
      id: "cash-desk",
      key: "cash",
      monthly: pricing.cashDesk.monthly,
      onboarding: pricing.cashDesk.onboarding,
      capacity: t("cash.capacity", { count: formatNumber(pricing.cashDesk.invoices, locale) }),
      n: 7,
      note: t("cash.rules"),
    },
    {
      id: "order-desk",
      key: "order",
      monthly: pricing.orderDesk.monthly,
      onboarding: pricing.orderDesk.onboarding,
      capacity: t("order.capacity", { count: formatNumber(pricing.orderDesk.orders, locale) }),
      n: 5,
      note: t("order.note"),
    },
  ] as const;

  // Food and packaging add-ons: "from" prices where the scope varies, and the official source for each claim.
  const foodAddOns = [
    {
      key: "fsvp",
      price: pricing.food.fsvp,
      from: true,
      sources: [{ href: sources.fdaImportAlert9941, label: t("food.fsvp.source") }],
    },
    {
      key: "contact",
      price: pricing.food.foodContact,
      from: true,
      sources: [{ href: sources.fdaFoodContactStatus, label: t("food.contact.source") }],
    },
    {
      key: "canning",
      price: pricing.food.canning,
      from: false,
      extra: pricing.food.canningExtra,
      sources: [
        { href: sources.ecfrAcidifiedRegistration, label: t("food.canning.sourceRule") },
        { href: sources.fdaImportAlert9937, label: t("food.canning.sourceAlert") },
      ],
    },
  ] as const;
  const [article5472, fdaArticle] = await Promise.all([findArticleByKey("form-5472-penalty", locale), findArticleByKey(FDA_ARTICLE_KEY, locale)]);

  // FAQ answers that state a rule carry their official source under the answer.
  const faqSources: Partial<Record<number, string>> = { 10: sources.fdaNoCertificate, 11: sources.ecfrFsvpDefinitions };
  const faq = Array.from({ length: 11 }, (_, i) => {
    const n = i + 1;
    const href = faqSources[n];
    return {
      q: t(`faq.q${n}` as "faq.q1"),
      a: t(`faq.a${n}` as "faq.a1"),
      source: href ? { href, label: t(`faq.s${n}` as "faq.s10") } : null,
    };
  });

  return (
    <>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")}>
        <nav aria-label={common("onThisPage")} className="mt-10">
          <ul className="flex flex-wrap gap-x-8 text-small text-mist">
            {anchors.map((a) => (
              <li key={a.id}>
                <a href={`#${a.id}`} className="hover-rule inline-flex min-h-11 items-center transition-colors duration-200 after:bottom-2.5 hover:text-navy">
                  {a.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageHeader>
      <PhotoBand photo={site.photos.savannah} locale={locale} />

      {/* The check */}
      <Section
        id="check"
        layout="split"
        rule={false}
        title={t("check.title")}
        intro={t("check.lede")}
        aside={
          <>
            <Price amount={f(pricing.check)} />
            <p className="mt-4 max-w-xs text-small text-brass-deep">{t("check.credit", { days: pricing.checkCreditDays })}</p>
            <ArrowLink href="/pre-check" className="mt-6 text-small" data-track="cta_click" data-track-label="precheck" data-track-location="services_check">
              {t("check.precheck")}
            </ArrowLink>
          </>
        }
      >
        <h3 className="eyebrow">{t("includes")}</h3>
        <Includes className="mt-5" items={keys("check", 7).map(tl)} />
        <p className="mt-8 max-w-xl text-small text-mist">{t("check.delivery")}</p>
      </Section>

      {/* Plans: three columns of one schedule, none pushed ahead of the others */}
      <Section id="plans" title={t("plans.title")} intro={t("plans.lede")}>
        <div className="grid border-t border-navy lg:grid-cols-3">
          {plans.map((plan, i) => (
            <article
              key={plan.key}
              aria-labelledby={`plan-${plan.key}`}
              // Subgrid: name, audience, price and scope sit on the same four lines in every column.
              className={cn(
                "grid content-start py-10 lg:row-span-4 lg:grid-rows-subgrid lg:gap-y-0 lg:py-12",
                i > 0 && "lg:border-l lg:border-line lg:pl-10",
                i < plans.length - 1 && "lg:pr-10",
              )}
            >
              <h3 id={`plan-${plan.key}`} className="text-display-md">
                {t(`plans.${plan.key}.name`)}
              </h3>
              <p className="mt-2 text-small text-mist">{t(`plans.${plan.key}.for`)}</p>
              <Price amount={f(plan.price)} per={common("perMonth")} className="mt-8" />
              <Includes className="mt-10 self-start" items={keys(`plans.${plan.key}`, plan.n).map(tl)} />
            </article>
          ))}
        </div>
        <div className="mt-10 grid gap-x-10 gap-y-3 text-small text-mist sm:grid-cols-2 lg:border-t lg:border-line lg:pt-8">
          <p>{t("plans.scorecard")}</p>
          <p>{t("plans.sizing")}</p>
        </div>
        <p className="mt-6">
          <ArrowLink href="/support-file">{t("plans.supportLink")}</ArrowLink>
        </p>
      </Section>

      {/* Desks */}
      <section aria-label={`${t("cash.title")}, ${t("order.title")}`}>
        <div className="page">
          <div aria-hidden="true" className="rule" data-reveal="rule" />
          <div className="grid py-section lg:grid-cols-2">
            {desks.map((desk, i) => (
              <article
                key={desk.id}
                id={desk.id}
                aria-labelledby={`${desk.key}-title`}
                className={cn(
                  "grid scroll-mt-24 content-start lg:row-span-6 lg:grid-rows-subgrid lg:gap-y-0",
                  i === 0 ? "border-b border-line pb-16 lg:border-r lg:border-b-0 lg:pr-16 lg:pb-0" : "pt-16 lg:pt-0 lg:pl-16",
                )}
              >
                <h2 id={`${desk.key}-title`} className="text-display-lg lg:text-display-md">
                  {t(`${desk.key}.title`)}
                </h2>
                <p className="mt-4 max-w-md text-mist">{t(`${desk.key}.lede`)}</p>
                <Price amount={f(desk.monthly)} per={common("perMonth")} className="mt-8" />
                <p className="mt-3 text-small text-mist">
                  {common("onboarding", { amount: f(desk.onboarding) })} · {desk.capacity}
                </p>
                <Includes className="mt-10 self-start" items={keys(desk.key, desk.n).map(tl)} />
                <Note className="mt-8 self-start">{desk.note}</Note>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Full desk */}
      <section id="full-desk" aria-labelledby="full-title" className="on-navy scroll-mt-20 bg-navy text-ivory">
        <div className="page flex flex-col gap-10 py-band lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="full-title" className="text-display-lg text-ivory">
              {t("full.title")}
            </h2>
            <p className="mt-4 max-w-xl text-lead text-ivory-dim">{t("full.lede")}</p>
          </div>
          <div className="lg:text-right">
            <div className="flex items-baseline gap-2 lg:justify-end">
              <span className="text-small text-ivory-soft">{common("approx")}</span>
              <span className="font-display text-[3.25rem] leading-none font-medium text-ivory">{f(pricing.fullDesk.monthly)}</span>
              <span className="text-small text-ivory-soft">{common("perMonth")}</span>
            </div>
            <p className="mt-3 text-small text-ivory-dim">
              <Confirm note="full-desk onboarding fee from plan v8">{common("onboarding", { amount: f(pricing.fullDesk.onboarding) })}</Confirm>
            </p>
          </div>
        </div>
      </section>

      {/* Hiring */}
      <Section id="hiring" layout="split" rule={false} title={t("hiring.title")} intro={t("hiring.lede")}>
        <div className="grid border-t border-line sm:grid-cols-2">
          {(["assist", "full"] as const).map((k, i) => (
            <article key={k} aria-labelledby={`hire-${k}`} className={cn("border-b border-line py-10", i === 0 ? "sm:border-r sm:pr-10 sm:max-lg:border-b-0" : "max-lg:border-b-0 sm:pl-10")}>
              <h3 id={`hire-${k}`} className="text-display-sm">
                {t(`hiring.${k}.name`)}
              </h3>
              <Price size="md" amount={f(k === "assist" ? pricing.hiring.assist : pricing.hiring.full)} per={t("hiring.oneTime")} className="mt-6" />
              <p className="mt-5 text-small text-mist">{t(`hiring.${k}.body`)}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* Food and packaging add-ons: sold on a trigger, priced in public like everything else */}
      <Section
        id="food"
        layout="split"
        title={t("food.title")}
        intro={t("food.lede")}
        aside={
          <div className="max-w-xs">
            <p className="text-small text-mist">{t("food.support")}</p>
            <p className="mt-3 text-caption text-mist-soft">
              <SourceLink href={sources.trMarketEntryDocuments}>{t("food.supportSource")}</SourceLink>
            </p>
            <ArrowLink href="/support-file" className="mt-4 text-small">
              {t("plans.supportLink")}
            </ArrowLink>
          </div>
        }
      >
        <div className="border-t border-line">
          {foodAddOns.map((a) => (
            <article
              key={a.key}
              id={`food-${a.key}`}
              aria-labelledby={`food-${a.key}-title`}
              data-reveal
              className="grid scroll-mt-24 gap-x-10 gap-y-6 border-b border-line py-10 md:grid-cols-[minmax(0,1fr)_12rem]"
            >
              <div>
                <p className="eyebrow">{t(`food.${a.key}.for`)}</p>
                <h3 id={`food-${a.key}-title`} className="mt-3 text-display-sm">
                  {t(`food.${a.key}.name`)}
                </h3>
                <p className="mt-4 max-w-xl text-small text-mist">{t(`food.${a.key}.body`)}</p>
                <Note className="mt-6">{t(`food.${a.key}.limit`)}</Note>
                <p className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-caption text-mist-soft">
                  {a.sources.map((s) => (
                    <SourceLink key={s.href} href={s.href}>
                      {s.label}
                    </SourceLink>
                  ))}
                </p>
              </div>
              <div className="md:text-right">
                <Price size="md" approx={a.from ? t("food.from") : undefined} amount={f(a.price)} className="md:justify-end" />
                <p className="mt-2 text-small text-mist-soft">
                  <Confirm note="food add-on price, set from other vendors' listed prices (Oct 15, 2026)">{t(`food.${a.key}.per`)}</Confirm>
                </p>
                {"extra" in a && <p className="mt-1 text-small text-mist">{t("food.canning.extra", { amount: f(a.extra) })}</p>}
              </div>
            </article>
          ))}
        </div>
        <div className="mt-12 grid gap-10 sm:grid-cols-2">
          <div data-reveal>
            <h3 className="eyebrow">{t("food.referTitle")}</h3>
            <p className="mt-4 text-small text-mist">{t("food.refer")}</p>
          </div>
          <div data-reveal>
            <h3 className="eyebrow">{t("food.ownerTitle")}</h3>
            <p className="mt-4 text-small text-mist">{t("food.owner", { penalty: f(pricing.form5472Penalty) })}</p>
            {article5472 && (
              <ArrowLink href={{ pathname: "/insights/[slug]", params: { slug: article5472.slug } }} className="mt-2 text-small">
                {t("food.ownerLink")}
              </ArrowLink>
            )}
          </div>
        </div>
        {fdaArticle && (
          <p className="mt-10">
            <ArrowLink href={{ pathname: "/insights/[slug]", params: { slug: fdaArticle.slug } }}>{t("food.articleLink")}</ArrowLink>
          </p>
        )}
      </Section>

      {/* Terms */}
      <Section id="terms" layout="split" title={t("terms.title")}>
        <ul className="border-t border-line">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <li key={i} className="border-b border-line py-4 text-navy max-lg:last:border-b-0">
              {t(`terms.i${i}` as "terms.i1", { extra: f(pricing.extraPer100) })}
            </li>
          ))}
        </ul>
      </Section>

      {/* FAQ */}
      <Section id="faq" layout="split" title={t("faq.title")}>
        <div className="border-t border-line">
          {faq.map((item) => (
            <details key={item.q} className="group border-b border-line">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-5 font-display text-display-sm font-medium text-navy [&::-webkit-details-marker]:hidden">
                {item.q}
                <Plus aria-hidden="true" className="size-5 shrink-0 text-brass-deep transition-transform duration-200 group-open:rotate-45" />
              </summary>
              <div className="max-w-xl pb-7">
                <p className="text-mist">{item.a}</p>
                {item.source && (
                  <p className="mt-3 text-caption text-mist-soft">
                    <SourceLink href={item.source.href}>{item.source.label}</SourceLink>
                  </p>
                )}
              </div>
            </details>
          ))}
        </div>
        <JsonLd data={faqJsonLd(faq.map(({ q, a }) => ({ q, a })))} />
      </Section>

      <FinalCta location="services_final" />
    </>
  );
}
