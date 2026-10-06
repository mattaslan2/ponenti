import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { BookButton, WhatsAppButton } from "@/components/cta";
import { LeadForm } from "@/components/forms/lead-form";
import { getProspect, listProspects } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { pick } from "@/lib/messages";
import { buildMetadata } from "@/lib/seo";
import { Link } from "@/i18n/navigation";
import { getProductSnapshot } from "@/lib/trade/analysis";
import { censusConfigured } from "@/lib/trade/census";
import { TURKIYE } from "@/lib/trade/countries";
import { pct, usdCompact, windowLabel } from "@/lib/trade/format";
import { normalizeHs } from "@/lib/trade/hs";

/**
 * Prospect pages at /tr/ozel/[firm] and /en/ozel/[firm]. One JSON file per firm in
 * src/content/prospects. Never indexed, never in the sitemap.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return listProspects().map((p) => ({ firm: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/ozel/[firm]">): Promise<Metadata> {
  const { locale, firm } = (await params) as { locale: Locale; firm: string };
  const prospect = getProspect(firm);
  const t = await getTranslations({ locale, namespace: "meta.prospect" });
  return buildMetadata({
    locale,
    href: { pathname: "/ozel/[firm]", params: { firm } },
    title: t("title", { firm: prospect?.firm ?? firm }),
    description: t("description"),
    noindex: true,
  });
}

export default async function ProspectPage({ params }: PageProps<"/[locale]/ozel/[firm]">) {
  const { locale, firm } = (await params) as { locale: Locale; firm: string };
  const prospect = getProspect(firm);
  if (!prospect) notFound();
  const t = await getTranslations("prospect");
  const common = await getTranslations("common");
  const messages = await getMessages();

  return (
    <>
      <section className="border-b border-line py-12 sm:py-20">
        <div className="page max-w-4xl">
          {prospect.sample && <p className="ph mb-6 inline-block">{t("sample")}</p>}
          <p className="eyebrow text-brass-deep">{t("eyebrow")}</p>
          <h1 className="mt-3 text-display-xl">{t("title", { firm: prospect.firm })}</h1>
          <p className="mt-5 text-lead text-mist">{t("intro")}</p>
          <p className="mt-3 text-[0.875rem] text-mist">
            <time dateTime={prospect.preparedOn}>{t("prepared", { date: formatDate(prospect.preparedOn, locale) })}</time>
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <ol className="page max-w-4xl space-y-5">
          {prospect.observations.slice(0, 3).map((o, i) => (
            <li key={i} className="grid gap-4 rounded-sm border border-line bg-paper p-6 sm:grid-cols-[auto_1fr] sm:p-8">
              <span className="font-display text-[2.5rem] leading-none font-semibold text-brass-deep">{i + 1}</span>
              <div>
                <h2 className="eyebrow font-sans text-mist">{t("observation", { n: i + 1 })}</h2>
                <p className="mt-2 text-lead text-graphite">{o[locale]}</p>
                {o.source && (
                  <p className="mt-2 text-[0.875rem]">
                    <a href={o.source.url} target="_blank" rel="noopener noreferrer" className="link">
                      {common("source")}: {o.source.label}
                      <span className="sr-only"> {common("opensNewTab")}</span>
                    </a>
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {prospect.hs && normalizeHs(prospect.hs) && censusConfigured() && (
        <Suspense fallback={null}>
          <ProspectMarket hs={normalizeHs(prospect.hs)!} locale={locale} />
        </Suspense>
      )}

      <section className="on-navy bg-navy py-14 text-ivory sm:py-16">
        <div className="page grid max-w-5xl gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-display-lg text-ivory">{t("cta")}</h2>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <BookButton location={`prospect_${firm}`} variant="brass" />
              <WhatsAppButton location={`prospect_${firm}`} variant="outlineLight" />
            </div>
            <p className="mt-8 text-[0.875rem] text-ivory-dim">{t("note")}</p>
          </div>
          <div className="on-light rounded-sm bg-ivory p-6 text-graphite">
            <NextIntlClientProvider messages={pick(messages, ["forms", "common"])}>
              <LeadForm formType="prospect" firm={firm} />
            </NextIntlClientProvider>
          </div>
        </div>
      </section>
    </>
  );
}

/** US market snapshot for the firm's main product (Census data, cached daily). Hidden if the data is unavailable. */
async function ProspectMarket({ hs, locale }: { hs: string; locale: Locale }) {
  const t = await getTranslations("prospect");
  const snap = await getProductSnapshot(hs, TURKIYE.code, locale).catch(() => null);
  if (!snap || snap.worldValue === 0) return null;
  const window = windowLabel(snap.windows.cur.first, snap.windows.cur.last, locale);
  const facts = [
    { label: t("marketWorld"), value: usdCompact(snap.worldValue, locale) },
    { label: t("marketTurkiye"), value: usdCompact(snap.value, locale) },
    { label: t("marketShare"), value: pct(snap.share, locale), note: snap.rank ? t("marketRank", { rank: snap.rank }) : undefined },
  ];
  return (
    <section aria-labelledby="prospect-market-title" className="pb-12 sm:pb-16">
      <div className="page max-w-4xl">
        <div className="rounded-sm border border-line bg-paper p-6 sm:p-8">
          <h2 id="prospect-market-title" className="text-display-sm">
            {t("marketTitle", { code: snap.hs.code })}
          </h2>
          <p className="mt-1 text-[0.9375rem] text-mist" lang={locale === "tr" && snap.hs.level > 2 ? "en" : undefined}>
            {snap.label}
          </p>
          <p className="mt-1 text-[0.8125rem] text-mist">{t("marketBody", { window })}</p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            {facts.map((f) => (
              <div key={f.label}>
                <dt className="text-[0.875rem] text-mist">{f.label}</dt>
                <dd className="mt-1 font-display text-[2rem] leading-none font-semibold text-navy">{f.value}</dd>
                {f.note && <dd className="mt-1 text-[0.8125rem] text-mist">{f.note}</dd>}
              </div>
            ))}
          </dl>
          <p className="mt-6">
            <Link href={{ pathname: "/trade-data/[hs]", params: { hs: snap.hs.code } }} className="link">
              {t("marketLink")}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
