import { ArrowRight, CalendarDays, MessageCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { whatsappHref } from "@/lib/links";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "brass" | "outline" | "outlineLight";

export async function BookButton({
  location,
  variant = "default",
  size = "lg",
  short = false,
  className,
}: {
  location: string;
  variant?: ButtonVariant;
  size?: "default" | "sm" | "lg";
  short?: boolean;
  className?: string;
}) {
  const t = await getTranslations("cta");
  return (
    <Button asChild variant={variant} size={size} className={className}>
      <Link
        href={{ pathname: "/contact", hash: "book" }}
        data-track="cta_click"
        data-track-label="book"
        data-track-location={location}
      >
        <CalendarDays aria-hidden="true" />
        {short ? t("bookShort") : t("book")}
      </Link>
    </Button>
  );
}

export async function WhatsAppButton({
  location,
  variant = "outline",
  size = "lg",
  className,
}: {
  location: string;
  variant?: ButtonVariant;
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  const t = await getTranslations("cta");
  const tc = await getTranslations("common");
  const href = whatsappHref(t("whatsappMessage"));
  const content = (
    <>
      <MessageCircle aria-hidden="true" />
      {t("whatsapp")}
    </>
  );
  return (
    <Button asChild variant={variant} size={size} className={className}>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" data-track="whatsapp_click" data-track-location={location}>
          {content}
          <span className="sr-only"> {tc("opensNewTab")}</span>
        </a>
      ) : (
        <Link href="/contact" data-track="whatsapp_click" data-track-location={location}>
          {content}
        </Link>
      )}
    </Button>
  );
}

export async function RiskTestLink({ location, className, light }: { location: string; className?: string; light?: boolean }) {
  const t = await getTranslations("cta");
  return (
    <Link
      href="/risk-test"
      data-track="cta_click"
      data-track-label="risk_test"
      data-track-location={location}
      className={cn(
        "group inline-flex min-h-11 items-center gap-1.5 font-medium underline decoration-1 underline-offset-4",
        light ? "text-brass-light decoration-brass-light/50" : "text-cobalt decoration-cobalt/40 hover:decoration-cobalt",
        className,
      )}
    >
      {t("riskTest")}
      <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
    </Link>
  );
}
