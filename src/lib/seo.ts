import type { Metadata } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

/** Canonical origin: NEXT_PUBLIC_SITE_URL, else Vercel's production URL, else localhost. */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

/** The site stays out of search engines until SITE_INDEXABLE=true (set at launch). */
export function isIndexable(): boolean {
  return process.env.SITE_INDEXABLE === "true";
}

type Href = Parameters<typeof getPathname>[0]["href"];
export type LocalizedPaths = Record<Locale, string>;

/** Localized paths for a route, e.g. { tr: "/tr/hizmetler", en: "/en/services" }. */
export function localizedPaths(href: Href): LocalizedPaths {
  return Object.fromEntries(
    routing.locales.map((locale) => [locale, getPathname({ locale, href })]),
  ) as LocalizedPaths;
}

type BuildMetadataInput = {
  locale: Locale;
  title: string;
  description: string;
  /** Route href (typed) or explicit per-locale paths (articles with different slugs). */
  href?: Href;
  paths?: LocalizedPaths;
  noindex?: boolean;
  type?: "website" | "article";
  absoluteTitle?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
};

export function buildMetadata(input: BuildMetadataInput): Metadata {
  const paths = input.paths ?? localizedPaths(input.href ?? "/");
  const canonical = paths[input.locale];
  const noindex = input.noindex || !isIndexable();
  return {
    title: input.absoluteTitle ? { absolute: input.title } : input.title,
    description: input.description,
    alternates: {
      canonical,
      languages: { tr: paths.tr, en: paths.en, "x-default": paths.tr },
    },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: input.type ?? "website",
      siteName: "Ponenti",
      title: input.title,
      description: input.description,
      url: canonical,
      locale: input.locale === "tr" ? "tr_TR" : "en_US",
      alternateLocale: input.locale === "tr" ? ["en_US"] : ["tr_TR"],
      ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
      ...(input.modifiedTime ? { modifiedTime: input.modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
    },
  };
}
