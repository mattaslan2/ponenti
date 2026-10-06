"use client";

import { useRef } from "react";
import { ArrowRight, Lock, Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { StaticPathname } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "@/components/brand/logo";

export type NavItem = { href: StaticPathname; key: "services" | "riskTest" | "calculators" | "tradeData" | "insights" | "about" | "contact" };

/**
 * Phone and tablet menu. A native modal <dialog>: focus stays inside, Esc closes,
 * and focus returns to the menu button. Styled as a right-hand sheet in globals.css.
 */
export function MobileNav({
  items,
  portalHref,
  whatsappHref,
}: {
  items: NavItem[];
  portalHref: string | null;
  whatsappHref: string | null;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const cta = useTranslations("cta");
  const open = () => dialog.current?.showModal();
  const close = () => dialog.current?.close();

  const portalLabel = (
    <>
      <Lock aria-hidden="true" className="size-4 text-brass-deep" />
      {t("portal")}
    </>
  );

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="-mr-2.5 hover:bg-transparent xl:hidden"
        aria-label={tc("menu")}
        aria-haspopup="dialog"
        aria-controls="mobile-menu"
        onClick={open}
      >
        <Menu aria-hidden="true" className="size-6" />
      </Button>
      <dialog
        id="mobile-menu"
        ref={dialog}
        aria-label={tc("menu")}
        className="mobile-menu"
        // A click on the dimmed backdrop lands on the <dialog> element itself.
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="flex min-h-full flex-col">
          <div className="flex h-16 items-center justify-between px-6">
            <Logo />
            <Button variant="ghost" size="icon" className="-mr-2.5 hover:bg-transparent" onClick={close} aria-label={tc("close")}>
              <X aria-hidden="true" className="size-6" />
            </Button>
          </div>
          <nav aria-label={t("primary")} className="px-6 pt-6 pb-8">
            <ul className="border-t border-line">
              {items.map((item) => (
                <li key={item.key} className="border-b border-line">
                  <Link href={item.href} onClick={close} className="flex min-h-15 items-center justify-between gap-4 py-3 font-display text-[1.625rem] leading-tight text-navy">
                    {t(item.key)}
                    <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-brass-deep" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-auto space-y-3 px-6 pb-8">
            <Button asChild size="lg" className="w-full">
              <Link
                href={{ pathname: "/contact", hash: "book" }}
                onClick={close}
                data-track="cta_click"
                data-track-label="book"
                data-track-location="mobile_menu"
              >
                {cta("book")}
              </Link>
            </Button>
            {whatsappHref && (
              <Button asChild size="lg" variant="outline" className="w-full">
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" data-track="whatsapp_click" data-track-location="mobile_menu">
                  {cta("whatsapp")}
                </a>
              </Button>
            )}
            <div className="flex items-center justify-between pt-3">
              {portalHref ? (
                <a href={portalHref} className="inline-flex min-h-11 items-center gap-2 text-[0.9375rem] text-navy" data-track="portal_click" data-track-location="mobile_menu">
                  {portalLabel}
                </a>
              ) : (
                <Link href="/portal" onClick={close} className="inline-flex min-h-11 items-center gap-2 text-[0.9375rem] text-navy" data-track="portal_click" data-track-location="mobile_menu">
                  {portalLabel}
                </Link>
              )}
              <LanguageSwitcher onNavigate={close} />
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
