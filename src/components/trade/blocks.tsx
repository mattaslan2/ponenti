import { ArrowDown, ArrowDownRight, ArrowUp, ArrowUpRight, Minus } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { pct, usdCompact } from "@/lib/trade/format";
import type { PartnerStat, PortStat, ProductRow } from "@/lib/trade/analysis";
import type { ProductHref } from "@/lib/trade/links";

/*
 * DATA UI RULES (trade pages, and the portal later)
 * - Figures are set in the sans, semibold: the serif is the site's voice, the sans is its data.
 * - Large standalone values use proportional figures; columns of numbers use tabular ones.
 * - Text is ink. Only an unfavorable change turns oxblood, and it always carries a sign and an arrow.
 * - One accent series, gray for context, oxblood for declines. Thin bars, square at the baseline.
 */

/* Stat tile: label, value, optional delta (signed, with an arrow, never color alone) */

export type Delta = {
  text: string;
  note?: string;
  direction: "up" | "down" | "flat";
  good?: boolean | null;
};

/**
 * A row of stat tiles: one ruled line on top, hairlines between the tiles.
 * Two across from sm, four only from xl: Turkish values ("$17 milyar") need the width.
 */
export function StatRow({ children }: { children: ReactNode }) {
  return <div className="grid border-t border-navy sm:grid-cols-2 xl:grid-cols-4 [&>*]:border-b [&>*]:border-line sm:[&>*:nth-child(even)]:border-l sm:[&>*:nth-child(even)]:pl-8 xl:[&>*]:border-b-0 xl:[&>*+*]:border-l xl:[&>*+*]:pl-8">{children}</div>;
}

export function StatTile({ label, value, delta, note }: { label: string; value: string; delta?: Delta | null; note?: ReactNode }) {
  const Icon = delta?.direction === "up" ? ArrowUpRight : delta?.direction === "down" ? ArrowDownRight : Minus;
  const tone = delta?.good === false ? "text-oxblood" : delta?.good === true ? "text-navy" : "text-mist";
  return (
    <dl className="flex flex-col py-7 pr-6">
      <dt className="text-caption text-mist-soft">{label}</dt>
      <dd className="mt-4 font-sans text-[2.25rem] leading-none font-semibold tracking-[-0.025em] text-navy">{value}</dd>
      {delta && (
        <dd className={cn("figures mt-4 flex flex-wrap items-center gap-x-1.5 text-small", tone)}>
          <Icon aria-hidden="true" className="size-4 shrink-0" />
          <span className="font-medium">{delta.text}</span>
          {delta.note && <span className="text-mist-soft">{delta.note}</span>}
        </dd>
      )}
      {note && <dd className="figures mt-2 text-caption text-mist-soft">{note}</dd>}
    </dl>
  );
}

export function deltaOf(change: number | null, locale: string, note: string, { upIsGood = true, points = false } = {}): Delta | null {
  if (change === null || !Number.isFinite(change)) return null;
  const direction = Math.abs(change) < 0.0005 ? "flat" : change > 0 ? "up" : "down";
  const text = points
    ? `${change > 0 ? "+" : change < 0 ? "−" : ""}${new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(Math.abs(change * 100))} ${locale === "tr" ? "puan" : "pts"}`
    : pct(change, locale, { signed: true });
  return {
    text,
    note,
    direction,
    good: direction === "flat" ? null : change > 0 === upIsGood,
  };
}

/* Shared bits */

function Bar({ ratio, tone }: { ratio: number; tone: "accent" | "muted" | "negative" }) {
  return (
    <span aria-hidden="true" className="block h-2 w-full">
      <span
        className={cn(
          "block h-full rounded-r-[4px]",
          tone === "accent" && "bg-chart-accent",
          tone === "muted" && "bg-chart-muted",
          tone === "negative" && "bg-chart-negative",
        )}
        style={{ width: `${Math.max(1.5, Math.min(100, ratio * 100))}%` }}
      />
    </span>
  );
}

/** A percentage change: ink when up, oxblood when down, always with its sign and an arrow. */
function Growth({ value, locale }: { value: number | null; locale: string }) {
  if (value === null) return <span className="text-mist-soft">–</span>;
  const Icon = value > 0 ? ArrowUp : value < 0 ? ArrowDown : null;
  return (
    <span className={cn("inline-flex items-center gap-1", value < 0 ? "text-oxblood" : value > 0 ? "text-navy" : "text-mist")}>
      {Icon && <Icon aria-hidden="true" className="size-3.5 shrink-0" />}
      {pct(value, locale, { signed: true })}
    </span>
  );
}

export function SectionTitle({ title, intro, id, as: Tag = "h3" }: { title: string; intro?: string; id?: string; as?: "h2" | "h3" }) {
  return (
    <div className="max-w-3xl">
      <Tag id={id} className="text-display-sm">
        {title}
      </Tag>
      {intro && <p className="mt-3 text-small text-mist">{intro}</p>}
    </div>
  );
}

const headerClass = "mt-8 hidden border-b border-navy pb-3 text-caption text-mist-soft sm:grid";

/* Supplier ranking: emphasis on the selected country, everyone else in gray */

const SUPPLIER_COLS = "sm:grid-cols-[2rem_minmax(7rem,12rem)_minmax(0,1fr)_7rem_4.5rem_6.5rem_5.5rem]";

/**
 * One grid per row. Phone: rank+name | value, then the bar, then share · change · duty.
 * From sm up the same cells line up as seven columns under SupplierHeader.
 */
export function SupplierList({
  rows,
  selected,
  locale,
  names,
  labels,
}: {
  rows: PartnerStat[];
  selected: string;
  locale: string;
  names: Record<string, string>;
  labels: { value: string; share: string; growth: string; duty: string };
}) {
  const maxShare = Math.max(...rows.map((r) => r.share), 0.0001);
  return (
    <ol className="figures mt-8 border-t border-navy sm:mt-0 sm:border-t-0">
      {rows.map((r) => {
        const isSel = r.country.code === selected;
        return (
          <li
            key={r.country.code}
            className={cn(
              "grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-2 gap-y-1.5 border-b border-line py-4 sm:items-center sm:gap-x-3",
              SUPPLIER_COLS,
              isSel && "bg-sand",
            )}
          >
            <span className="text-small text-mist-soft sm:pl-2">{r.rank}.</span>
            <span className={cn("truncate", isSel ? "font-semibold text-navy" : "text-navy")}>{names[r.country.code]}</span>
            <span className="col-span-3 row-start-2 sm:col-span-1 sm:col-start-3 sm:row-start-1">
              <Bar ratio={r.share / maxShare} tone={isSel ? "accent" : "muted"} />
            </span>
            <span className={cn("col-start-3 row-start-1 text-right sm:col-start-4", isSel && "font-semibold")}>
              <span className="sr-only">{labels.value}: </span>
              {usdCompact(r.value, locale)}
            </span>
            <span className="col-span-3 row-start-3 flex flex-wrap gap-x-4 text-caption text-mist sm:contents sm:text-small">
              <span className="sm:col-start-5 sm:row-start-1 sm:text-right">
                <span className="sm:sr-only">{labels.share} </span>
                {pct(r.share, locale)}
              </span>
              <span className="whitespace-nowrap sm:col-start-6 sm:row-start-1 sm:justify-self-end">
                <span className="sr-only">{labels.growth}: </span>
                <Growth value={r.growth} locale={locale} />
              </span>
              <span className="sm:col-start-7 sm:row-start-1 sm:pr-2 sm:text-right sm:text-navy">
                <span className="sm:sr-only">{labels.duty} </span>
                {r.dutyRate === null ? "–" : pct(r.dutyRate, locale)}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function SupplierHeader({
  labels,
}: {
  labels: {
    country: string;
    value: string;
    share: string;
    growth: string;
    duty: string;
  };
}) {
  return (
    <div aria-hidden="true" className={cn(headerClass, "gap-x-3", SUPPLIER_COLS)}>
      <span />
      <span>{labels.country}</span>
      <span />
      <span className="text-right">{labels.value}</span>
      <span className="text-right">{labels.share}</span>
      <span className="text-right">{labels.growth}</span>
      <span className="pr-2 text-right">{labels.duty}</span>
    </div>
  );
}

/* Product list (top products, sub-products) */

export function ProductList({
  rows,
  locale,
  hrefFor,
  labels,
}: {
  rows: ProductRow[];
  locale: string;
  hrefFor: (code: string) => ProductHref;
  labels: { value: string; growth: string; share: string; code: string };
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ol className="figures mt-8 border-t border-navy sm:mt-0 sm:border-t-0">
      {rows.map((r) => (
        <li key={r.code} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 border-b border-line py-4 sm:grid-cols-[minmax(0,1fr)_7rem_6rem_6rem] sm:items-center">
          <div className="min-w-0">
            <Link
              href={hrefFor(r.code)}
              className="group line-clamp-2 text-small leading-snug text-navy"
              lang={locale === "tr" && r.code.length > 2 ? "en" : undefined}
            >
              <span className="mr-2 font-medium text-mist-soft" aria-label={`${labels.code} ${r.code}`}>
                {r.code}
              </span>
              <span className="underline decoration-transparent underline-offset-[0.26em] transition-[text-decoration-color] duration-200 group-hover:decoration-brass group-focus-visible:decoration-brass">
                {r.label}
              </span>
            </Link>
            <div className="mt-2.5 sm:pr-8">
              <Bar ratio={r.value / max} tone="accent" />
            </div>
          </div>
          <span className="text-right font-medium text-navy">
            <span className="sr-only">{labels.value}: </span>
            {usdCompact(r.value, locale)}
          </span>
          <span className="text-caption text-mist sm:justify-self-end sm:text-small">
            <span className="sr-only">{labels.growth}: </span>
            <Growth value={r.growth} locale={locale} />
          </span>
          <span className="text-right text-caption text-mist sm:text-small">
            <span className="sm:sr-only">{labels.share} </span>
            {r.share === null ? "–" : pct(r.share, locale)}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function ProductHeader({ labels }: { labels: { product: string; value: string; growth: string; share: string } }) {
  return (
    <div aria-hidden="true" className={cn(headerClass, "grid-cols-[minmax(0,1fr)_7rem_6rem_6rem] gap-x-4")}>
      <span>{labels.product}</span>
      <span className="text-right">{labels.value}</span>
      <span className="text-right">{labels.growth}</span>
      <span className="text-right">{labels.share}</span>
    </div>
  );
}

/* Gainers and decliners: dollar change with a sign and an arrow; ink up, oxblood down */

export function ChangeList({
  rows,
  locale,
  hrefFor,
  negative = false,
}: {
  rows: ProductRow[];
  locale: string;
  hrefFor: (code: string) => ProductHref;
  negative?: boolean;
}) {
  const max = Math.max(...rows.map((r) => Math.abs(r.change)), 1);
  const Icon = negative ? ArrowDown : ArrowUp;
  return (
    <ol className="figures mt-8 space-y-5 border-t border-navy pt-6">
      {rows.map((r) => (
        <li key={r.code}>
          <div className="flex items-baseline justify-between gap-4">
            <Link href={hrefFor(r.code)} className="group line-clamp-1 text-small text-navy" lang={locale === "tr" ? "en" : undefined}>
              <span className="mr-2 font-medium text-mist-soft">{r.code}</span>
              <span className="underline decoration-transparent underline-offset-[0.26em] transition-[text-decoration-color] duration-200 group-hover:decoration-brass group-focus-visible:decoration-brass">
                {r.label}
              </span>
            </Link>
            <span className={cn("inline-flex shrink-0 items-center gap-1 text-small font-medium", negative ? "text-oxblood" : "text-navy")}>
              <Icon aria-hidden="true" className="size-3.5 shrink-0 self-center" />
              {negative ? "−" : "+"}
              {usdCompact(Math.abs(r.change), locale)}
            </span>
          </div>
          <div className="mt-2.5">
            <Bar ratio={Math.abs(r.change) / max} tone={negative ? "negative" : "accent"} />
          </div>
        </li>
      ))}
    </ol>
  );
}

/* Ports of entry */

export function portName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b([a-z])/g, (c) => c.toUpperCase())
    .replace(/, ([A-Za-z]{2})$/, (_, s: string) => `, ${s.toUpperCase()}`)
    .replace(/\bJfk\b/, "JFK");
}

export function PortList({ rows, locale, labels }: { rows: PortStat[]; locale: string; labels: { share: string; vessel: string } }) {
  const max = Math.max(...rows.map((r) => r.share), 0.0001);
  return (
    <ol className="figures mt-8 space-y-5 border-t border-navy pt-6">
      {rows.map((r) => (
        <li key={r.port}>
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-small text-navy">{portName(r.name)}</span>
            <span className="shrink-0 text-small font-medium text-navy">{usdCompact(r.value, locale)}</span>
          </div>
          <div className="mt-2.5">
            <Bar ratio={r.share / max} tone="accent" />
          </div>
          <p className="mt-2 text-caption text-mist-soft">
            {labels.share} {pct(r.share, locale)}
            {r.vesselShare !== null && ` · ${labels.vessel} ${pct(r.vesselShare, locale, { digits: 0 })}`}
          </p>
        </li>
      ))}
    </ol>
  );
}
