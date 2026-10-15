import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { PageHeader } from "@/components/section";
import { SourceLink } from "@/components/external-link";
import { LeadForm } from "@/components/forms/lead-form";
import { publicEnv } from "@/lib/env";
import { formatUsd } from "@/lib/format";
import { pick } from "@/lib/messages";
import { pricing } from "@/lib/pricing";
import { buildMetadata } from "@/lib/seo";
import { sources } from "@/lib/sources";

export async function generateMetadata({ params }: PageProps<"/[locale]/pre-check">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "meta.precheck" });
  return buildMetadata({ locale, href: "/pre-check", title: t("title"), description: t("description") });
}

const em = (chunks: React.ReactNode) => <em>{chunks}</em>;
const ANSWERS = ["yes", "no", "unsure"] as const;

/**
 * The free pre-check: three findings from public shipping and company records,
 * delivered by hand within 2 business days. The page says what it is not as
 * plainly as what it is: no refund estimate (shipping records don't show duty
 * paid), no advice, no filing. The form is the shared lead form (form type
 * "precheck") with two extra questions.
 */
export default async function PrecheckPage({ params }: PageProps<"/[locale]/pre-check">) {
  const locale = (await params).locale as Locale;
  const t = await getTranslations("precheck");
  const forms = await getTranslations("forms");
  const messages = await getMessages();

  const findings = [
    { key: "f1", href: sources.frImporterData },
    { key: "f2", href: sources.cbpRefundDeclaration },
    { key: "f3", href: sources.irs1120f },
  ] as const;

  const choice = (name: "ddp" | "importWindow", legend: string) => (
    <fieldset>
      <legend className="text-small font-medium text-navy">{legend}</legend>
      <div className="mt-2.5 grid grid-cols-3 gap-2.5">
        {ANSWERS.map((value) => (
          <label
            key={value}
            className="flex min-h-12 cursor-pointer items-center gap-2.5 rounded-xs border border-field bg-paper px-3 py-2.5 text-small leading-snug transition-colors duration-200 hover:border-navy/70 has-[:checked]:border-navy has-[:checked]:bg-sand has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-navy"
          >
            <input type="radio" name={name} value={value} className="size-4 shrink-0 accent-navy focus-visible:outline-none" />
            <span>{t(`answers.${value}`)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );

  return (
    <>
      <PageHeader eyebrow={t("eyebrow")} title={t.rich("title", { em })} intro={t("intro")} />

      <section aria-labelledby="precheck-findings">
        <div className="page grid gap-x-8 gap-y-20 py-section lg:grid-cols-12">
          <div className="lg:col-span-6">
            <h2 id="precheck-findings" className="text-display-md">
              {t("findingsTitle")}
            </h2>
            <ol className="mt-8 border-t border-line">
              {findings.map(({ key, href }, i) => (
                <li key={key} data-reveal className="grid gap-x-6 gap-y-3 border-b border-line py-8 sm:grid-cols-[2.5rem_minmax(0,1fr)]">
                  <span aria-hidden="true" className="font-display text-[1.375rem] leading-[1.45] font-medium text-brass-deep">
                    0{i + 1}
                  </span>
                  <div>
                    <h3 className="text-display-sm">{t(`${key}.title`)}</h3>
                    <p className="mt-3 max-w-xl text-mist">{t(`${key}.body`)}</p>
                    <p className="mt-4 text-caption text-mist-soft">
                      <SourceLink href={href}>{t(`${key}.source`)}</SourceLink>
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-16 grid gap-12 sm:grid-cols-2">
              <div data-reveal>
                <h2 className="eyebrow">{t("notTitle")}</h2>
                <ul className="mt-5 space-y-3 text-small text-mist">
                  {(["not1", "not2", "not3"] as const).map((k) => (
                    <li key={k} className="border-l border-brass pl-4">
                      {t(k)}
                    </li>
                  ))}
                </ul>
              </div>
              <div data-reveal>
                <h2 className="eyebrow">{t("nextTitle")}</h2>
                <ol className="mt-5 space-y-3 text-small text-mist">
                  {(["n1", "n2", "n3"] as const).map((k, i) => (
                    <li key={k} className="grid grid-cols-[1.5rem_minmax(0,1fr)]">
                      <span aria-hidden="true" className="font-display text-[1.0625rem] leading-[1.35] text-brass-deep">
                        {i + 1}
                      </span>
                      <span>{t(k, { check: formatUsd(pricing.check, locale) })}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          <div id="request" className="scroll-mt-28 lg:col-span-5 lg:col-start-8">
            <div className="sheet p-6 sm:p-10 lg:sticky lg:top-28">
              <h2 className="text-display-sm">{t("formTitle")}</h2>
              <NextIntlClientProvider messages={pick(messages, ["forms", "common"])}>
                <LeadForm
                  className="mt-8"
                  formType="precheck"
                  phone
                  // WhatsApp is named only when Ponenti has a number connected (docs/DESIGN.md, trust rules).
                  phoneLabel={publicEnv.whatsappNumber ? forms("phoneWhatsapp") : forms("phone")}
                  submitLabel={t("submit")}
                  successText={forms("successPrecheck")}
                  extra={
                    <div className="space-y-6">
                      {choice("ddp", t("ddp.legend"))}
                      {choice("importWindow", t("window.legend"))}
                    </div>
                  }
                />
              </NextIntlClientProvider>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
