import { ArrowRight, ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { whatsappHref } from "@/lib/links";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "light" | "outline" | "outlineLight";

/** The one primary action: book the 15-minute call. */
export async function BookButton({
  location,
  variant = "default",
  size = "lg",
  short = false,
  icon = true,
  className,
}: {
  location: string;
  variant?: ButtonVariant;
  size?: "default" | "sm" | "lg";
  short?: boolean;
  icon?: boolean;
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
        {short ? t("bookShort") : t("book")}
        {icon && <ArrowRight aria-hidden="true" className="nudge" />}
      </Link>
    </Button>
  );
}

/**
 * The secondary action. With a WhatsApp number it opens the chat. Without one it
 * becomes "Send a message" and leads to the form: the button never says WhatsApp
 * unless WhatsApp is on the other side of it.
 */
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
  return (
    <Button asChild variant={variant} size={size} className={className}>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" data-track="whatsapp_click" data-track-location={location}>
          {t("whatsapp")}
          <ArrowUpRight aria-hidden="true" className="nudge-up" />
          <span className="sr-only"> {tc("opensNewTab")}</span>
        </a>
      ) : (
        <Link href={{ pathname: "/contact", hash: "message" }} data-track="cta_click" data-track-label="message" data-track-location={location}>
          {t("message")}
        </Link>
      )}
    </Button>
  );
}

/** Text link with an arrow, for the third, lowest-commitment action. */
export async function RiskTestLink({ location, className }: { location: string; className?: string }) {
  const t = await getTranslations("cta");
  return (
    <Link
      href="/risk-test"
      data-track="cta_click"
      data-track-label="risk_test"
      data-track-location={location}
      className={cn("link inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-medium", className)}
    >
      {t("riskTest")}
      <ArrowRight aria-hidden="true" className="nudge size-4" />
    </Link>
  );
}

/** Inline text link with an arrow that moves on hover. */
export function ArrowLink({
  href,
  children,
  className,
  ...props
}: React.ComponentProps<typeof Link>) {
  return (
    <Link href={href} className={cn("link inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-medium", className)} {...props}>
      {children}
      <ArrowRight aria-hidden="true" className="nudge size-4 shrink-0" />
    </Link>
  );
}
