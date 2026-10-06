import { cn } from "@/lib/utils";

/** Thin 1 px brass rule, the one ornament the system allows. */
export function BrassRule({ className, short }: { className?: string; short?: boolean }) {
  return <div aria-hidden="true" className={cn("h-px bg-brass", short ? "w-7" : "w-full", className)} />;
}
