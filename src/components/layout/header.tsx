import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/brand/logo";
import { BookButton } from "@/components/cta";
import { portalTarget, whatsappHref } from "@/lib/links";
import { LanguageSwitcher } from "./language-switcher";
import { MobileNav, type NavItem } from "./mobile-nav";
import { PortalButton } from "./portal-button";

export const navItems: NavItem[] = [
  { href: "/services", key: "services" },
  { href: "/risk-test", key: "riskTest" },
  { href: "/calculators", key: "calculators" },
  { href: "/trade-data", key: "tradeData" },
  { href: "/insights", key: "insights" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
];

/**
 * Clear over the page at the top; a hairline and a veil appear once the page
 * moves (html[data-scrolled], set by ClientRuntime). The bar is wider than the
 * text column so the Turkish menu fits on one line from 1280 px up.
 */
export async function Header() {
  const t = await getTranslations("nav");
  const brand = await getTranslations("brand");
  const cta = await getTranslations("cta");
  const portal = portalTarget();

  return (
    <header className="site-header sticky top-0 z-40 bg-ivory">
      <div className="mx-auto flex h-16 w-full max-w-[100rem] items-center gap-6 px-6 sm:px-10 lg:h-20 lg:px-16 xl:gap-8 xl:px-10 2xl:px-16">
        <Link href="/" aria-label={brand("logoLabel")} className="shrink-0">
          <Logo />
        </Link>
        <nav aria-label={t("primary")} className="hidden xl:block">
          <ul className="flex items-center gap-6 text-[0.875rem] text-navy 2xl:gap-8">
            {navItems
              .filter((i) => i.key !== "contact")
              .map((item) => (
                <li key={item.key}>
                  <Link href={item.href} className="hover-rule inline-flex min-h-11 items-center whitespace-nowrap after:bottom-2.5">
                    {item.key === "services" ? t("pricing") : t(item.key)}
                  </Link>
                </li>
              ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-4 sm:gap-6">
          <LanguageSwitcher />
          <PortalButton compact className="hidden md:inline-flex" />
          <BookButton location="header" short size="sm" icon={false} className="hidden sm:inline-flex" />
          <MobileNav
            items={navItems}
            portalHref={portal.kind === "external" ? portal.href : null}
            whatsappHref={whatsappHref(cta("whatsappMessage"))}
          />
        </div>
      </div>
    </header>
  );
}
