import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { pct, usdCompact } from "@/lib/trade/format";
import type { PartnerStat, PortStat, ProductRow } from "@/lib/trade/analysis";
import type { ProductHref } from "@/lib/trade/links";

/* Stat tile: label, value, optional delta (signed, with an arrow, never color alone) */

export type Delta = {
  text: string;
  note?: string;
  direction: "up" | "down" | "flat";
  good?: boolean | null;
};

export function StatTile({ label, value, delta, note }: { label: string; value: string; delta?: Delta | null; note?: ReactNode }) {
  const Icon = delta?.direction === "up" ? ArrowUpRight : delta?.direction === "down" ? ArrowDownRight : Minus;
  const tone = delta?.good === true ? "text-risk-low" : delta?.good === false ? "text-risk-high" : "text-mist";
  return (
    <dl className="flex flex-col rounded-sm border border-line bg-paper p-5">
      <dt className="text-[0.875rem] leading-snug text-mist">{label}</dt>
      <dd className="mt-3 font-display text-[2.375rem] leading-none font-semibold text-navy [font-variant-numeric:lining-nums]">{value}</dd>
      {delta && (
        <dd className={cn("mt-3 flex flex-wrap items-center gap-x-1.5 text-[0.875rem]", tone)}>
          <Icon aria-hidden="true" className="size-4 shrink-0" />
          <span className="font-medium">{delta.text}</span>
          {delta.note && <span className="text-mist">{delta.note}</span>}
        </dd>
      )}
      {note && <dd className="mt-2 text-[0.8125rem] leading-snug text-mist">{note}</dd>}
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
    <span aria-hidden="true" className="block h-2.5 w-full">
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

function Growth({ value, locale }: { value: number | null; locale: string }) {
  if (value === null) return <span className="text-mist">–</span>;
  return (
    <span className={value > 0 ? "text-risk-low" : value < 0 ? "text-risk-high" : "text-mist"}>
      {value > 0 ? "▲" : value < 0 ? "▼" : ""} {pct(value, locale, { signed: true })}
    </span>
  );
}

export function SectionTitle({ title, intro, id, as: Tag = "h3" }: { title: string; intro?: string; id?: string; as?: "h2" | "h3" }) {
  return (
    <div className="max-w-3xl">
      <Tag id={id} className="text-display-sm">
        {title}
      </Tag>
      {intro && <p className="mt-2 text-[0.9375rem] text-mist">{intro}</p>}
    </div>
  );
}

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
    <ol className="mt-3 divide-y divide-line border-y border-line">
      {rows.map((r) => {
        const isSel = r.country.code === selected;
        return (
          <li
            key={r.country.code}
            className={cn(
              "grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-2 gap-y-1 py-3 sm:items-center sm:gap-x-3",
              SUPPLIER_COLS,
              isSel && "bg-sand/60",
            )}
          >
            <span className="text-[0.875rem] text-mist sm:pl-1 [font-variant-numeric:tabular-nums]">{r.rank}.</span>
            <span className={cn("truncate", isSel ? "font-semibold text-navy" : "text-graphite")}>{names[r.country.code]}</span>
            <span className="col-span-3 row-start-2 sm:col-span-1 sm:col-start-3 sm:row-start-1">
              <Bar ratio={r.share / maxShare} tone={isSel ? "accent" : "muted"} />
            </span>
            <span className="col-start-3 row-start-1 text-right sm:col-start-4 [font-variant-numeric:tabular-nums]">
              <span className="sr-only">{labels.value}: </span>
              {usdCompact(r.value, locale)}
            </span>
            <span className="col-span-3 row-start-3 flex flex-wrap gap-x-3 text-[0.8125rem] text-mist sm:contents sm:text-[0.9375rem]">
              <span className="sm:col-start-5 sm:row-start-1 sm:text-right [font-variant-numeric:tabular-nums]">
                <span className="sm:sr-only">{labels.share} </span>
                {pct(r.share, locale)}
              </span>
              <span className="whitespace-nowrap sm:col-start-6 sm:row-start-1 sm:text-right [font-variant-numeric:tabular-nums]">
                <span className="sr-only">{labels.growth}: </span>
                <Growth value={r.growth} locale={locale} />
              </span>
              <span className="sm:col-start-7 sm:row-start-1 sm:pr-1 sm:text-right sm:text-graphite [font-variant-numeric:tabular-nums]">
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
    <div aria-hidden="true" className={cn("mt-6 hidden gap-x-3 text-[0.75rem] tracking-wide text-mist uppercase sm:grid", SUPPLIER_COLS)}>
      <span />
      <span>{labels.country}</span>
      <span />
      <span className="text-right">{labels.value}</span>
      <span className="text-right">{labels.share}</span>
      <span className="text-right">{labels.growth}</span>
      <span className="pr-1 text-right">{labels.duty}</span>
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
    <ol className="mt-6 divide-y divide-line border-y border-line">
      {rows.map((r) => (
        <li key={r.code} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 py-3.5 sm:grid-cols-[minmax(0,1fr)_7rem_6rem_6rem] sm:items-center">
          <div className="min-w-0">
            <Link
              href={hrefFor(r.code)}
              className="link line-clamp-2 text-[0.9375rem] leading-snug"
              lang={locale === "tr" && r.code.length > 2 ? "en" : undefined}
            >
              <span className="mr-1.5 text-mist no-underline [font-variant-numeric:tabular-nums]" aria-label={`${labels.code} ${r.code}`}>
                {r.code}
              </span>
              {r.label}
            </Link>
            <div className="mt-1.5 sm:pr-6">
              <Bar ratio={r.value / max} tone="accent" />
            </div>
          </div>
          <span className="text-right [font-variant-numeric:tabular-nums]">
            <span className="sr-only">{labels.value}: </span>
            {usdCompact(r.value, locale)}
          </span>
          <span className="text-[0.8125rem] text-mist sm:text-right sm:text-[0.9375rem] [font-variant-numeric:tabular-nums]">
            <span className="sr-only">{labels.growth}: </span>
            <Growth value={r.growth} locale={locale} />
          </span>
          <span className="text-right text-[0.8125rem] text-mist sm:text-[0.9375rem] [font-variant-numeric:tabular-nums]">
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
    <div
      aria-hidden="true"
      className="mt-6 hidden grid-cols-[minmax(0,1fr)_7rem_6rem_6rem] gap-x-4 text-[0.75rem] tracking-wide text-mist uppercase sm:grid"
    >
      <span>{labels.product}</span>
      <span className="text-right">{labels.value}</span>
      <span className="text-right">{labels.growth}</span>
      <span className="text-right">{labels.share}</span>
    </div>
  );
}

/* Gainers and decliners: dollar change, cobalt up, red down, with a sign and an arrow */

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
  return (
    <ol className="mt-4 space-y-3.5">
      {rows.map((r) => (
        <li key={r.code}>
          <div className="flex items-baseline justify-between gap-3">
            <Link href={hrefFor(r.code)} className="link line-clamp-1 text-[0.9375rem]" lang={locale === "tr" ? "en" : undefined}>
              <span className="mr-1.5 text-mist [font-variant-numeric:tabular-nums]">{r.code}</span>
              {r.label}
            </Link>
            <span
              className={cn(
                "shrink-0 text-[0.9375rem] font-medium [font-variant-numeric:tabular-nums]",
                negative ? "text-risk-high" : "text-risk-low",
              )}
            >
              {negative ? "▼ −" : "▲ +"}
              {usdCompact(Math.abs(r.change), locale)}
            </span>
          </div>
          <div className="mt-1.5">
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
    <ol className="mt-6 space-y-4">
      {rows.map((r) => (
        <li key={r.port}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[0.9375rem] text-graphite">{portName(r.name)}</span>
            <span className="shrink-0 text-[0.9375rem] [font-variant-numeric:tabular-nums]">{usdCompact(r.value, locale)}</span>
          </div>
          <div className="mt-1.5">
            <Bar ratio={r.share / max} tone="accent" />
          </div>
          <p className="mt-1 text-[0.8125rem] text-mist [font-variant-numeric:tabular-nums]">
            {labels.share} {pct(r.share, locale)}
            {r.vesselShare !== null && ` · ${labels.vessel} ${pct(r.vesselShare, locale, { digits: 0 })}`}
          </p>
        </li>
      ))}
    </ol>
  );
}
