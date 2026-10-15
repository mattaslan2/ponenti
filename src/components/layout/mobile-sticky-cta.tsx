"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useConsent } from "@/lib/consent";
import { cn } from "@/lib/utils";

/**
 * Phone-only bottom bar with the two main actions: the free pre-check, then a
 * call (or WhatsApp when a number is connected). Appears once the hero's buttons
 * scroll out of view (and the cookie banner is answered); hidden on the pre-check page.
 */
export function MobileStickyCta({ whatsappHref }: { whatsappHref: string | null }) {
  const t = useTranslations("cta");
  const [visible, setVisible] = useState(false);
  const consent = useConsent();
  const consentAnswered = consent === "granted" || consent === "denied";
  const pathname = usePathname();

  useEffect(() => {
    const anchor = document.getElementById("hero-actions");
    if (anchor) {
      const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0));
      observer.observe(anchor);
      return () => observer.disconnect();
    }
    const onScroll = () => setVisible(window.scrollY > 600);
    const frame = window.requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  // The pre-check page carries its own form; the bar would only repeat it.
  const onPrecheck = /\/(on-kontrol|pre-check)$/.test(pathname);
  const show = visible && consentAnswered && !onPrecheck;
  const secondary = "inline-flex h-12 items-center justify-center rounded-xs border border-ivory/35 px-3 text-[0.9375rem] font-medium text-ivory";
  return (
    <div
      aria-hidden={!show}
      className={cn(
        "on-navy fixed inset-x-0 bottom-0 z-30 bg-navy px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-[opacity,transform] duration-300 sm:hidden",
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0",
      )}
    >
      <div className="grid grid-cols-2 gap-2.5">
        <Link
          href="/pre-check"
          tabIndex={show ? 0 : -1}
          data-track="cta_click"
          data-track-label="precheck"
          data-track-location="sticky_bar"
          className="inline-flex h-12 items-center justify-center rounded-xs bg-ivory px-3 text-[0.9375rem] font-medium text-navy"
        >
          {t("precheckShort")}
        </Link>
        {whatsappHref ? (
          <a
            href={whatsappHref}
            tabIndex={show ? 0 : -1}
            target="_blank"
            rel="noopener noreferrer"
            data-track="whatsapp_click"
            data-track-location="sticky_bar"
            className={secondary}
          >
            WhatsApp
          </a>
        ) : (
          <Link
            href={{ pathname: "/contact", hash: "book" }}
            tabIndex={show ? 0 : -1}
            data-track="cta_click"
            data-track-label="book"
            data-track-location="sticky_bar"
            className={secondary}
          >
            {t("bookShort")}
          </Link>
        )}
      </div>
    </div>
  );
}
