import type { Metadata } from "next";
import { Clock, MessageCircle, UserRound } from "lucide-react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { PageHeader } from "@/components/section";
import { CalEmbed, DualClock } from "@/components/booking/booking";
import { LeadForm } from "@/components/forms/lead-form";
import { WhatsAppButton } from "@/components/cta";
import { publicEnv } from "@/lib/env";
import { whatsappHref } from "@/lib/links";
import { pick } from "@/lib/messages";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "meta.contact" });
  return buildMetadata({ locale, href: "/contact", title: t("title"), description: t("description") });
}

export default async function ContactPage() {
  const t = await getTranslations("contact");
  const cta = await getTranslations("cta");
  const rt = await getTranslations("riskTest.q.paymentDays");
  const messages = await getMessages();
  const wa = whatsappHref(cta("whatsappMessage"));

  return (
    <>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} intro={t("intro")}>
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[0.9375rem] text-navy">
          <li className="flex items-start gap-2">
            <Clock aria-hidden="true" className="mt-1 size-4 shrink-0 text-brass-deep" />
            {t("reply")}
          </li>
          <li className="flex items-start gap-2">
            <UserRound aria-hidden="true" className="mt-1 size-4 shrink-0 text-brass-deep" />
            {t("human")}
          </li>
        </ul>
      </PageHeader>

      <NextIntlClientProvider messages={pick(messages, ["contact", "forms", "common"])}>
        <section className="py-10 sm:py-16">
          <div className="page grid gap-10 lg:grid-cols-12">
            <div id="book" className="scroll-mt-24 lg:col-span-7">
              <h2 className="text-display-md">{t("bookTitle")}</h2>
              <p className="mt-2 text-mist">{t("bookBody")}</p>
              <div className="mt-6 space-y-5">
                <DualClock />
                <CalEmbed
                  calLink={publicEnv.calLink}
                  labels={{ load: t("loadCalendar"), notice: t("calendarNotice"), missing: t("calendarMissing") }}
                />
              </div>
            </div>

            <div className="space-y-6 lg:col-span-5">
              <div className="rounded-sm border border-line bg-paper p-6">
                <h2 className="flex items-center gap-2 font-display text-[1.5rem]">
                  <MessageCircle aria-hidden="true" className="size-5 text-brass-deep" />
                  {t("whatsappTitle")}
                </h2>
                <p className="mt-2 text-mist">{t("whatsappBody")}</p>
                {wa ? (
                  <WhatsAppButton location="contact" variant="default" className="mt-5 w-full sm:w-auto" />
                ) : (
                  <p className="mt-4 ph inline-block">[REPLACE WITH REAL] {t("whatsappMissing")}</p>
                )}
              </div>

              <div className="rounded-sm border border-line bg-paper p-6">
                <h2 className="font-display text-[1.5rem]">{t("formTitle")}</h2>
                <LeadForm
                  className="mt-5"
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
