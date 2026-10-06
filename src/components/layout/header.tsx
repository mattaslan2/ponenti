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

export async function Header() {
  const t = await getTranslations("nav");
  const brand = await getTranslations("brand");
  const cta = await getTranslations("cta");
  const portal = portalTarget();

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-ivory/95 backdrop-blur-sm supports-[backdrop-filter]:bg-ivory/85">
      <div className="page flex h-16 items-center gap-6">
        <Link href="/" aria-label={brand("logoLabel")} className="shrink-0">
          <Logo />
        </Link>
        <nav aria-label={t("primary")} className="hidden xl:block">
          <ul className="flex items-center gap-5 text-[0.9375rem] text-navy">
            {navItems
              .filter((i) => i.key !== "contact")
              .map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-11 items-center whitespace-nowrap underline-offset-[6px] decoration-brass hover:underline"
                  >
                    {item.key === "services" ? t("pricing") : t(item.key)}
                  </Link>
                </li>
              ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <PortalButton compact className="hidden md:inline-flex" />
          <BookButton location="header" short size="sm" className="hidden sm:inline-flex" />
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
