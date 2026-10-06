import { ChartScrubber } from "./chart-scrubber";
import { monthLabel, pct, usdAxis, usdCompact } from "@/lib/trade/format";
import { parseYm } from "@/lib/trade/periods";

/**
 * Single-series monthly trend: a 2px line over a 10% wash, recessive hairline
 * grid, y axis from zero, the last value labelled. Drawn as SVG on the server
 * (no chart library); text is HTML so it stays crisp at any width.
 */
type Point = { month: string; value: number | null };

function niceStep(raw: number) {
  const pow = 10 ** Math.floor(Math.log10(raw));
  const f = raw / pow;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * pow;
}

function scale(max: number, ticks = 4) {
  if (max <= 0) return { top: 1, values: [0, 1] };
  const step = niceStep(max / ticks);
  const top = Math.ceil(max / step) * step;
  return {
    top,
    values: Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step),
  };
}

export function TrendChart({
  points,
  locale,
  kind = "usd",
  title,
  subtitle,
  labels,
  muted = false,
}: {
  points: Point[];
  locale: string;
  kind?: "usd" | "pct";
  title: string;
  subtitle?: string;
  labels: {
    table: string;
    month: string;
    value: string;
    scrub: string;
    noData: string;
  };
  /** Context series (gray) instead of the accent. */
  muted?: boolean;
}) {
  const fmt = (v: number) => (kind === "usd" ? usdCompact(v, locale) : pct(v, locale));
  const fmtAxis = (v: number) => (kind === "usd" ? usdAxis(v, locale) : pct(v, locale, { digits: 0 }));
  const values = points.map((p) => p.value ?? 0);
  const hasData = values.some((v) => v > 0);
  const { top, values: ticks } = scale(Math.max(...values, 0));
  const n = points.length;
  const x = (i: number) => (n > 1 ? (i / (n - 1)) * 1000 : 500);
  const y = (v: number) => 100 - (v / top) * 100;
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.value ?? 0).toFixed(2)}`).join(" ");
  const area = `${line} L1000 100 L0 100 Z`;
  const months = points.map((p) => parseYm(p.month));
  const color = muted ? "var(--color-chart-muted)" : "var(--color-chart-accent)";
  const lastIdx = n - 1;
  const xTicks = months
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => m.m === 1 || m.m === 7)
    .map(({ m, i }) => ({
      i,
      label: new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", {
        month: "short",
        year: "2-digit",
        timeZone: "UTC",
      }).format(Date.UTC(m.y, m.m - 1, 1)),
      major: m.m === 1,
    }));

  return (
    <figure className="rounded-sm border border-line bg-paper p-4 sm:p-6">
      <figcaption>
        <span className="block font-display text-[1.375rem] leading-snug font-semibold text-navy">{title}</span>
        {subtitle && <span className="mt-1 block text-[0.875rem] text-mist">{subtitle}</span>}
      </figcaption>

      {hasData ? (
        <div className="relative mt-8 h-52 sm:h-60">
          {/* y axis labels */}
          <div aria-hidden="true" className="absolute inset-y-0 left-0 w-16 pb-7">
            <div className="relative h-full">
              {ticks.map((t) => (
                <span
                  key={t}
                  className="absolute right-2 -translate-y-1/2 text-[0.75rem] whitespace-nowrap text-mist [font-variant-numeric:tabular-nums]"
                  style={{ top: `${y(t)}%` }}
                >
                  {fmtAxis(t)}
                </span>
              ))}
            </div>
          </div>
          {/* plot */}
          <div className="absolute inset-y-0 right-3 left-16 pb-7">
            <div className="relative h-full">
              <svg aria-hidden="true" viewBox="0 0 1000 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
                {ticks.map((t) => (
                  <line
                    key={t}
                    x1="0"
                    x2="1000"
                    y1={y(t)}
                    y2={y(t)}
                    stroke={t === 0 ? "var(--color-chart-axis)" : "var(--color-chart-grid)"}
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                <path d={area} fill={color} fillOpacity="0.1" />
                <path
                  d={line}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              {/* end marker and direct label */}
              <span
                aria-hidden="true"
                className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-paper"
                style={{
                  left: `${x(lastIdx) / 10}%`,
                  top: `${y(values[lastIdx])}%`,
                  background: color,
                }}
              />
              <span
                aria-hidden="true"
                className="absolute -translate-x-full -translate-y-[150%] rounded-xs bg-paper/90 px-1 text-[0.8125rem] font-semibold whitespace-nowrap text-navy [font-variant-numeric:tabular-nums]"
                style={{
                  left: `${x(lastIdx) / 10}%`,
                  top: `${y(values[lastIdx])}%`,
                }}
              >
                {fmt(values[lastIdx])}
              </span>
              <ChartScrubber
                xs={points.map((_, i) => x(i) / 10)}
                ys={values.map((v) => y(v))}
                months={months.map((m) => monthLabel(m, locale, "long"))}
                values={values.map(fmt)}
                label={`${title}. ${labels.scrub}`}
              />
            </div>
          </div>
          {/* x axis labels */}
          <div aria-hidden="true" className="absolute right-3 bottom-0 left-16 h-6">
            {xTicks.map((t) => (
              <span
                key={t.i}
                className={`absolute top-1 -translate-x-1/2 text-[0.75rem] whitespace-nowrap text-mist ${t.major ? "" : "max-sm:hidden"}`}
                style={{ left: `${x(t.i) / 10}%` }}
              >
                {t.label}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-6 text-[0.9375rem] text-mist">{labels.noData}</p>
      )}

      {hasData && (
        <details className="group mt-4">
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-[0.875rem] text-cobalt underline decoration-cobalt/40 underline-offset-4">
            {labels.table}
          </summary>
          <div
            className="mt-2 max-h-80 overflow-y-auto rounded-xs border border-line"
            tabIndex={0}
            role="region"
            aria-label={`${title}: ${labels.table}`}
          >
            <table className="w-full text-[0.875rem]">
              <caption className="sr-only">{title}</caption>
              <thead className="sticky top-0 bg-sand text-left">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">
                    {labels.month}
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    {labels.value}
                  </th>
                </tr>
              </thead>
              <tbody className="[font-variant-numeric:tabular-nums]">
                {[...points].reverse().map((p) => (
                  <tr key={p.month} className="border-t border-line">
                    <td className="px-3 py-1.5">{monthLabel(parseYm(p.month), locale, "long")}</td>
                    <td className="px-3 py-1.5 text-right">{p.value === null ? "–" : fmt(p.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </figure>
  );
}
