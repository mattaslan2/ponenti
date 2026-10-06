import { isValidElement, type ComponentProps, type ReactNode } from "react";
import { getTranslations } from "next-intl/server";

/** Plain text of a React subtree (MDX table cells hold only text and inline tags). */
function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

/** Header cell texts, used to give each table region a unique name. */
function headerCells(node: ReactNode, inHead = false): string[] {
  if (Array.isArray(node)) return node.flatMap((n) => headerCells(n, inHead));
  if (!isValidElement<{ children?: ReactNode }>(node)) return [];
  if (node.type === "th" && inHead) return [textOf(node.props.children).trim()];
  return headerCells(node.props.children, inHead || node.type === "thead");
}

/**
 * Wide tables scroll sideways on phones. The wrapper is a named, focusable
 * region so keyboard users can scroll it too.
 */
export async function ScrollTable(props: ComponentProps<"table">) {
  const t = await getTranslations("common");
  const headers = headerCells(props.children).filter(Boolean);
  const label = headers.length ? `${t("scrollTable")}: ${headers.join(", ")}` : t("scrollTable");
  return (
    <div role="region" aria-label={label} tabIndex={0} className="-mx-5 overflow-x-auto px-5 focus-visible:outline-2 sm:mx-0 sm:px-0">
      <table {...props} />
    </div>
  );
}
