import { cn } from "@/lib/utils";

/**
 * Wind-rose mark. Hairlines in the current text color; the west point is long
 * and solid brass: Ponenti points west. Strokes stay 1 px at any size.
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
      <g stroke="currentColor" strokeWidth={1}>
        <circle cx="32" cy="32" r="20.5" opacity={0.5} vectorEffect="non-scaling-stroke" />
        <path d="M32 32 46.5 17.5M32 32 46.5 46.5M32 32 17.5 46.5M32 32 17.5 17.5" opacity={0.35} vectorEffect="non-scaling-stroke" />
        <path d="M32 8 34.5 29.5 32 32 29.5 29.5Z" vectorEffect="non-scaling-stroke" />
        <path d="M56 32 34.5 34.5 32 32 34.5 29.5Z" vectorEffect="non-scaling-stroke" />
        <path d="M32 56 29.5 34.5 32 32 34.5 34.5Z" vectorEffect="non-scaling-stroke" />
      </g>
      <path d="M2 32 29.5 28.4 32 32 29.5 35.6Z" fill="var(--color-brass)" />
      <circle cx="32" cy="32" r="1.8" fill="currentColor" />
    </svg>
  );
}

/** The mark and the PONENTI wordmark, letterspaced capitals in the display face. */
export function Logo({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  return (
    <span className={cn("inline-flex items-center gap-3", tone === "light" ? "text-navy" : "text-ivory", className)}>
      <WindRose className="size-8 shrink-0" />
      <span className="font-display text-[1.3125rem] leading-none font-medium tracking-[0.26em]">PONENTI</span>
    </span>
  );
}
