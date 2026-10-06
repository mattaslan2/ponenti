import type { MDXComponents } from "mdx/types";
import type { ComponentProps } from "react";
import { Company } from "@/components/mdx/company";
import { ScrollTable } from "@/components/mdx/scroll-table";

/**
 * Styling and components for MDX content (knowledge center and legal pages).
 * External links open in a new tab; the page provides the "#new-tab-note"
 * description so screen readers announce it.
 */
const components: MDXComponents = {
  a: ({ href = "", children, ...props }: ComponentProps<"a">) =>
    /^https?:\/\//.test(href) ? (
      <a href={href} target="_blank" rel="noopener noreferrer" aria-describedby="new-tab-note" {...props}>
        {children}
      </a>
    ) : (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  table: ScrollTable,
  Company,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
