import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Slot } from "radix-ui";

/**
 * Buttons are rectangles of ink: 2 px corners, no shadows, no fills in the accent.
 * `default` is the one primary action on light grounds, `light` on navy.
 * `outline` and `outlineLight` are the secondary action beside it.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2.5 rounded-xs border border-transparent font-medium tracking-[0.005em] whitespace-nowrap transition-colors duration-200 outline-none select-none disabled:pointer-events-none disabled:opacity-45 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-navy text-ivory hover:bg-navy-700",
        light: "bg-ivory text-navy hover:bg-paper",
        outline: "border-navy/30 bg-transparent text-navy hover:border-navy",
        outlineLight: "border-ivory/35 bg-transparent text-ivory hover:border-ivory",
        secondary: "bg-sand text-navy hover:bg-line",
        ghost: "text-navy hover:bg-sand",
        link: "h-auto px-0 text-navy underline decoration-brass underline-offset-4 hover:decoration-current",
        destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20",
      },
      size: {
        default: "h-12 px-6 text-[0.9375rem]",
        sm: "h-10 px-4.5 text-[0.875rem]",
        lg: "h-14 px-8 text-[0.9375rem]",
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
