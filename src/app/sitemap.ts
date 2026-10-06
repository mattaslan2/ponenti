import type { MetadataRoute } from "next";
import { routing, type Locale, type StaticPathname } from "@/i18n/routing";
import { getPathname } from "@/i18n/navigation";
import { listArticles } from "@/lib/content";
import { localizedPaths, siteUrl } from "@/lib/seo";

/** Every public page in both languages, with hreflang alternates. Prospect and portal pages are excluded. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const pages: StaticPathname[] = ["/", "/services", "/risk-test", "/calculators", "/insights", "/about", "/contact", "/privacy", "/terms", "/cookies"];
  const entries: MetadataRoute.Sitemap = [];

  for (const href of pages) {
    const paths = localizedPaths(href);
    const languages = { tr: `${base}${paths.tr}`, en: `${base}${paths.en}` };
    for (const locale of routing.locales) {
      entries.push({
        url: `${base}${paths[locale]}`,
        changeFrequency: href === "/" || href === "/insights" ? "weekly" : "monthly",
        priority: href === "/" ? 1 : href === "/services" ? 0.9 : 0.7,
        alternates: { languages },
      });
    }
  }

  const byKey = new Map<string, Partial<Record<Locale, { slug: string; updated: string }>>>();
  for (const locale of routing.locales) {
    for (const a of await listArticles(locale)) {
      byKey.set(a.key, { ...byKey.get(a.key), [locale]: { slug: a.slug, updated: a.updated } });
    }
  }
  for (const versions of byKey.values()) {
    const urls = Object.fromEntries(
      (Object.entries(versions) as [Locale, { slug: string }][]).map(([locale, v]) => [
        locale,
        `${base}${getPathname({ locale, href: { pathname: "/insights/[slug]", params: { slug: v.slug } } })}`,
      ]),
    );
    for (const [locale, v] of Object.entries(versions) as [Locale, { updated: string }][]) {
      entries.push({ url: urls[locale], lastModified: v.updated, changeFrequency: "monthly", priority: 0.6, alternates: { languages: urls } });
    }
  }
  return entries;
}
