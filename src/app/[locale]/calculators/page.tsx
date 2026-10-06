import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { PageHeader } from "@/components/section";
import { FinalCta } from "@/components/home/sections";
import { CashCalculator, Form5472Calculator } from "@/components/calculators/calculators";
import { pick } from "@/lib/messages";
import { buildMetadata } from "@/lib/seo";
import { sources } from "@/lib/sources";

export async function generateMetadata({ params }: PageProps<"/[locale]/calculators">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "meta.calculators" });
  return buildMetadata({ locale, href: "/calculators", title: t("title"), description: t("description") });
}

export default async function CalculatorsPage() {
  const t = await getTranslations("calculators");
  const common = await getTranslations("common");
  const messages = await getMessages();
  return (
    <>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")} />
      <section className="py-10 sm:py-16">
        <div className="page grid gap-6 lg:grid-cols-2">
          <NextIntlClientProvider messages={pick(messages, ["calculators", "forms", "common"])}>
            <CashCalculator />
            <Form5472Calculator
              sourceUrl={sources.irsInternationalPenalties}
              sourceLabel={`${common("source")}: IRS`}
              opensNewTab={common("opensNewTab")}
            />
          </NextIntlClientProvider>
        </div>
      </section>
      <FinalCta location="calculators_final" />
    </>
  );
}
