import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "ivory" | "sand" | "navy";

export function Section({
  id,
  eyebrow,
  title,
  intro,
  tone = "ivory",
  className,
  style,
  children,
}: {
  id: string;
  style?: CSSProperties;
  eyebrow?: ReactNode;
  title?: ReactNode;
  intro?: ReactNode;
  tone?: Tone;
  className?: string;
  children?: ReactNode;
}) {
  const navy = tone === "navy";
  return (
    <section
      id={id}
      aria-labelledby={title ? `${id}-title` : undefined}
      style={style}
      className={cn(
        "relative scroll-mt-20 py-16 sm:py-24",
        navy && "on-navy bg-navy text-ivory",
        tone === "sand" && "bg-sand",
        className,
      )}
    >
      <div className="page">
        {(eyebrow || title) && (
          <header className="max-w-3xl" data-reveal>
            {eyebrow && <p className={cn("eyebrow", navy ? "text-brass-light" : "text-brass-deep")}>{eyebrow}</p>}
            {title && (
              <h2 id={`${id}-title`} className={cn("mt-3 text-display-lg", navy && "text-ivory")}>
                {title}
              </h2>
            )}
            {intro && <p className={cn("mt-4 text-lead", navy ? "text-ivory-dim" : "text-mist")}>{intro}</p>}
          </header>
        )}
        {children && <div className={cn(title && "mt-10 sm:mt-14")}>{children}</div>}
      </div>
    </section>
  );
}

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
    <div className="border-b border-line bg-ivory">
      <div className="page pt-12 pb-12 sm:pt-20 sm:pb-16">
        {eyebrow && <p className="eyebrow text-brass-deep">{eyebrow}</p>}
        <h1 className="mt-3 max-w-4xl text-display-xl">{title}</h1>
        {intro && <p className="mt-5 max-w-2xl text-lead text-mist">{intro}</p>}
        {children}
      </div>
    </div>
  );
}
