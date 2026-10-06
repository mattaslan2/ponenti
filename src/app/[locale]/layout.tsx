import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ConsentBanner } from "@/components/layout/consent-banner";
import { ClientRuntime } from "@/components/layout/client-runtime";
import { MobileStickyCta } from "@/components/layout/mobile-sticky-cta";
import { JsonLd } from "@/components/json-ld";
import { organizationJsonLd } from "@/lib/jsonld";
import { isIndexable, siteUrl } from "@/lib/seo";
import { whatsappHref } from "@/lib/links";
import { pick } from "@/lib/messages";
import "../globals.css";

// Self-hosted subsets (Latin + Turkish only, ~47 KB together). Rebuild with scripts/subset-fonts.py.
const display = localFont({
  src: "../../fonts/cormorant-garamond-latin-tr-600.woff2",
  weight: "600",
  style: "normal",
  variable: "--font-cormorant",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

const sans = localFont({
  src: "../../fonts/inter-latin-tr-400-600.woff2",
  weight: "400 600",
  style: "normal",
  variable: "--font-inter",
  display: "swap",
  adjustFontFallback: "Arial",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  // Requests like /favicon.ico reach this segment; anything that isn't a locale is a 404.
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: t("titleDefault"), template: "%s | Ponenti" },
    description: t("descriptionDefault"),
    applicationName: "Ponenti",
    robots: isIndexable() ? undefined : { index: false, follow: false },
    formatDetection: { telephone: false, email: false, address: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#0e1a2b",
  colorScheme: "light",
};

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const messages = await getMessages();
  const common = await getTranslations("common");
  const consent = await getTranslations("consent");
  const cta = await getTranslations("cta");
  const meta = await getTranslations("meta");

  return (
    <html lang={locale} className={`${display.variable} ${sans.variable}`}>
      <body>
        <NextIntlClientProvider messages={pick(messages, ["common", "nav", "cta"])}>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-xs focus:bg-navy focus:px-4 focus:py-3 focus:text-ivory"
          >
            {common("skipToContent")}
          </a>
          <Header />
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <Footer />
          <MobileStickyCta whatsappHref={whatsappHref(cta("whatsappMessage"))} />
          <ConsentBanner
            labels={{
              title: consent("title"),
              accept: consent("accept"),
              decline: consent("decline"),
              preferences: consent("preferences"),
              save: consent("save"),
              necessary: consent("necessary"),
              necessaryBody: consent("necessaryBody"),
              analytics: consent("analytics"),
              analyticsBody: consent("analyticsBody"),
              dialogLabel: consent("dialogLabel"),
            }}
            body={consent.rich("body", {
              link: (chunks) => (
                <Link href="/cookies" className="link">
                  {chunks}
                </Link>
              ),
            })}
          />
          <ClientRuntime />
        </NextIntlClientProvider>
        <JsonLd data={organizationJsonLd(locale as Locale, meta("descriptionDefault"))} />
      </body>
    </html>
  );
}
