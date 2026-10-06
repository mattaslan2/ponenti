import { cn } from "@/lib/utils";

/** Iznik-inspired geometric band at about 4% opacity, used between sections. */
export function IznikDivider({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("iznik-divider", className)} />;
}

/** Thin 1px brass rule. */
export function BrassRule({ className, short }: { className?: string; short?: boolean }) {
  return <div aria-hidden="true" className={cn(short ? "rule-short" : "rule", className)} />;
}
