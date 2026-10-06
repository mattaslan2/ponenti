import { Lock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { portalTarget } from "@/lib/links";
import { cn } from "@/lib/utils";

/**
 * "Müşteri Portalı / Client portal": secondary button with a lock icon.
 * The target comes from NEXT_PUBLIC_PORTAL_URL (default /portal).
 */
export async function PortalButton({ className, compact }: { className?: string; compact?: boolean }) {
  const t = await getTranslations("nav");
  const target = portalTarget();
  const label = (
    <>
      <Lock aria-hidden="true" className="size-3.5" />
      <span className={cn(compact && "2xl:hidden")}>{compact ? t("portalShort") : t("portal")}</span>
      {compact && <span className="hidden 2xl:inline">{t("portal")}</span>}
    </>
  );
  return (
    <Button asChild variant="outline" size="sm" className={cn("border-navy/40", className)}>
      {target.kind === "internal" ? (
        <Link href="/portal" data-track="portal_click" data-track-location="header">
          {label}
        </Link>
      ) : (
        <a href={target.href} data-track="portal_click" data-track-location="header">
          {label}
        </a>
      )}
    </Button>
  );
}
