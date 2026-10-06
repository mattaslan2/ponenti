import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Tailwind class merging, extended with the brand's custom font sizes so
 * `text-display-lg` and a text color never cancel out. A size added to
 * src/design/tokens.css must be added here too.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display-xl", "display-lg", "display-md", "display-sm", "numeral", "lead", "body", "title", "small", "caption", "eyebrow"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
