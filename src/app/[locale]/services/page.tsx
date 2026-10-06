import type { Metadata } from "next";
import { Check, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { PageHeader, Section } from "@/components/section";
import { FinalCta } from "@/components/home/sections";
import { Confirm } from "@/components/placeholders";
import { JsonLd } from "@/components/json-ld";
import { formatUsd, formatNumber, priceArgs } from "@/lib/format";
import { faqJsonLd } from "@/lib/jsonld";
import { pricing } from "@/lib/pricing";
import { buildMetadata } from "@/lib/seo";
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
    { id: "terms", label: t("terms.title") },
    { id: "faq", label: t("faq.title") },
  ];

  const plans: { key: "essentials" | "standard" | "complete"; price: number; n: number }[] = [
    { key: "essentials", price: pricing.plans.essentials, n: 8 },
    { key: "standard", price: pricing.plans.standard, n: 6 },
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

  const faq = Array.from({ length: 7 }, (_, i) => ({ q: t(`faq.q${i + 1}` as "faq.q1"), a: t(`faq.a${i + 1}` as "faq.a1") }));

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
          </>
        }
      >
        <h3 className="eyebrow">{t("includes")}</h3>
        <Includes className="mt-5" items={keys("check", 6).map(tl)} />
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

      {/* Terms */}
      <Section id="terms" layout="split" title={t("terms.title")}>
        <ul className="border-t border-line">
          {[1, 2, 3, 4, 5].map((i) => (
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
              <p className="max-w-xl pb-7 text-mist">{item.a}</p>
            </details>
          ))}
        </div>
        <JsonLd data={faqJsonLd(faq)} />
      </Section>

      <FinalCta location="services_final" />
    </>
  );
}
