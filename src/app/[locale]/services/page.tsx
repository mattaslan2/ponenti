import type { Metadata } from "next";
import { Check, ChevronDown } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { PageHeader } from "@/components/section";
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

function Includes({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cn("space-y-2.5", className)}>
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-[0.9375rem] text-graphite">
          <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-brass-deep" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Price({ amount, per, approx, className }: { amount: string; per?: string; approx?: string; className?: string }) {
  return (
    <div className={cn("flex items-baseline gap-1.5 text-navy", className)}>
      {approx && <span className="text-[0.9375rem] text-mist">{approx}</span>}
      <span className="font-display text-[2.75rem] leading-none font-semibold [font-variant-numeric:lining-nums]">{amount}</span>
      {per && <span className="text-[0.9375rem] text-mist">{per}</span>}
    </div>
  );
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

  const plans: { key: "essentials" | "standard" | "complete"; price: number; n: number; featured?: boolean }[] = [
    { key: "essentials", price: pricing.plans.essentials, n: 8 },
    { key: "standard", price: pricing.plans.standard, n: 6, featured: true },
    { key: "complete", price: pricing.plans.complete, n: 5 },
  ];

  const faq = Array.from({ length: 7 }, (_, i) => ({ q: t(`faq.q${i + 1}` as "faq.q1"), a: t(`faq.a${i + 1}` as "faq.a1") }));

  return (
    <>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")}>
        <nav aria-label={common("onThisPage")} className="mt-8">
          <ul className="flex flex-wrap gap-2">
            {anchors.map((a) => (
              <li key={a.id}>
                <a href={`#${a.id}`} className="inline-flex min-h-9 items-center rounded-xs border border-line bg-paper px-3 text-[0.875rem] text-navy hover:border-brass">
                  {a.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageHeader>
      <PhotoBand photo={site.photos.savannah} locale={locale} />

      {/* The check */}
      <section id="check" aria-labelledby="check-title" className="scroll-mt-20 py-14 sm:py-20">
        <div className="page grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 id="check-title" className="text-display-lg">{t("check.title")}</h2>
            <p className="mt-3 text-lead text-mist">{t("check.lede")}</p>
            <Price amount={f(pricing.check)} className="mt-6" />
            <p className="mt-2 text-[0.9375rem] text-brass-deep">{t("check.credit", { days: pricing.checkCreditDays })}</p>
          </div>
          <div className="rounded-sm border border-line bg-paper p-6 sm:p-8 lg:col-span-7">
            <h3 className="eyebrow text-brass-deep">{t("includes")}</h3>
            <Includes className="mt-4" items={keys("check", 6).map(tl)} />
            <p className="mt-6 border-t border-line pt-4 text-[0.9375rem] text-mist">{t("check.delivery")}</p>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="plans" aria-labelledby="plans-title" className="scroll-mt-20 bg-sand py-14 sm:py-20">
        <div className="page">
          <h2 id="plans-title" className="text-display-lg">{t("plans.title")}</h2>
          <p className="mt-3 max-w-2xl text-lead text-mist">{t("plans.lede")}</p>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.key}
                aria-labelledby={`plan-${plan.key}`}
                className={cn("flex flex-col rounded-sm border bg-paper p-6 sm:p-8", plan.featured ? "border-navy shadow-quiet" : "border-line")}
              >
                <h3 id={`plan-${plan.key}`} className="text-display-md">{t(`plans.${plan.key}.name`)}</h3>
                <p className="mt-1 text-[0.9375rem] text-mist">{t(`plans.${plan.key}.for`)}</p>
                <Price amount={f(plan.price)} per={common("perMonth")} className="mt-6" />
                <Includes className="mt-6 border-t border-line pt-6" items={keys(`plans.${plan.key}`, plan.n).map(tl)} />
              </article>
            ))}
          </div>
          <div className="mt-8 grid gap-3 text-[0.9375rem] text-mist sm:grid-cols-2">
            <p>{t("plans.scorecard")}</p>
            <p>{t("plans.sizing")}</p>
          </div>
        </div>
      </section>

      {/* Desks */}
      <section aria-label={`${t("cash.title")}, ${t("order.title")}`} className="py-14 sm:py-20">
        <div className="page grid gap-5 lg:grid-cols-2">
          <article id="cash-desk" aria-labelledby="cash-title" className="scroll-mt-20 flex flex-col rounded-sm border border-line bg-paper p-6 sm:p-8">
            <h2 id="cash-title" className="text-display-md">{t("cash.title")}</h2>
            <p className="mt-2 text-mist">{t("cash.lede")}</p>
            <Price amount={f(pricing.cashDesk.monthly)} per={common("perMonth")} className="mt-6" />
            <p className="mt-1 text-[0.9375rem] text-mist">
              {common("onboarding", { amount: f(pricing.cashDesk.onboarding) })} · {t("cash.capacity", { count: formatNumber(pricing.cashDesk.invoices, locale) })}
            </p>
            <Includes className="mt-6 border-t border-line pt-6" items={keys("cash", 7).map(tl)} />
            <p className="mt-6 rounded-xs bg-sand p-4 text-[0.9375rem] text-navy">{t("cash.rules")}</p>
          </article>
          <article id="order-desk" aria-labelledby="order-title" className="scroll-mt-20 flex flex-col rounded-sm border border-line bg-paper p-6 sm:p-8">
            <h2 id="order-title" className="text-display-md">{t("order.title")}</h2>
            <p className="mt-2 text-mist">{t("order.lede")}</p>
            <Price amount={f(pricing.orderDesk.monthly)} per={common("perMonth")} className="mt-6" />
            <p className="mt-1 text-[0.9375rem] text-mist">
              {common("onboarding", { amount: f(pricing.orderDesk.onboarding) })} · {t("order.capacity", { count: formatNumber(pricing.orderDesk.orders, locale) })}
            </p>
            <Includes className="mt-6 border-t border-line pt-6" items={keys("order", 5).map(tl)} />
            <p className="mt-6 rounded-xs bg-sand p-4 text-[0.9375rem] text-navy">{t("order.note")}</p>
          </article>
        </div>
      </section>

      {/* Full desk */}
      <section id="full-desk" aria-labelledby="full-title" className="on-navy scroll-mt-20 bg-navy py-14 text-ivory sm:py-16">
        <div className="page flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="full-title" className="text-display-lg text-ivory">{t("full.title")}</h2>
            <p className="mt-3 max-w-xl text-lead text-ivory-dim">{t("full.lede")}</p>
          </div>
          <div className="lg:text-right">
            <div className="flex items-baseline gap-1.5 lg:justify-end">
              <span className="text-ivory-dim">{common("approx")}</span>
              <span className="font-display text-[3rem] leading-none font-semibold text-brass-light [font-variant-numeric:lining-nums]">
                {f(pricing.fullDesk.monthly)}
              </span>
              <span className="text-ivory-dim">{common("perMonth")}</span>
            </div>
            <p className="mt-2 text-[0.9375rem] text-ivory-dim">
              <Confirm note="full-desk onboarding fee from plan v8">{common("onboarding", { amount: f(pricing.fullDesk.onboarding) })}</Confirm>
            </p>
          </div>
        </div>
      </section>

      {/* Hiring */}
      <section id="hiring" aria-labelledby="hiring-title" className="scroll-mt-20 py-14 sm:py-20">
        <div className="page">
          <h2 id="hiring-title" className="text-display-lg">{t("hiring.title")}</h2>
          <p className="mt-3 max-w-2xl text-lead text-mist">{t("hiring.lede")}</p>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {(["assist", "full"] as const).map((k) => (
              <article key={k} aria-labelledby={`hire-${k}`} className="rounded-sm border border-line bg-paper p-6 sm:p-8">
                <h3 id={`hire-${k}`} className="text-display-sm">{t(`hiring.${k}.name`)}</h3>
                <Price amount={f(k === "assist" ? pricing.hiring.assist : pricing.hiring.full)} per={t("hiring.oneTime")} className="mt-5" />
                <p className="mt-4 text-mist">{t(`hiring.${k}.body`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Terms */}
      <section id="terms" aria-labelledby="terms-title" className="scroll-mt-20 border-t border-line bg-sand py-14 sm:py-16">
        <div className="page">
          <h2 id="terms-title" className="text-display-md">{t("terms.title")}</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <li key={i} className="flex gap-2.5 text-[0.9375rem] text-graphite">
                <span aria-hidden="true" className="mt-2.5 h-px w-4 shrink-0 bg-brass" />
                <span>{t(`terms.i${i}` as "terms.i1", { extra: f(pricing.extraPer100) })}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" aria-labelledby="faq-title" className="scroll-mt-20 py-14 sm:py-20">
        <div className="page max-w-3xl">
          <h2 id="faq-title" className="text-display-lg">{t("faq.title")}</h2>
          <div className="mt-8 divide-y divide-line border-y border-line">
            {faq.map((item) => (
              <details key={item.q} className="group py-1">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-display text-[1.25rem] text-navy [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-brass-deep transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <p className="pb-5 text-mist">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
        <JsonLd data={faqJsonLd(faq)} />
      </section>

      <FinalCta location="services_final" />
    </>
  );
}
