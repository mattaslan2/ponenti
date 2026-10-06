import { getTranslations } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { listArticleSlugs, loadArticle } from "@/lib/content";
import { ogSize, renderOg } from "@/lib/og";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Ponenti";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => listArticleSlugs(locale).map((slug) => ({ locale, slug })));
}

/** Share card with the article title. */
export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = (await params) as { locale: Locale; slug: string };
  const { meta } = await loadArticle(locale, slug);
  const nav = await getTranslations({ locale, namespace: "nav" });
  const brand = await getTranslations({ locale, namespace: "brand" });
  return renderOg({ title: meta.title, kicker: nav("insights"), footer: brand("pride"), locale });
}
