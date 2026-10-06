import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Slot } from "radix-ui";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-xs border border-transparent text-[0.9375rem] font-medium whitespace-nowrap transition-colors duration-200 outline-none select-none disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-navy text-ivory hover:bg-navy-700",
        brass: "bg-brass text-navy hover:bg-brass-light",
        outline: "border-navy/70 bg-transparent text-navy hover:bg-navy hover:text-ivory",
        outlineLight: "border-ivory/60 bg-transparent text-ivory hover:bg-ivory hover:text-navy",
        secondary: "bg-sand text-navy hover:bg-line",
        ghost: "text-navy hover:bg-sand",
        link: "h-auto px-0 text-cobalt underline decoration-cobalt/40 underline-offset-4 hover:decoration-cobalt",
        destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-3.5 text-[0.875rem]",
        lg: "h-12 px-6 text-base",
        icon: "size-11",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
