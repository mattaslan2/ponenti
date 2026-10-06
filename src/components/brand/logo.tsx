import { cn } from "@/lib/utils";

/**
 * Wind-rose mark. The west point is long and solid: Ponenti points west.
 * Strokes stay 1px at any size (non-scaling), so the mark reads as hairlines.
 */
export function WindRose({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <g stroke="currentColor" strokeWidth={1} vectorEffect="non-scaling-stroke">
        <circle cx="32" cy="32" r="21" opacity={0.6} vectorEffect="non-scaling-stroke" />
        <path
          d="M32 32 44.6 19.4M32 32 44.6 44.6M32 32 19.4 44.6M32 32 19.4 19.4"
          opacity={0.6}
          vectorEffect="non-scaling-stroke"
        />
        <path d="M32 9.5 34.4 29.6 32 32 29.6 29.6Z" vectorEffect="non-scaling-stroke" />
        <path d="M54.5 32 34.4 34.4 32 32 34.4 29.6Z" vectorEffect="non-scaling-stroke" />
        <path d="M32 54.5 29.6 34.4 32 32 34.4 34.4Z" vectorEffect="non-scaling-stroke" />
      </g>
      <path d="M2.5 32 29.6 28.4 32 32 29.6 35.6Z" fill="currentColor" />
      <circle cx="32" cy="32" r="2.2" fill="currentColor" />
    </svg>
  );
}

/** Brass mark on a navy tile, with the PONENTI wordmark. */
export function Logo({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="grid size-9 place-items-center rounded-xs bg-navy text-brass ring-1 ring-brass/40 ring-inset">
        <WindRose className="size-7" />
      </span>
      <span
        className={cn(
          "font-display text-[1.375rem] leading-none font-semibold tracking-[0.2em]",
          tone === "light" ? "text-navy" : "text-ivory",
        )}
      >
        PONENTI
      </span>
    </span>
  );
}
