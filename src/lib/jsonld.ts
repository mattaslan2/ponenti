import type { Locale } from "@/i18n/routing";
import { isPlaceholder, site } from "./site";
import { siteUrl } from "./seo";
import { pricing } from "./pricing";
import type { ArticleMeta } from "./content";

const real = (v: string) => (isPlaceholder(v) ? undefined : v);

/** Organization + ProfessionalService. Address and phone appear only once they are real. */
export function organizationJsonLd(locale: Locale, description: string) {
  const url = siteUrl();
  const linkedin = real(site.founder.linkedin);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${url}/#organization`,
        name: site.name,
        url,
        logo: `${url}/apple-icon.png`,
        legalName: real(site.legalName),
        email: real(site.email),
        telephone: real(site.phone),
        founder: {
          "@type": "Person",
          name: site.founder.name[locale],
          ...(linkedin ? { sameAs: [linkedin] } : {}),
        },
      },
      {
        "@type": "ProfessionalService",
        "@id": `${url}/#service`,
        name: site.name,
        url,
        description,
        parentOrganization: { "@id": `${url}/#organization` },
        areaServed: [
          { "@type": "Country", name: "United States" },
          { "@type": "Country", name: "Türkiye" },
        ],
        availableLanguage: ["tr", "en"],
        priceRange: `$${pricing.plans.essentials}-$${pricing.fullDesk.monthly.toLocaleString("en-US")}`,
        ...(real(site.address) ? { address: { "@type": "PostalAddress", streetAddress: site.address } } : {}),
        ...(real(site.phone) ? { telephone: site.phone } : {}),
      },
    ],
  };
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };
}

export function articleJsonLd(meta: ArticleMeta, path: string, locale: Locale) {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: meta.title,
    description: meta.description,
    inLanguage: locale,
    datePublished: meta.published,
    dateModified: meta.updated,
    mainEntityOfPage: `${url}${path}`,
    author: { "@type": "Person", name: site.founder.name[locale] },
    publisher: { "@id": `${url}/#organization` },
    citation: (meta.sources ?? []).map((s) => s.url),
    keywords: meta.keywords?.join(", "),
  };
}
