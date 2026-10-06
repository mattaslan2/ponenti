import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["tr", "en"],
  defaultLocale: "tr",
  localePrefix: "always",
  // Turkish is the default for everyone. We never redirect by browser language;
  // the language switcher stores an explicit choice (see src/proxy.ts).
  localeDetection: false,
  localeCookie: false,
  pathnames: {
    "/": "/",
    "/services": { tr: "/hizmetler", en: "/services" },
    "/risk-test": { tr: "/risk-testi", en: "/risk-test" },
    "/calculators": { tr: "/hesaplayicilar", en: "/calculators" },
    "/insights": { tr: "/bilgi-merkezi", en: "/insights" },
    "/insights/[slug]": { tr: "/bilgi-merkezi/[slug]", en: "/insights/[slug]" },
    "/about": { tr: "/hakkimizda", en: "/about" },
    "/contact": { tr: "/iletisim", en: "/contact" },
    "/privacy": { tr: "/gizlilik", en: "/privacy" },
    "/terms": { tr: "/kosullar", en: "/terms" },
    "/cookies": { tr: "/cerezler", en: "/cookies" },
    "/portal": "/portal",
    "/ozel/[firm]": "/ozel/[firm]",
  },
});

export type Locale = (typeof routing.locales)[number];
export type AppPathname = keyof typeof routing.pathnames;
export type StaticPathname = Exclude<AppPathname, "/insights/[slug]" | "/ozel/[firm]">;

/** Cookie written by the language switcher; read by src/proxy.ts for the bare domain. */
export const LOCALE_COOKIE = "NEXT_LOCALE";
