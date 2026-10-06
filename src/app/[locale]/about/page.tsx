import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { PageHeader, Section } from "@/components/section";
import { WindRose } from "@/components/brand/logo";
import { FinalCta } from "@/components/home/sections";
import { Confirm, Fact } from "@/components/placeholders";
import { isPlaceholder, site } from "@/lib/site";
import { PhotoBand } from "@/components/photo";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/about">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "meta.about" });
  return buildMetadata({ locale, href: "/about", title: t("title"), description: t("description") });
}

export default async function AboutPage({ params }: PageProps<"/[locale]/about">) {
  const locale = (await params).locale as Locale;
  const t = await getTranslations("about");
  const brand = await getTranslations("brand");
  const home = await getTranslations("home.founder");
  const name = site.founder.name[locale];

  const steps = [1, 2, 3, 4, 5].map((i) => ({
    label: t(`step${i}Label` as "step1Label"),
    body: t(`step${i}` as "step1"),
  }));

  return (
    <>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} />
      <PhotoBand photo={site.photos.bosphorus} locale={locale} />

      {/* Name story */}
      <section aria-labelledby="name-title" className="py-14 sm:py-20">
        <div className="page grid items-center gap-10 md:grid-cols-[auto_1fr] md:gap-16">
          <div className="on-navy grid size-56 place-items-center rounded-sm bg-navy text-brass ring-1 ring-brass/40 sm:size-72">
            <WindRose className="size-44 sm:size-56" title={locale === "tr" ? "Batıyı gösteren rüzgârgülü" : "Wind rose pointing west"} />
          </div>
          <div className="max-w-2xl">
            <h2 id="name-title" className="text-display-lg">{t("nameTitle")}</h2>
            <p className="mt-5 text-lead text-graphite">{t("nameBody1")}</p>
            <p className="mt-3 text-lead text-graphite">{t("nameBody2")}</p>
            <p className="mt-8 border-l-2 border-brass pl-5 font-display text-[1.75rem] leading-snug text-navy">{brand("pride")}</p>
          </div>
        </div>
      </section>

      {/* Founder */}
      <Section id="founder-note" tone="sand" title={t("founderTitle")}>
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-sm bg-navy ring-1 ring-brass/50">
              {isPlaceholder(site.founder.photo) ? (
                <div className="on-navy absolute inset-0 grid place-items-center p-4 text-center">
                  <WindRose className="absolute size-40 text-brass opacity-20" />
                  <span className="ph relative">[REPLACE WITH REAL] {locale === "tr" ? "kurucu fotoğrafı" : "founder photo"}</span>
                </div>
              ) : (
                <Image src={site.founder.photo} alt={name} fill sizes="(min-width: 1024px) 320px, 80vw" className="object-cover" />
              )}
            </div>
            <div className="mt-4 font-display text-2xl text-navy">
              <Confirm note="display name">{name}</Confirm>
            </div>
            <p className="mt-1 text-[0.9375rem]">
              {isPlaceholder(site.founder.linkedin) ? (
                <Fact value={site.founder.linkedin} />
              ) : (
                <a href={site.founder.linkedin} className="link" target="_blank" rel="noopener noreferrer me">
                  {home("linkedin")}
                </a>
              )}
            </p>
          </div>
          <div className="space-y-4 text-lead text-graphite lg:col-span-8">
            <Confirm note="founder story draft">
              <span className="block">{t("founderP1", { name })}</span>
            </Confirm>
            <p>{t("founderP2")}</p>
            <p>{t("founderP3")}</p>
            <div className="!mt-10 rounded-sm border border-line bg-paper p-6">
              <h3 className="eyebrow text-brass-deep">{t("bioTitle")}</h3>
              <p className="mt-3 text-[1rem] leading-relaxed text-graphite">
                <Confirm note="bio draft">{t("bio")}</Confirm>
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* How we work */}
      <Section id="how" title={t("howTitle")}>
        <ul className="grid gap-6 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <li key={i} data-reveal className="border-t border-brass/70 pt-5 text-graphite">
              {t(`how${i}` as "how1")}
            </li>
          ))}
        </ul>
      </Section>

      {/* First 10 business days */}
      <Section id="first-10" tone="sand" title={t("first10Title")} intro={t("first10Intro")}>
        <ol className="relative grid gap-px overflow-hidden rounded-sm border border-line bg-line md:grid-cols-5">
          {steps.map((step) => (
            <li key={step.label} data-reveal className="bg-paper p-5">
              <h3 className="font-display text-[1.375rem] font-semibold text-brass-deep">{step.label}</h3>
              <p className="mt-2 text-[0.9375rem] text-graphite">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Who touches your data */}
      <Section id="data-access" title={t("dataTitle")}>
        <ul className="divide-y divide-line border-y border-line">
          {[1, 2, 3, 4, 5].map((i) => (
            <li key={i} className="py-4 text-graphite">
              {i === 3 ? <Confirm note="review and e-file partner">{t("data3")}</Confirm> : t(`data${i}` as "data1")}
            </li>
          ))}
        </ul>
      </Section>

      <FinalCta location="about_final" />
    </>
  );
}
