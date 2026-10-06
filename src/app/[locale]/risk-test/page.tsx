import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { PageHeader } from "@/components/section";
import { RiskTest } from "@/components/risk-test/risk-test";
import { pick } from "@/lib/messages";
import { riskSources, type RiskId } from "@/lib/risk-test";
import { buildMetadata } from "@/lib/seo";
import { sources } from "@/lib/sources";

export async function generateMetadata({ params }: PageProps<"/[locale]/risk-test">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "meta.riskTest" });
  return buildMetadata({ locale, href: "/risk-test", title: t("title"), description: t("description") });
}

export default async function RiskTestPage() {
  const t = await getTranslations("riskTest");
  const messages = await getMessages();
  const sourceUrls = Object.fromEntries(
    Object.entries(riskSources).map(([id, key]) => [id, sources[key!]]),
  ) as Partial<Record<RiskId, string>>;

  return (
    <>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} />
      <section>
        <div className="page py-section">
          <div className="mx-auto max-w-3xl">
            <NextIntlClientProvider messages={pick(messages, ["riskTest", "forms", "common", "cta"])}>
              <RiskTest sourceUrls={sourceUrls} />
            </NextIntlClientProvider>
          </div>
        </div>
      </section>
    </>
  );
}
