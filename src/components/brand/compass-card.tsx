import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * The compass card: the site's one illustration. An engraved wind rose in
 * hairlines with the eight Mediterranean winds named around it. The west
 * point, ponente, is the only solid shape and the only brass one.
 *
 * Turkish pages carry the sailors' Turkish names (poyraz, lodos, karayel ...);
 * English pages the Italian ones the name comes from. West reads PONENTE in both.
 */
const WINDS: Record<Locale, string[]> = {
  // Clockwise from north.
  en: ["TRAMONTANA", "GRECO", "LEVANTE", "SCIROCCO", "OSTRO", "LIBECCIO", "PONENTE", "MAESTRO"],
  tr: ["YILDIZ", "POYRAZ", "GÜNDOĞUSU", "KEŞİŞLEME", "KIBLE", "LODOS", "PONENTE", "KARAYEL"],
};

const C = 320;
const point = (r: number, deg: number): [number, number] => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
};
const xy = (r: number, deg: number) => point(r, deg).map((n) => n.toFixed(2)).join(" ");

const R = { outer: 304, tickOut: 292, tickIn: 280, band: 236, inner: 228, cardinal: 222, ordinal: 132, waist: 30, label: 258 };

/** A star point: tip, the two inner vertices it shares with its neighbors, the center. */
const kite = (tipR: number, deg: number) => `M${xy(tipR, deg)} L${xy(R.waist, deg + 22.5)} L${C} ${C} L${xy(R.waist, deg - 22.5)}Z`;
/** The clockwise half of a point, shaded as on an engraved card. */
const half = (tipR: number, deg: number) => `M${xy(tipR, deg)} L${xy(R.waist, deg + 22.5)} L${C} ${C}Z`;
/** The axis that splits a point in two. */
const axis = (tipR: number, deg: number) => `M${C} ${C} L${xy(tipR, deg)}`;

export function CompassCard({
  locale,
  tone = "light",
  rays = false,
  className,
  title,
}: {
  locale: Locale;
  tone?: "light" | "dark";
  /** Faint rhumb lines running out past the card, as on a portolan chart. */
  rays?: boolean;
  className?: string;
  title?: string;
}) {
  const dark = tone === "dark";
  const ink = dark ? "var(--color-ivory)" : "var(--color-navy)";
  const ground = dark ? "var(--color-navy)" : "var(--color-ivory)";
  const label = dark ? "var(--color-ivory-soft)" : "var(--color-mist-soft)";
  const west = dark ? "var(--color-brass-light)" : "var(--color-brass-deep)";
  const id = `cc-${tone}${rays ? "-r" : ""}`;
  const circumference = (r: number) => 2 * Math.PI * r;

  return (
    <svg
      viewBox="0 0 640 640"
      fill="none"
      className={cn("overflow-visible", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {rays && (
        <>
          <defs>
            <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={C} cy={C} r={1150}>
              <stop offset="0.26" stopColor={ink} stopOpacity={dark ? 0.14 : 0.1} />
              <stop offset="1" stopColor={ink} stopOpacity="0" />
            </radialGradient>
          </defs>
          <g stroke={`url(#${id})`} strokeWidth={1}>
            {Array.from({ length: 16 }, (_, i) => i * 22.5)
              // West is left out: a level line through the text column reads as a stray rule.
              .filter((deg) => deg !== 270)
              .map((deg) => {
                const [x1, y1] = point(R.outer, deg);
                const [x2, y2] = point(1150, deg);
                return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} vectorEffect="non-scaling-stroke" />;
              })}
          </g>
        </>
      )}

      {/* Rhumb lines inside the card: 8 principal winds, 8 half winds, 16 quarter winds */}
      <g stroke={ink} strokeWidth={1}>
        {Array.from({ length: 32 }, (_, i) => i * 11.25).map((deg, i) => {
          const [x1, y1] = point(R.waist + 6, deg);
          const [x2, y2] = point(R.inner, deg);
          const opacity = i % 4 === 0 ? 0.26 : i % 2 === 0 ? 0.16 : 0.08;
          return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} opacity={opacity} vectorEffect="non-scaling-stroke" />;
        })}
      </g>

      {/* Rings and the degree scale (two dashed circles: 128 fine ticks, 32 longer ones) */}
      <circle cx={C} cy={C} r={R.outer} stroke="var(--color-brass)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      <circle
        cx={C}
        cy={C}
        r={(R.tickOut + R.tickIn) / 2 + 2}
        stroke={ink}
        strokeWidth={R.tickOut - R.tickIn - 4}
        strokeDasharray={`0.9 ${(circumference((R.tickOut + R.tickIn) / 2 + 2) / 128 - 0.9).toFixed(3)}`}
        strokeDashoffset={0.45}
        opacity={0.4}
      />
      <circle
        cx={C}
        cy={C}
        r={(R.tickOut + R.tickIn) / 2}
        stroke={ink}
        strokeWidth={R.tickOut - R.tickIn}
        strokeDasharray={`1.2 ${(circumference((R.tickOut + R.tickIn) / 2) / 32 - 1.2).toFixed(3)}`}
        strokeDashoffset={0.6}
        opacity={0.7}
      />
      <circle cx={C} cy={C} r={R.tickIn} stroke={ink} strokeWidth={1} opacity={0.35} vectorEffect="non-scaling-stroke" />
      <circle cx={C} cy={C} r={R.band} stroke={ink} strokeWidth={1} opacity={0.35} vectorEffect="non-scaling-stroke" />
      <circle cx={C} cy={C} r={R.inner} stroke={ink} strokeWidth={1} opacity={0.16} vectorEffect="non-scaling-stroke" />

      {/* Wind names in the band between the two rings */}
      <g fontFamily="var(--font-sans)" fontSize="10.5" fontWeight="500" letterSpacing="2.6" textAnchor="middle" dominantBaseline="central">
        {WINDS[locale].map((name, i) => {
          const deg = i * 45;
          const flip = deg > 90 && deg < 270;
          const isWest = deg === 270;
          return (
            <text
              key={name}
              x={C}
              y={C - R.label}
              transform={`rotate(${deg} ${C} ${C})${flip ? ` rotate(180 ${C} ${C - R.label})` : ""}`}
              fill={isWest ? west : label}
              fontWeight={isWest ? 600 : 500}
            >
              {name}
            </text>
          );
        })}
      </g>

      {/* The star: four ordinal points under four cardinal points, each split along its axis */}
      <g strokeWidth={1} strokeLinejoin="round">
        {[45, 135, 225, 315].map((deg) => (
          <g key={deg}>
            <path d={kite(R.ordinal, deg)} fill={ground} />
            <path d={half(R.ordinal, deg)} fill={ink} fillOpacity={0.1} />
            <path d={`${kite(R.ordinal, deg)} ${axis(R.ordinal, deg)}`} stroke={ink} strokeOpacity={0.45} vectorEffect="non-scaling-stroke" />
          </g>
        ))}
        {[0, 90, 180].map((deg) => (
          <g key={deg}>
            <path d={kite(R.cardinal, deg)} fill={ground} />
            <path d={half(R.cardinal, deg)} fill={ink} fillOpacity={dark ? 0.22 : 0.16} />
            <path d={`${kite(R.cardinal, deg)} ${axis(R.cardinal, deg)}`} stroke={ink} strokeOpacity={0.85} vectorEffect="non-scaling-stroke" />
          </g>
        ))}
        {/* West: ponente */}
        <path d={kite(R.cardinal, 270)} fill="var(--color-brass-light)" />
        <path d={half(R.cardinal, 270)} fill="var(--color-brass)" />
        <path d={kite(R.cardinal, 270)} stroke="var(--color-brass)" vectorEffect="non-scaling-stroke" />
      </g>
      <path d={`M${xy(R.outer + 14, 270)} L${xy(R.outer + 1, 268.6)} L${xy(R.outer + 1, 271.4)}Z`} fill="var(--color-brass)" />

      <circle cx={C} cy={C} r={6.5} fill={ground} stroke={ink} strokeWidth={1} vectorEffect="non-scaling-stroke" />
      <circle cx={C} cy={C} r={1.8} fill={ink} />
    </svg>
  );
}
