import { Lock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { portalTarget } from "@/lib/links";
import { cn } from "@/lib/utils";

/**
 * "Müşteri Portalı / Client portal": the quiet secondary action in the header,
 * a text link with a lock. The target comes from NEXT_PUBLIC_PORTAL_URL
 * (default /portal).
 */
export async function PortalButton({ className, compact }: { className?: string; compact?: boolean }) {
  const t = await getTranslations("nav");
  const target = portalTarget();
  const classes = cn("hover-rule inline-flex min-h-11 items-center gap-2 text-[0.875rem] whitespace-nowrap text-navy after:bottom-2.5", className);
  const label = (
    <>
      <Lock aria-hidden="true" className="size-3.5 text-brass-deep" />
      <span className={cn(compact && "2xl:hidden")}>{compact ? t("portalShort") : t("portal")}</span>
      {compact && <span className="hidden 2xl:inline">{t("portal")}</span>}
    </>
  );
  return target.kind === "internal" ? (
    <Link href="/portal" className={classes} data-track="portal_click" data-track-location="header">
      {label}
    </Link>
  ) : (
    <a href={target.href} className={classes} data-track="portal_click" data-track-location="header">
      {label}
    </a>
  );
}
