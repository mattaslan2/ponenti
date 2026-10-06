import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "ivory" | "sand" | "navy";
type Layout = "stack" | "split";

/**
 * One section of a page. Sections are separated by air (py-section: 104 px on a
 * phone, 192 px on a desktop) and one hairline, never by boxes.
 *
 * layout="stack"  header on top, content below at full width.
 * layout="split"  header in the left third (it stays in view while the list
 *                 beside it scrolls), content in the right two thirds.
 * Alternating the two is what gives a long page its rhythm.
 */
export function Section({
  id,
  eyebrow,
  title,
  intro,
  aside,
  tone = "ivory",
  layout = "stack",
  space = "section",
  rule = true,
  className,
  style,
  children,
}: {
  id: string;
  style?: CSSProperties;
  eyebrow?: ReactNode;
  title?: ReactNode;
  intro?: ReactNode;
  /** Extra content under the header (a link, a note). */
  aside?: ReactNode;
  tone?: Tone;
  layout?: Layout;
  /** Vertical padding: the full section rhythm, or the tighter band for a block that belongs to its neighbor. */
  space?: "section" | "band";
  /** Hairline above the section. Bands with their own ground never draw one. */
  rule?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const navy = tone === "navy";
  const split = layout === "split";
  const hasHeader = Boolean(eyebrow || title);
  return (
    <section
      id={id}
      aria-labelledby={title ? `${id}-title` : undefined}
      style={style}
      className={cn("relative scroll-mt-20", navy && "on-navy bg-navy text-ivory", tone === "sand" && "bg-sand", className)}
    >
      <div className="page">
        {rule && tone === "ivory" && <div aria-hidden="true" className="rule" data-reveal="rule" />}
        <div className={cn(space === "band" ? "py-band" : "py-section", split && "lg:grid lg:grid-cols-12 lg:gap-x-8")}>
          {hasHeader && (
            <header className={cn(split ? "lg:col-span-4 lg:pr-8" : "max-w-3xl")} data-reveal>
              <div className={cn(split && "lg:sticky lg:top-32")}>
                {eyebrow && <p className="eyebrow kicker">{eyebrow}</p>}
                {title && (
                  <h2 id={`${id}-title`} className={cn("text-display-lg", eyebrow && "mt-6", split && "lg:text-display-md", navy && "text-ivory")}>
                    {title}
                  </h2>
                )}
                {intro && <p className={cn("mt-5 max-w-xl text-lead", split && "lg:text-body", navy ? "text-ivory-dim" : "text-mist")}>{intro}</p>}
                {aside && <div className="mt-8">{aside}</div>}
              </div>
            </header>
          )}
          {children && <div className={cn(split ? "lg:col-span-8" : undefined, hasHeader && (split ? "mt-stack lg:mt-0" : "mt-stack"))}>{children}</div>}
        </div>
      </div>
    </section>
  );
}

/** Opening block of an inner page: label, one large serif title, an optional lead. */
export function PageHeader({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="page">
      <div className="pt-band pb-band">
        {eyebrow && <p className="eyebrow kicker">{eyebrow}</p>}
        <h1 className="mt-6 max-w-[20ch] text-display-xl">{title}</h1>
        {intro && <p className="mt-8 max-w-2xl text-lead text-mist">{intro}</p>}
        {children && <div>{children}</div>}
      </div>
      <div aria-hidden="true" className="rule" />
    </div>
  );
}
