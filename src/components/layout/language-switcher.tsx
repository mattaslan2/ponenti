"use client";

import { useLocale, useTranslations } from "next-intl";
import { LOCALE_COOKIE } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * TR / EN switch, set as text. Uses the page's hreflang alternate (so an
 * article opens in its translation, not on the home page) and stores the
 * choice for 12 months.
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
    <div role="group" aria-label={t("language")} className={cn("inline-flex items-center text-[0.8125rem] font-medium tracking-[0.08em]", className)}>
      <span aria-current="true" className="grid min-h-11 min-w-8 place-items-center border-b border-transparent text-navy">
        <span className="border-b border-brass pb-0.5">{locale.toUpperCase()}</span>
      </span>
      <span aria-hidden="true" className="px-1 text-line">
        /
      </span>
      <a
        href={`/${other}`}
        hrefLang={other}
        onClick={go}
        className="grid min-h-11 min-w-8 place-items-center text-mist-soft transition-colors duration-200 hover:text-navy"
      >
        <span className="pb-0.5">
          {other.toUpperCase()}
          {/* The accessible name starts with the visible label ("EN"), as WCAG 2.5.3 asks. */}
          <span className="sr-only">
            , {t("switchTo")}: <span lang={other}>{other === "en" ? "English" : "Türkçe"}</span>
          </span>
        </span>
      </a>
    </div>
  );
}
