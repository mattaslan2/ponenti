import type { ReactNode } from "react";
import { publicEnv } from "@/lib/env";
import { isPlaceholder } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * PLACEHOLDER RULE: a visitor never sees a bracketed marker on a marketing page.
 * A missing fact, photo or proof item simply does not render, and the layout
 * closes around it. Markers show only
 *   - in preview builds (NEXT_PUBLIC_SHOW_PLACEHOLDERS=true), and
 *   - inside the legal drafts, which say at the top that they are drafts.
 * `npm run placeholders` lists everything still open; `-- --strict` fails the
 * launch check while any required fact is missing.
 */
export const showPlaceholders = publicEnv.showPlaceholders;

/** True when a company fact is real, or when the preview should mark the gap. */
export function hasFact(value?: string | null): boolean {
  return !isPlaceholder(value) || showPlaceholders;
}

/**
 * A required company fact (address, phone, legal name...). Renders the real
 * value. While it is still a placeholder it renders nothing for visitors and a
 * marker in preview builds. Wrap the surrounding row in hasFact(value) so the
 * label disappears with it.
 */
export function Fact({ value, className }: { value: string; className?: string }) {
  if (!isPlaceholder(value)) return <span className={className}>{value}</span>;
  if (!showPlaceholders) return null;
  return <span className={cn("ph", className)}>{value}</span>;
}

/** A company fact inside a legal draft: the gap stays visible until counsel signs off. */
export function DraftFact({ value }: { value: string }) {
  if (isPlaceholder(value)) return <span className="ph">{value}</span>;
  return <span>{value}</span>;
}

/**
 * [REPLACE WITH REAL] proof slot: testimonials, client logos, case studies,
 * client counts, results. Hidden from visitors until real, verifiable content
 * is passed as children. In preview builds the empty slot shows as a marked
 * box so you can see where proof belongs.
 */
export function ReplaceWithReal({ label, children }: { label: string; children?: ReactNode }) {
  if (children) return <>{children}</>;
  if (!showPlaceholders) return null;
  return (
    <div className="ph block p-4" data-placeholder="replace-with-real">
      [REPLACE WITH REAL] {label}
    </div>
  );
}

/**
 * [SHOW ONLY AFTER E&O CONFIRMS] wrapper for the penalty promise. Nothing renders
 * until NEXT_PUBLIC_EO_CONFIRMED=true. In preview builds an empty marked box shows
 * where it will go, without the promise text.
 */
export function ShowAfterEOConfirms({ children }: { children: ReactNode }) {
  if (publicEnv.eoConfirmed) return <>{children}</>;
  if (!showPlaceholders) return null;
  return (
    <div className="ph block p-4" data-placeholder="eo">
      [SHOW ONLY AFTER E&amp;O CONFIRMS] Penalty promise (hidden)
    </div>
  );
}

/** [confirm] copy: renders normally; in preview builds it is outlined for review. */
export function Confirm({ children, note }: { children: ReactNode; note?: string }) {
  if (!showPlaceholders) return <>{children}</>;
  return (
    <span className="rounded-xs outline-1 outline-brass-deep/60 outline-dashed" title={`[confirm] ${note ?? ""}`} data-placeholder="confirm">
      {children}
      <span className="ph ml-1">[confirm]</span>
    </span>
  );
}

/** A note only the site owner should see (a missing integration, for example). Preview builds only. */
export function PreviewNote({ children }: { children: ReactNode }) {
  if (!showPlaceholders) return null;
  return (
    <p className="ph block p-3" data-placeholder="preview-note">
      {children}
    </p>
  );
}
