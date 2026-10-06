"use client";

import { useLocale, useTranslations } from "next-intl";
import { LOCALE_COOKIE } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * TR | EN switch. Uses the page's hreflang alternate (so an article opens in
 * its translation, not on the home page) and stores the choice for 12 months.
 */
export function LanguageSwitcher({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const locale = useLocale();
  const t = useTranslations("common");
  const other = locale === "tr" ? "en" : "tr";

  function go(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${LOCALE_COOKIE}=${other}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax${secure}`;
    const alt = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${other}"]`);
    let target = `/${other}`;
    if (alt?.href) {
      try {
        target = new URL(alt.href).pathname;
      } catch {
        /* keep the fallback */
      }
    }
    onNavigate?.();
    window.location.assign(target + window.location.search + window.location.hash);
  }

  return (
    <div
      role="group"
      aria-label={t("language")}
      className={cn("inline-flex h-9 items-stretch overflow-hidden rounded-xs border border-line text-[0.8125rem] font-semibold tracking-wide", className)}
    >
      <span aria-current="true" className="grid min-w-10 place-items-center bg-navy px-2.5 text-ivory">
        {locale.toUpperCase()}
      </span>
      <a
        href={`/${other}`}
        hrefLang={other}
        onClick={go}
        className="grid min-w-10 place-items-center px-2.5 text-navy transition-colors duration-200 hover:bg-sand"
      >
        {other.toUpperCase()}
        {/* The accessible name starts with the visible label ("EN"), as WCAG 2.5.3 asks. */}
        <span className="sr-only">
          , {t("switchTo")}: <span lang={other}>{other === "en" ? "English" : "Türkçe"}</span>
        </span>
      </a>
    </div>
  );
}
