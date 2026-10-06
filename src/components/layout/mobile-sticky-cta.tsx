"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useConsent } from "@/lib/consent";
import { cn } from "@/lib/utils";

/**
 * Phone-only bottom bar with the two main actions. Appears once the hero's
 * buttons scroll out of view (and the cookie banner is answered).
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

  const show = visible && consentAnswered;
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
          href={{ pathname: "/contact", hash: "book" }}
          tabIndex={show ? 0 : -1}
          data-track="cta_click"
          data-track-label="book"
          data-track-location="sticky_bar"
          className="inline-flex h-12 items-center justify-center rounded-xs bg-ivory px-3 text-[0.9375rem] font-medium text-navy"
        >
          {t("bookShort")}
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
            href="/risk-test"
            tabIndex={show ? 0 : -1}
            data-track="cta_click"
            data-track-label="risk_test"
            data-track-location="sticky_bar"
            className={secondary}
          >
            {t("riskTest")}
          </Link>
        )}
      </div>
    </div>
  );
}
