import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { ArrowLink, BookButton, WhatsAppButton } from "@/components/cta";
import { LeadForm } from "@/components/forms/lead-form";
import { getProspect, listProspects } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { pick } from "@/lib/messages";
import { buildMetadata } from "@/lib/seo";
import { getProductSnapshot } from "@/lib/trade/analysis";
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
      <div className="page">
        <div className="pt-band pb-band">
          {/* The sample file says so in plain sight; real prospect pages never carry this line. */}
          {prospect.sample && (
            <p className="mb-8">
              <span className="inline-flex rounded-xs border border-brass px-2 py-1 text-[0.75rem] leading-none font-medium text-brass-deep">{t("sample")}</span>
            </p>
          )}
          <p className="eyebrow kicker">{t("eyebrow")}</p>
          <h1 className="mt-6 max-w-[20ch] text-display-xl">{t("title", { firm: prospect.firm })}</h1>
          <p className="mt-8 max-w-2xl text-lead text-mist">{t("intro")}</p>
          <p className="figures mt-4 text-caption text-mist-soft">
            <time dateTime={prospect.preparedOn}>{t("prepared", { date: formatDate(prospect.preparedOn, locale) })}</time>
          </p>
        </div>
        <div aria-hidden="true" className="rule" />
      </div>

      {/* The header's rule is the top line of the list. Number in the left rail, the observation on the right. */}
      <section>
        <div className="page pb-section">
          <ol>
            {prospect.observations.slice(0, 3).map((o, i) => (
              <li key={i} className="grid gap-x-8 gap-y-3 border-b border-line py-10 sm:grid-cols-[4rem_minmax(0,1fr)] lg:grid-cols-12 lg:py-14">
                <span aria-hidden="true" className="font-display text-[2.5rem] leading-none font-medium text-brass-deep lg:col-span-4">
                  {i + 1}
                </span>
                <div className="lg:col-span-8">
                  <h2 className="eyebrow font-sans">{t("observation", { n: i + 1 })}</h2>
                  <p className="mt-4 max-w-2xl text-lead text-navy">{o[locale]}</p>
                  {o.source && (
                    <p className="mt-4 text-caption text-mist-soft">
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
        </div>
      </section>

      {prospect.hs && normalizeHs(prospect.hs) && (
        <Suspense fallback={null}>
          <ProspectMarket hs={normalizeHs(prospect.hs)!} locale={locale} />
        </Suspense>
      )}

      <section className="bg-sand">
        <div className="page grid gap-x-8 gap-y-16 py-section lg:grid-cols-12">
          <div className="lg:col-span-6">
            <h2 className="max-w-[18ch] text-display-lg">{t("cta")}</h2>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              <BookButton location={`prospect_${firm}`} />
              <WhatsAppButton location={`prospect_${firm}`} />
            </div>
            <p className="mt-10 max-w-md text-caption text-mist-soft">{t("note")}</p>
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <div className="sheet p-6 sm:p-10">
              <NextIntlClientProvider messages={pick(messages, ["forms", "common"])}>
                <LeadForm formType="prospect" firm={firm} />
              </NextIntlClientProvider>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/** US market snapshot for the firm's main product (monthly Census snapshot). Hidden if there is no trade. */
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
    <section aria-labelledby="prospect-market-title">
      <div className="page pb-section">
        <div className="max-w-3xl">
          <h2 id="prospect-market-title" className="text-display-lg">
            {t("marketTitle", { code: snap.hs.code })}
          </h2>
          <p className="mt-5 text-mist" lang={locale === "tr" && snap.hs.level > 2 ? "en" : undefined}>
            {snap.label}
          </p>
          <p className="figures mt-3 text-caption text-mist-soft">{t("marketBody", { window })}</p>
        </div>
        {/* Three across only from lg: Turkish values ("$656 milyon") need the room. */}
        <dl className="mt-stack grid border-t border-navy lg:grid-cols-3">
          {facts.map((f, i) => (
            <div key={f.label} className={i === 0 ? "border-b border-line py-7 lg:border-b-0 lg:pr-8" : "border-b border-line py-7 lg:border-b-0 lg:border-l lg:px-8"}>
              <dt className="text-caption text-mist-soft">{f.label}</dt>
              <dd className="mt-4 font-sans text-[2.25rem] leading-none font-semibold tracking-[-0.025em] text-navy">{f.value}</dd>
              {f.note && <dd className="figures mt-3 text-caption text-mist-soft">{f.note}</dd>}
            </div>
          ))}
        </dl>
        <p className="mt-8">
          <ArrowLink href={{ pathname: "/trade-data/[hs]", params: { hs: snap.hs.code } }}>{t("marketLink")}</ArrowLink>
        </p>
      </div>
    </section>
  );
}
