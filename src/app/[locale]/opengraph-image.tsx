import { getTranslations } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { ogSize, renderOg } from "@/lib/og";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Ponenti";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** One share card per language. */
export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale;
  const brand = await getTranslations({ locale, namespace: "brand" });
  const meta = await getTranslations({ locale, namespace: "meta" });
  const hero = await getTranslations({ locale, namespace: "home.hero" });
  // brand.pride carries markup for the page; the share card uses the plain line.
  return renderOg({ title: brand("tagline"), kicker: hero("eyebrow"), footer: meta("ogTagline"), locale });
}
