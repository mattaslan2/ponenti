"use client";

import { useState } from "react";

/**
 * Hover and keyboard layer for a trend chart: a crosshair snaps to the nearest
 * month, a tooltip shows its value. It is a slider for assistive tech (arrow
 * keys move between months). Every value is also in the table under the chart.
 */
export function ChartScrubber({
  xs,
  ys,
  months,
  values,
  label,
}: {
  /** Horizontal and vertical positions in percent of the plot box. */
  xs: number[];
  ys: number[];
  months: string[];
  values: string[];
  label: string;
}) {
  const [index, setIndex] = useState<number | null>(null);
  const last = xs.length - 1;

  const nearest = (clientX: number, rect: DOMRect) => {
    const pct = ((clientX - rect.left) / rect.width) * 100;
    let best = 0;
    for (let i = 1; i < xs.length; i++) if (Math.abs(xs[i] - pct) < Math.abs(xs[best] - pct)) best = i;
    return best;
  };

  const shown = index ?? last;
  const active = index !== null;
  const tooltipLeft = Math.min(Math.max(xs[shown], 14), 86);

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={last}
      aria-valuenow={shown}
      aria-valuetext={`${months[shown]}: ${values[shown]}`}
      className="absolute inset-0 cursor-crosshair touch-pan-y rounded-xs outline-offset-4"
      onPointerMove={(e) => setIndex(nearest(e.clientX, e.currentTarget.getBoundingClientRect()))}
      onPointerDown={(e) => setIndex(nearest(e.clientX, e.currentTarget.getBoundingClientRect()))}
      onPointerLeave={() => setIndex(null)}
      onFocus={() => setIndex(last)}
      onBlur={() => setIndex(null)}
      onKeyDown={(e) => {
        const step = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 0;
        if (step) {
          e.preventDefault();
          setIndex((i) => Math.min(last, Math.max(0, (i ?? last) + step)));
        } else if (e.key === "Home" || e.key === "End") {
          e.preventDefault();
          setIndex(e.key === "Home" ? 0 : last);
        }
      }}
    >
      {active && (
        <>
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-px bg-navy/40" style={{ left: `${xs[shown]}%` }} />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-chart-accent ring-2 ring-paper"
            style={{ left: `${xs[shown]}%`, top: `${ys[shown]}%` }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-xs border border-line bg-paper px-2.5 py-1.5 text-left whitespace-nowrap shadow-quiet"
            style={{ left: `${tooltipLeft}%` }}
          >
            <span className="block text-[0.9375rem] font-semibold text-navy [font-variant-numeric:tabular-nums]">{values[shown]}</span>
            <span className="block text-[0.75rem] text-mist">{months[shown]}</span>
          </span>
        </>
      )}
    </div>
  );
}
