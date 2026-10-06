import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-xs border border-input bg-paper px-3.5 text-base text-navy transition-colors duration-200 outline-none placeholder:text-mist-soft hover:border-navy/70 focus-visible:border-navy focus-visible:ring-2 focus-visible:ring-navy/15 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/15",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
