"use client";

import { useSyncExternalStore } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type RailItem = {
  key: string;
  /** YYYY-MM-DD */
  date: string;
  dateLabel: string;
  kind: "rule" | "deadline";
  title: string;
  text: string;
  href: string;
};

type Labels = {
  title: string;
  effect: string;
  passed: string;
  today: string;
  /** "In {n} days" with {n} replaced here; "one" is used for 1. */
  days: { one: string; other: string };
  source: string;
  opensNewTab: string;
};

const utc = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
/** Days from `today` to `date`, both YYYY-MM-DD (negative = past). */
const daysUntil = (date: string, today: string) => Math.round((utc(date) - utc(today)) / 86_400_000);

/** The visitor's calendar date. The server snapshot is "" so the static HTML carries no status. */
const pad = (n: number) => String(n).padStart(2, "0");
const todaySnapshot = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const subscribeNever = () => () => {};

/**
 * Dates that matter, as a ruled timeline: a hairline with one mark per date.
 * The server renders the dates; the status ("in effect", "today", "in 46 days")
 * is worked out in the browser from the visitor's clock, so a static page never
 * shows a stale countdown. The next date ahead is set in brass.
 */
export function DatedRail({ items, labels }: { items: RailItem[]; labels: Labels }) {
  const today = useSyncExternalStore(subscribeNever, todaySnapshot, () => "");

  const days = today ? items.map((item) => daysUntil(item.date, today)) : null;
  const next = days ? days.findIndex((d) => d >= 0) : -1;
  const status = (i: number) => {
    if (!days) return " ";
    const d = days[i];
    if (d < 0) return items[i].kind === "rule" ? labels.effect : labels.passed;
    if (d === 0) return labels.today;
    return (d === 1 ? labels.days.one : labels.days.other).replace("{n}", String(d));
  };

  return (
    <section aria-labelledby="dates-title">
      <div className="page">
        <div aria-hidden="true" className="rule" />
        <div className="py-12 lg:py-16">
          <h2 id="dates-title" className="eyebrow kicker">
            {labels.title}
          </h2>
          <ol className="relative mt-8 grid gap-y-7 lg:mt-10 lg:grid-cols-5 lg:gap-x-8">
            <span
              aria-hidden="true"
              data-reveal="rule"
              className="absolute top-1.5 bottom-1.5 left-[5px] w-px bg-line lg:top-[5px] lg:right-0 lg:bottom-auto lg:left-0 lg:h-px lg:w-auto"
            />
            {items.map((item, i) => {
              const past = days ? days[i] < 0 : false;
              const isNext = i === next;
              return (
                <li key={item.key} data-reveal className="relative pl-8 lg:pt-8 lg:pl-0">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute top-1 left-0 size-[11px] rounded-full border transition-colors duration-500 lg:top-0",
                      isNext
                        ? "border-brass bg-brass shadow-[0_0_0_4px_var(--color-ivory),0_0_0_5px_var(--color-brass)]"
                        : past
                          ? item.kind === "rule"
                            ? "border-navy bg-navy"
                            : "border-chart-axis bg-chart-axis"
                          : "border-navy bg-ivory",
                    )}
                  />
                  {/* Date and status share a line on phones and stack in the desktop columns. */}
                  <div className="flex flex-wrap items-baseline gap-x-3 lg:block">
                    <p className={cn("font-display text-[1.5rem] leading-none font-medium tracking-[-0.01em] tabular-nums", past && item.kind === "deadline" ? "text-mist" : "text-navy")}>
                      <time dateTime={item.date}>{item.dateLabel}</time>
                    </p>
                    <p data-status className={cn("min-h-4 text-eyebrow font-medium uppercase lg:mt-2.5", isNext ? "text-brass-deep" : "text-mist-soft")}>
                      {status(i)}
                    </p>
                  </div>
                  <h3 className="mt-2.5 font-sans text-small font-semibold text-navy lg:mt-3">{item.title}</h3>
                  <p className="mt-1 max-w-[16rem] text-caption text-mist">{item.text}</p>
                  <p className="mt-3 text-caption text-mist-soft">
                    <a href={item.href} target="_blank" rel="noopener noreferrer" className="link inline-flex items-baseline gap-1">
                      {labels.source}
                      <ArrowUpRight aria-hidden="true" className="nudge-up size-3.5 shrink-0 translate-y-0.5" />
                      <span className="sr-only"> {labels.opensNewTab}</span>
                    </a>
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
