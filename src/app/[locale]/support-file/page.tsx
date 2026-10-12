import type { Metadata } from "next";
import { ArrowRight, Check } from "lucide-react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { PageHeader, Section } from "@/components/section";
import { FinalCta } from "@/components/home/sections";
import { ArrowLink } from "@/components/cta";
import { SourceLink } from "@/components/external-link";
import { ReplaceWithReal } from "@/components/placeholders";
import { SupportEstimator } from "@/components/support/estimator";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { pick } from "@/lib/messages";
import { buildMetadata } from "@/lib/seo";
import { sources } from "@/lib/sources";
import { SUPPORT_ARTICLE_SLUG, SUPPORT_RULES } from "@/lib/support";
import { getUsdTry } from "@/lib/tcmb";

export async function generateMetadata({ params }: PageProps<"/[locale]/support-file">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "meta.supportFile" });
  return buildMetadata({ locale, href: "/support-file", title: t("title"), description: t("description") });
}

const em = (chunks: React.ReactNode) => <em>{chunks}</em>;

const STEPS = ["s1", "s2", "s3", "s4"] as const;
const REASONS = ["r1", "r2", "r3", "r4", "r5", "r6", "r7"] as const;
const SCOPE = ["i1", "i2", "i3", "i4"] as const;

const OFFICIAL = [
  { key: "decree", href: sources.trDecree5973 },
  { key: "unitRent", href: sources.trUnitRentCircular },
  { key: "promotion", href: sources.trPromotionCircular },
  { key: "trademark", href: sources.trTrademarkCircular },
  { key: "eexportDecree", href: sources.trEexportDecree },
  { key: "eexportCircular", href: sources.trEexportCircular },
  { key: "limitsBranding", href: sources.trLimits2026Branding },
  { key: "limitsMarketEntry", href: sources.trLimits2026MarketEntry },
  { key: "limitsEexport", href: sources.trEexportLimits2026 },
  { key: "targets", href: sources.trTargetCountries },
  { key: "documents", href: sources.trMarketEntryDocuments },
  { key: "tcmb", href: sources.tcmbRates },
  { key: "cbp", href: sources.frImporterData },
] as const;

export default async function SupportFilePage({ params }: PageProps<"/[locale]/support-file">) {
  const locale = (await params).locale as Locale;
  const t = await getTranslations("supportFile");
  const messages = await getMessages();
  const fx = await getUsdTry();

  return (
    <>
      <PageHeader eyebrow={t("eyebrow")} title={t.rich("title", { em })} intro={t("intro")}>
        <div className="mt-10">
          <Button asChild size="lg">
            <a href="#estimate" data-track="cta_click" data-track-label="support_estimate" data-track-location="support_header">
              {t("estimator.title")}
              <ArrowRight aria-hidden="true" className="nudge" />
            </a>
          </Button>
        </div>
      </PageHeader>

      {/* How it works: who does what */}
      <Section id="how" layout="split" rule={false} eyebrow={t("steps.eyebrow")} title={t("steps.title")} intro={t("steps.intro")}>
        <ol className="border-t border-line">
          {STEPS.map((key, index) => (
            <li key={key} data-reveal className="grid gap-x-8 gap-y-3 border-b border-line py-8 max-lg:last:border-b-0 sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:py-10">
              <span aria-hidden="true" className="font-display text-[1.375rem] leading-[1.45] font-medium text-brass-deep">
                0{index + 1}
              </span>
              <div>
                <h3 className="text-display-sm">{t(`steps.${key}.title`)}</h3>
                <p className="mt-3 max-w-xl text-mist">{t(`steps.${key}.body`)}</p>
                <p className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-small text-navy">
                  <span className="eyebrow">{t("steps.who")}</span>
                  <span>{t(`steps.${key}.who`)}</span>
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* The estimator */}
      <Section id="estimate" eyebrow={t("estimator.eyebrow")} title={t("estimator.title")} intro={t("estimator.intro")}>
        <NextIntlClientProvider messages={pick(messages, ["supportEstimator", "forms", "common"])}>
          <SupportEstimator fx={fx} />
        </NextIntlClientProvider>
      </Section>

      {/* Why claims come back */}
      <Section
        id="reasons"
        layout="split"
        eyebrow={t("reasons.eyebrow")}
        title={t("reasons.title")}
        intro={t("reasons.intro")}
        aside={
          <ArrowLink href={{ pathname: "/insights/[slug]", params: { slug: SUPPORT_ARTICLE_SLUG } }} locale="tr">
            {t("reasons.link")}
          </ArrowLink>
        }
      >
        <ol className="border-t border-line">
          {REASONS.map((key, index) => (
            <li key={key} data-reveal className="grid gap-x-8 gap-y-2 border-b border-line py-6 sm:grid-cols-[2.5rem_minmax(0,1fr)]">
              <span aria-hidden="true" className="font-display text-[1.375rem] leading-[1.3] font-medium text-brass-deep">
                0{index + 1}
              </span>
              <p className="text-navy">{t(`reasons.${key}`)}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8 max-w-xl border-l border-brass pl-5 text-small text-mist">
          {t("reasons.card")}{" "}
          <SourceLink href={sources.trUnitRentCircular}>{t("lease.circular")}</SourceLink>
        </p>
      </Section>

      {/* One lease, two problems */}
      <Section id="lease" tone="navy" eyebrow={t("lease.eyebrow")} title={t("lease.title")}>
        <div className="grid gap-x-16 gap-y-6 border-t border-line-navy pt-10 lg:grid-cols-2">
          <p className="max-w-xl text-lead text-ivory">{t("lease.p1")}</p>
          <p className="max-w-xl text-ivory-dim">{t("lease.p2")}</p>
        </div>
        <p className="mt-10 flex flex-wrap gap-x-8 gap-y-2 text-caption text-ivory-soft">
          <SourceLink href={sources.frImporterData}>{t("lease.cbp")}</SourceLink>
          <SourceLink href={sources.trUnitRentCircular}>{t("lease.circular")}</SourceLink>
        </p>
      </Section>

      {/* Document promise */}
      <Section id="promise" space="band" rule={false} eyebrow={t("promise.eyebrow")} title={t("promise.title")} intro={t("promise.body")} />

      {/* Fees and scope */}
      <Section
        id="scope"
        layout="split"
        title={t("scope.title")}
        aside={<ArrowLink href={{ pathname: "/services", hash: "plans" }}>{t("scope.link")}</ArrowLink>}
      >
        <ul className="border-t border-line">
          {SCOPE.map((key) => (
            <li key={key} className="flex gap-3 border-b border-line py-4 text-navy max-lg:last:border-b-0">
              <Check aria-hidden="true" className="mt-[0.35rem] size-4 shrink-0 text-brass-deep" />
              <span>{t(`scope.${key}`)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-10 empty:hidden">
          <ReplaceWithReal label={`${t("partners")}: logos, with written permission`} />
        </div>
      </Section>

      {/* Official sources */}
      <Section id="sources" eyebrow={t("sources.eyebrow")} title={t("sources.title")} intro={t("sources.checked", { date: formatDate(SUPPORT_RULES.checkedOn, locale) })}>
        <ul className="grid gap-x-12 sm:grid-cols-2">
          {OFFICIAL.map(({ key, href }) => (
            <li key={key} className="border-t border-line py-4 text-small">
              <SourceLink href={href}>{t(`sources.${key}`)}</SourceLink>
            </li>
          ))}
        </ul>
      </Section>

      <FinalCta location="support_final" />
    </>
  );
}
