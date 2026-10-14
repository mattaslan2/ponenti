import { cn } from "@/lib/utils";

/**
 * A small monthly line with no axes: the shape of a series beside the figure
 * that carries its size. Drawn on the server as SVG in the chart accent, a 2 px
 * line scaled to the series' own range (a sparkline shows movement, the numeral
 * next to it shows magnitude), the last month marked. Inside a data-reveal block
 * the line draws itself when the block comes into view. `label` is the text
 * alternative: what the line shows, with its first and last value.
 */
export function Sparkline({ values, label, className }: { values: number[]; label: string; className?: string }) {
  const width = 240;
  const height = 48;
  const inset = 5;
  if (values.length < 2 || !values.some((v) => v > 0)) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || max || 1;
  const x = (i: number) => inset + (i / (values.length - 1)) * (width - 2 * inset);
  const y = (v: number) => height - inset - ((v - min) / span) * (height - 2 * inset);
  const line = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const lastX = x(values.length - 1);
  const lastY = y(values[values.length - 1]);
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMinYMid meet"
      className={cn("block h-12 w-full max-w-[15rem] overflow-visible", className)}
    >
      <title>{label}</title>
      {/* pathLength 1 lets the draw-on-reveal transition in globals.css run from a dash offset of 1 to 0. */}
      <path
        className="spark-line"
        pathLength={1}
        d={line}
        fill="none"
        stroke="var(--color-chart-accent)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <g className="spark-dot">
        <circle cx={lastX} cy={lastY} r={5} fill="var(--color-ivory)" />
        <circle cx={lastX} cy={lastY} r={3} fill="var(--color-chart-accent)" />
      </g>
    </svg>
  );
}
