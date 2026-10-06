import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { Logo, WindRose } from "@/components/brand/logo";
import { Fact, hasFact } from "@/components/placeholders";
import { isPlaceholder, site, telHref } from "@/lib/site";
import { cn } from "@/lib/utils";
import { CookieSettingsButton } from "./cookie-settings-button";

const linkClass = "inline-flex min-h-9 items-center text-ivory-dim transition-colors duration-200 hover:text-ivory";

export async function Footer() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("footer");
  const nav = await getTranslations("nav");
  const brand = await getTranslations("brand");
  const common = await getTranslations("common");
  const year = new Date().getFullYear();
  const tel = telHref(site.phone);
  const founderName = site.founder.name[locale];
  // Company facts appear the moment they are real (src/lib/site.ts); until then the rows are simply absent.
  const facts = [
    { key: "legalEntity", value: site.legalName, href: null },
    { key: "address", value: site.address, href: null },
    { key: "phone", value: site.phone, href: tel },
    { key: "email", value: site.email, href: isPlaceholder(site.email) ? null : `mailto:${site.email}` },
  ].filter((f) => hasFact(f.value)) as { key: "legalEntity" | "address" | "phone" | "email"; value: string; href: string | null }[];

  return (
    <footer className="on-navy bg-navy text-ivory">
      <div className="page">
        {/* The motto, once, at full size */}
        <div className="flex items-end justify-between gap-10 border-b border-line-navy py-band">
          <p className="max-w-[16ch] font-display text-display-lg font-medium text-ivory sm:max-w-[22ch]">
            {brand.rich("pride", { em: (chunks) => <em>{chunks}</em> })}
          </p>
          <WindRose className="hidden size-20 shrink-0 text-ivory/80 md:block" />
        </div>

        <div className="grid gap-14 py-16 lg:grid-cols-12 lg:gap-8 lg:py-20">
          <div className="lg:col-span-4">
            <Logo tone="dark" />
            <p className="mt-6 max-w-xs text-small text-ivory-dim">{brand("tagline")}</p>
            <div className="mt-8 flex items-center gap-4">
              {!isPlaceholder(site.founder.photo) && (
                <div className="relative size-14 shrink-0 overflow-hidden rounded-xs bg-navy-700">
                  <Image src={site.founder.photo} alt="" fill sizes="56px" className="object-cover" />
                </div>
              )}
              <p className="text-small">
                <span className="block text-ivory-soft">{t("founder")}</span>
                <span className="block text-ivory">{founderName}</span>
                {isPlaceholder(site.founder.linkedin) ? (
                  <Fact value={site.founder.linkedin} />
                ) : (
                  <a href={site.founder.linkedin} className="link" target="_blank" rel="noopener noreferrer me">
                    {t("linkedin")}
                    <span className="sr-only"> {common("opensNewTab")}</span>
                  </a>
                )}
              </p>
            </div>
          </div>

          <nav aria-label={t("services")} className={cn("grid grid-cols-2 gap-x-8 gap-y-12 text-small sm:grid-cols-3", facts.length > 0 ? "lg:col-span-5" : "lg:col-span-7 lg:col-start-6")}>
            <div>
              <h2 className="eyebrow font-sans">{t("services")}</h2>
              <ul className="mt-4">
                <li><Link href="/services" className={linkClass}>{nav("services")}</Link></li>
                <li><Link href="/risk-test" className={linkClass}>{nav("riskTest")}</Link></li>
                <li><Link href="/calculators" className={linkClass}>{nav("calculators")}</Link></li>
                <li><Link href="/trade-data" className={linkClass}>{nav("tradeData")}</Link></li>
              </ul>
            </div>
            <div>
              <h2 className="eyebrow font-sans">{t("company")}</h2>
              <ul className="mt-4">
                <li><Link href="/about" className={linkClass}>{nav("about")}</Link></li>
                <li><Link href="/insights" className={linkClass}>{nav("insights")}</Link></li>
                <li><Link href="/contact" className={linkClass}>{nav("contact")}</Link></li>
                <li><Link href="/portal" className={linkClass} data-track="portal_click" data-track-location="footer">{nav("portal")}</Link></li>
              </ul>
            </div>
            <div>
              <h2 className="eyebrow font-sans">{t("legal")}</h2>
              <ul className="mt-4">
                <li><Link href="/privacy" className={linkClass}>{t("privacy")}</Link></li>
                <li><Link href="/terms" className={linkClass}>{t("terms")}</Link></li>
                <li><Link href="/cookies" className={linkClass}>{t("cookies")}</Link></li>
                <li><CookieSettingsButton label={t("cookieSettings")} className={linkClass} /></li>
              </ul>
            </div>
          </nav>

          {facts.length > 0 && (
            <div className="text-small lg:col-span-3">
              <h2 className="eyebrow font-sans">{t("contactTitle")}</h2>
              <dl className="mt-4 space-y-4">
                {facts.map((f) => (
                  <div key={f.key}>
                    <dt className="text-ivory-soft">{t(f.key)}</dt>
                    <dd className="mt-0.5 text-ivory">
                      {f.href ? (
                        <a href={f.href} className="link">
                          {f.value}
                        </a>
                      ) : (
                        <Fact value={f.value} />
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 border-t border-line-navy py-8 text-caption text-ivory-soft md:flex-row md:items-start md:justify-between md:gap-12">
          <p className="max-w-3xl">{t("disclaimer")}</p>
          <p className="shrink-0 whitespace-nowrap">{t("copyright", { year, legalName: isPlaceholder(site.legalName) ? "Ponenti" : site.legalName })}</p>
        </div>
      </div>
    </footer>
  );
}
