import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-xs border border-input bg-paper px-3 py-2.5 text-base text-graphite transition-colors duration-200 outline-none placeholder:text-mist focus-visible:border-cobalt focus-visible:ring-2 focus-visible:ring-cobalt/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
