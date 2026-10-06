import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { PageHeader } from "@/components/section";
import { CalEmbed, DualClock } from "@/components/booking/booking";
import { LeadForm } from "@/components/forms/lead-form";
import { WhatsAppButton } from "@/components/cta";
import { PreviewNote } from "@/components/placeholders";
import { publicEnv } from "@/lib/env";
import { whatsappHref } from "@/lib/links";
import { pick } from "@/lib/messages";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "meta.contact" });
  return buildMetadata({ locale, href: "/contact", title: t("title"), description: t(publicEnv.whatsappNumber ? "description" : "descriptionNoWhatsapp") });
}

export default async function ContactPage() {
  const t = await getTranslations("contact");
  const cta = await getTranslations("cta");
  const rt = await getTranslations("riskTest.q.paymentDays");
  const messages = await getMessages();
  const wa = whatsappHref(cta("whatsappMessage"));
  // The intro names only the channels that are connected.
  const intro = publicEnv.calLink ? (wa ? "intro" : "introCal") : wa ? "introWhatsapp" : "introForm";

  return (
    <>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} intro={t(intro)}>
        <p className="mt-6 max-w-2xl text-small text-mist-soft">{t("human")}</p>
      </PageHeader>

      <NextIntlClientProvider messages={pick(messages, ["contact", "forms", "common"])}>
        <section>
          <div className="page grid gap-x-8 gap-y-20 py-section lg:grid-cols-12">
            {/* Book a call. Until a calendar or a WhatsApp number is connected, the visitor is
                pointed to the form; the missing pieces are named in preview builds only. */}
            <div id="book" className="scroll-mt-28 lg:col-span-6">
              <h2 className="text-display-md">{t("bookTitle")}</h2>
              <p className="mt-4 max-w-md text-mist">{publicEnv.calLink ? t("bookBody") : t("calendarFallback")}</p>
              <div className="mt-10 space-y-10">
                <DualClock />
                <CalEmbed calLink={publicEnv.calLink} labels={{ load: t("loadCalendar"), notice: t("calendarNotice") }} />
                {!publicEnv.calLink && <PreviewNote>[REPLACE WITH REAL] {t("calendarMissing")}</PreviewNote>}
              </div>

              {wa ? (
                <div className="mt-16 border-t border-line pt-10">
                  <h2 className="text-display-sm">{t("whatsappTitle")}</h2>
                  <p className="mt-3 max-w-md text-mist">{t("whatsappBody")}</p>
                  <WhatsAppButton location="contact" className="mt-7 w-full sm:w-auto" />
                </div>
              ) : (
                <div className="mt-10">
                  <PreviewNote>[REPLACE WITH REAL] {t("whatsappMissing")}</PreviewNote>
                </div>
              )}
            </div>

            <div id="message" className="scroll-mt-28 lg:col-span-5 lg:col-start-8">
              <div className="sheet p-6 sm:p-10">
                <h2 className="text-display-sm">{t("formTitle")}</h2>
                <LeadForm
                  className="mt-8"
                  formType="contact"
                  full
                  paymentLabels={{ r0: rt("r0"), r1: rt("r1"), r2: rt("r2"), r3: rt("r3"), r4: rt("r4") }}
                />
              </div>
            </div>
          </div>
        </section>
      </NextIntlClientProvider>
    </>
  );
}
