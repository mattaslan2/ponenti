"use client";

import { useRef } from "react";
import { Lock, Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { StaticPathname } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "@/components/brand/logo";

export type NavItem = { href: StaticPathname; key: "services" | "riskTest" | "calculators" | "insights" | "about" | "contact" };

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

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="xl:hidden"
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
          <div className="flex h-16 items-center justify-between border-b border-line px-5">
            <Logo />
            <Button variant="ghost" size="icon" onClick={close} aria-label={tc("close")}>
              <X aria-hidden="true" className="size-6" />
            </Button>
          </div>
          <nav aria-label={t("primary")} className="px-5 py-4">
            <ul className="divide-y divide-line">
              {items.map((item) => (
                <li key={item.key}>
                  <Link href={item.href} onClick={close} className="flex min-h-12 items-center font-display text-[1.375rem] text-navy">
                    {t(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="space-y-3 border-t border-line px-5 py-5">
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
            <Button asChild size="lg" variant="ghost" className="w-full border border-navy/30">
              {portalHref ? (
                <a href={portalHref} data-track="portal_click" data-track-location="mobile_menu">
                  <Lock aria-hidden="true" className="size-4" />
                  {t("portal")}
                </a>
              ) : (
                <Link href="/portal" onClick={close} data-track="portal_click" data-track-location="mobile_menu">
                  <Lock aria-hidden="true" className="size-4" />
                  {t("portal")}
                </Link>
              )}
            </Button>
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-mist">{tc("language")}</span>
              <LanguageSwitcher onNavigate={close} />
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
