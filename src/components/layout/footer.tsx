import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { WindRose } from "@/components/brand/logo";
import { Fact } from "@/components/placeholders";
import { isPlaceholder, site, telHref } from "@/lib/site";
import { CookieSettingsButton } from "./cookie-settings-button";

export async function Footer() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("footer");
  const nav = await getTranslations("nav");
  const brand = await getTranslations("brand");
  const year = new Date().getFullYear();
  const tel = telHref(site.phone);
  const founderName = site.founder.name[locale];

  return (
    <footer className="on-navy relative overflow-hidden bg-navy text-ivory">
      <div aria-hidden="true" className="iznik-field pointer-events-none absolute inset-0 opacity-[0.05]" />
      <div className="page relative py-16">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3 text-brass">
              <WindRose className="size-10" />
              <span className="font-display text-2xl font-semibold tracking-[0.2em] text-ivory">PONENTI</span>
            </div>
            <p className="mt-5 max-w-xs font-display text-xl text-ivory">{brand("pride")}</p>
            <p className="mt-3 max-w-xs text-sm text-ivory-dim">{brand("tagline")}</p>

            <div className="mt-8 flex items-center gap-4">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xs bg-navy-700 ring-1 ring-brass/40">
                {isPlaceholder(site.founder.photo) ? (
                  <span className="ph absolute inset-0 grid place-items-center p-1 text-center text-[0.625rem] leading-tight">
                    [REPLACE WITH REAL] {locale === "tr" ? "fotoğraf" : "photo"}
                  </span>
                ) : (
                  <Image src={site.founder.photo} alt={founderName} fill sizes="64px" className="object-cover" />
                )}
              </div>
              <div className="text-sm">
                <p className="text-ivory-dim">{t("founder")}</p>
                <p className="font-medium text-ivory">{founderName}</p>
                {isPlaceholder(site.founder.linkedin) ? (
                  <Fact value={site.founder.linkedin} />
                ) : (
                  <a href={site.founder.linkedin} className="link" target="_blank" rel="noopener noreferrer me">
                    {t("linkedin")}
                  </a>
                )}
              </div>
            </div>
          </div>

          <nav aria-label={t("services")} className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-5">
            <div>
              <h2 className="eyebrow font-sans text-brass-light">{t("services")}</h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><Link href="/services" className="hover:underline">{nav("services")}</Link></li>
                <li><Link href="/risk-test" className="hover:underline">{nav("riskTest")}</Link></li>
                <li><Link href="/calculators" className="hover:underline">{nav("calculators")}</Link></li>
              </ul>
            </div>
            <div>
              <h2 className="eyebrow font-sans text-brass-light">{t("company")}</h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><Link href="/about" className="hover:underline">{nav("about")}</Link></li>
                <li><Link href="/insights" className="hover:underline">{nav("insights")}</Link></li>
                <li><Link href="/contact" className="hover:underline">{nav("contact")}</Link></li>
                <li><Link href="/portal" className="hover:underline" data-track="portal_click" data-track-location="footer">{nav("portal")}</Link></li>
              </ul>
            </div>
            <div>
              <h2 className="eyebrow font-sans text-brass-light">{t("legal")}</h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><Link href="/privacy" className="hover:underline">{t("privacy")}</Link></li>
                <li><Link href="/terms" className="hover:underline">{t("terms")}</Link></li>
                <li><Link href="/cookies" className="hover:underline">{t("cookies")}</Link></li>
                <li><CookieSettingsButton label={t("cookieSettings")} /></li>
              </ul>
            </div>
          </nav>

          <div className="lg:col-span-3">
            <h2 className="eyebrow font-sans text-brass-light">{t("contactTitle")}</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-ivory-dim">{t("legalEntity")}</dt>
                <dd><Fact value={site.legalName} /></dd>
              </div>
              <div>
                <dt className="text-ivory-dim">{t("address")}</dt>
                <dd><Fact value={site.address} /></dd>
              </div>
              <div>
                <dt className="text-ivory-dim">{t("phone")}</dt>
                <dd>{tel ? <a href={tel} className="link">{site.phone}</a> : <Fact value={site.phone} />}</dd>
              </div>
              <div>
                <dt className="text-ivory-dim">{t("email")}</dt>
                <dd>{isPlaceholder(site.email) ? <Fact value={site.email} /> : <a href={`mailto:${site.email}`} className="link">{site.email}</a>}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-14 border-t border-brass/30 pt-6 text-[0.8125rem] leading-relaxed text-ivory-dim">
          <p className="max-w-3xl">{t("disclaimer")}</p>
          <p className="mt-3">
            {t("copyright", { year, legalName: isPlaceholder(site.legalName) ? "Ponenti" : site.legalName })}
          </p>
        </div>
      </div>
    </footer>
  );
}
