import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

/** Link to an official source: opens in a new tab and says so to screen readers. */
export async function SourceLink({
  href,
  children,
  className,
  icon = true,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  icon?: boolean;
}) {
  const t = await getTranslations("common");
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cn("link inline-flex items-baseline gap-1", className)}>
      {children}
      {icon && <ArrowUpRight aria-hidden="true" className="nudge-up size-3.5 shrink-0 translate-y-0.5" />}
      <span className="sr-only"> {t("opensNewTab")}</span>
    </a>
  );
}
