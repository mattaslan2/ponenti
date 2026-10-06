import type { ReactNode } from "react";
import { publicEnv } from "@/lib/env";
import { isPlaceholder } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * A required company fact (address, phone, legal name...). Renders the real
 * value, or a visible [REPLACE WITH REAL: ...] marker until it is filled in
 * src/lib/site.ts.
 */
export function Fact({ value, className }: { value: string; className?: string }) {
  if (isPlaceholder(value)) return <span className={cn("ph", className)}>{value}</span>;
  return <span className={className}>{value}</span>;
}

/**
 * [REPLACE WITH REAL] proof slot: testimonials, client logos, case studies,
 * client counts, results. Hidden from visitors until real, verifiable content
 * is passed as children. With NEXT_PUBLIC_SHOW_PLACEHOLDERS=true (preview only)
 * the empty slot shows as a marked box so you can see where proof belongs.
 */
export function ReplaceWithReal({ label, children }: { label: string; children?: ReactNode }) {
  if (children) return <>{children}</>;
  if (!publicEnv.showPlaceholders) return null;
  return (
    <div className="ph block p-4" data-placeholder="replace-with-real">
      [REPLACE WITH REAL] {label}
    </div>
  );
}

/**
 * [SHOW ONLY AFTER E&O CONFIRMS] wrapper for the penalty promise. Nothing renders
 * until NEXT_PUBLIC_EO_CONFIRMED=true. In preview mode an empty marked box shows
 * where it will go, without the promise text.
 */
export function ShowAfterEOConfirms({ children }: { children: ReactNode }) {
  if (publicEnv.eoConfirmed) return <>{children}</>;
  if (!publicEnv.showPlaceholders) return null;
  return (
    <div className="ph block p-4" data-placeholder="eo">
      [SHOW ONLY AFTER E&amp;O CONFIRMS] Penalty promise (hidden)
    </div>
  );
}

/** [confirm] copy: renders normally; in preview mode it is outlined for review. */
export function Confirm({ children, note }: { children: ReactNode; note?: string }) {
  if (!publicEnv.showPlaceholders) return <>{children}</>;
  return (
    <span className="rounded-xs outline-1 outline-risk-medium/60 outline-dashed" title={`[confirm] ${note ?? ""}`} data-placeholder="confirm">
      {children}
      <span className="ph ml-1">[confirm]</span>
    </span>
  );
}
