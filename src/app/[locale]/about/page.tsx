import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { PageHeader, Section } from "@/components/section";
import { CompassCard } from "@/components/brand/compass-card";
import { FinalCta } from "@/components/home/sections";
import { Confirm } from "@/components/placeholders";
import { isPlaceholder, site } from "@/lib/site";
import { PhotoBand } from "@/components/photo";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/about">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "meta.about" });
  return buildMetadata({ locale, href: "/about", title: t("title"), description: t("description") });
}

/** "The founder: reviews every file." → ["The founder", "reviews every file."] */
function splitTerm(line: string, locale: Locale): [string, string] {
  const at = line.indexOf(": ");
  if (at === -1) return ["", line];
  const rest = line.slice(at + 2);
  // Locale-aware: a Turkish "i" must become "İ", not "I".
  return [line.slice(0, at), rest.charAt(0).toLocaleUpperCase(locale === "tr" ? "tr-TR" : "en-US") + rest.slice(1)];
}

export default async function AboutPage({ params }: PageProps<"/[locale]/about">) {
  const locale = (await params).locale as Locale;
  const t = await getTranslations("about");
  const brand = await getTranslations("brand");
  const home = await getTranslations("home.founder");
  const name = site.founder.name[locale];
  const hasPhoto = !isPlaceholder(site.founder.photo);
  const hasLinkedin = !isPlaceholder(site.founder.linkedin);

  const steps = [1, 2, 3, 4, 5].map((i) => ({
    label: t(`step${i}Label` as "step1Label"),
    body: t(`step${i}` as "step1"),
  }));

  return (
    <>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} />
      <PhotoBand photo={site.photos.bosphorus} locale={locale} />

      {/* Name story */}
      <section aria-labelledby="name-title" className="overflow-hidden">
        <div className="page grid items-center gap-x-8 gap-y-14 py-section lg:grid-cols-12">
          <div className="lg:col-span-5">
            <CompassCard
              locale={locale}
              className="mx-auto w-full max-w-[26rem] lg:max-w-none"
              title={locale === "tr" ? "Batıyı, ponente yönünü gösteren rüzgârgülü" : "Wind rose with the west point, ponente, in brass"}
            />
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <h2 id="name-title" className="text-display-lg">
              {t("nameTitle")}
            </h2>
            <p className="mt-8 text-lead text-navy">{t("nameBody1")}</p>
            <p className="mt-4 text-lead text-navy">{t("nameBody2")}</p>
            <p className="mt-12 border-t border-brass pt-8 font-display text-display-md font-medium text-navy">{brand.rich("pride", { em: (chunks) => <em>{chunks}</em> })}</p>
          </div>
        </div>
      </section>

      {/* Founder */}
      <Section
        id="founder-note"
        layout="split"
        title={t("founderTitle")}
        aside={
          <div>
            {hasPhoto && (
              <div className="relative mb-6 aspect-[4/5] w-full max-w-[15rem] overflow-hidden rounded-xs bg-sand">
                <Image src={site.founder.photo} alt={name} fill sizes="240px" className="object-cover" />
              </div>
            )}
            <p className="font-display text-display-sm font-medium text-navy">
              <Confirm note="display name">{name}</Confirm>
            </p>
            {hasLinkedin && (
              <a href={site.founder.linkedin} className="link mt-1 inline-flex min-h-11 items-center gap-2 text-small font-medium" target="_blank" rel="noopener noreferrer me">
                {home("linkedin")}
                <ArrowUpRight aria-hidden="true" className="nudge-up size-4" />
              </a>
            )}
          </div>
        }
      >
        <div className="max-w-2xl space-y-5 text-lead text-navy">
          <Confirm note="founder story draft">
            <span className="block">{t("founderP1", { name })}</span>
          </Confirm>
          <p>{t("founderP2")}</p>
          <p>{t("founderP3")}</p>
        </div>
        <div className="mt-14 max-w-2xl border-t border-line pt-6">
          <h3 className="eyebrow">{t("bioTitle")}</h3>
          <p className="mt-4 text-mist">
            <Confirm note="bio draft">{t("bio")}</Confirm>
          </p>
        </div>
      </Section>

      {/* How we work */}
      <Section id="how" layout="split" title={t("howTitle")}>
        <ol className="border-t border-line">
          {[1, 2, 3, 4].map((i) => (
            <li key={i} data-reveal className="grid gap-x-8 gap-y-2 border-b border-line py-7 sm:grid-cols-[2.5rem_minmax(0,1fr)]">
              <span aria-hidden="true" className="font-display text-[1.375rem] leading-[1.45] font-medium text-brass-deep">
                0{i}
              </span>
              <p className="max-w-2xl font-display text-display-sm font-medium text-navy">{t(`how${i}` as "how1")}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* First 10 business days */}
      <Section id="first-10" tone="sand" title={t("first10Title")} intro={t("first10Intro")}>
        <ol className="grid gap-x-8 md:grid-cols-5">
          {steps.map((step) => (
            <li key={step.label} data-reveal className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-6 border-t border-navy py-6 md:block md:py-0 md:pt-6">
              <h3 className="font-display text-display-sm font-medium text-navy">{step.label}</h3>
              <p className="text-small text-mist md:mt-4">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Who touches your data */}
      <Section id="data-access" layout="split" rule={false} title={t("dataTitle")}>
        <dl className="border-t border-line">
          {[1, 2, 3, 4, 5].map((i) => {
            const [term, detail] = splitTerm(t(`data${i}` as "data1"), locale);
            return (
              <div key={i} className="grid gap-x-8 gap-y-1 border-b border-line py-5 sm:grid-cols-[14rem_minmax(0,1fr)]">
                <dt className="font-semibold text-navy">{term}</dt>
                <dd className="text-mist">{i === 3 ? <Confirm note="review and e-file partner">{detail}</Confirm> : detail}</dd>
              </div>
            );
          })}
        </dl>
      </Section>

      <FinalCta location="about_final" />
    </>
  );
}
