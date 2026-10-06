import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };

const NAVY = "#0e1a2b";
const IVORY = "#f6f1e7";
const BRASS = "#b08d57";
const BRASS_LIGHT = "#cdae7c";
const IVORY_DIM = "#c9c1b1";

/* The wind-rose mark, as in src/components/brand/logo.tsx. */
const rose = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><g stroke="${IVORY}" stroke-width="1"><circle cx="32" cy="32" r="20.5" opacity="0.5"/><path d="M32 32 46.5 17.5M32 32 46.5 46.5M32 32 17.5 46.5M32 32 17.5 17.5" opacity="0.35"/><path d="M32 8 34.5 29.5 32 32 29.5 29.5Z"/><path d="M56 32 34.5 34.5 32 32 34.5 29.5Z"/><path d="M32 56 29.5 34.5 32 32 34.5 34.5Z"/></g><path d="M2 32 29.5 28.4 32 32 29.5 35.6Z" fill="${BRASS}"/><circle cx="32" cy="32" r="1.8" fill="${IVORY}"/></svg>`;
const roseUri = `data:image/svg+xml;base64,${Buffer.from(rose).toString("base64")}`;

/* The compass card without its lettering (src/components/brand/compass-card.tsx), for the right edge of the card. */
function compassCard(): string {
  const C = 320;
  const pt = (r: number, deg: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return `${(C + r * Math.cos(a)).toFixed(2)} ${(C + r * Math.sin(a)).toFixed(2)}`;
  };
  const kite = (r: number, deg: number) => `M${pt(r, deg)} L${pt(30, deg + 22.5)} L${C} ${C} L${pt(30, deg - 22.5)}Z`;
  const half = (r: number, deg: number) => `M${pt(r, deg)} L${pt(30, deg + 22.5)} L${C} ${C}Z`;
  const rhumbs = Array.from({ length: 32 }, (_, i) => {
    const deg = i * 11.25;
    const opacity = i % 4 === 0 ? 0.3 : i % 2 === 0 ? 0.18 : 0.09;
    return `<path d="M${pt(36, deg)} L${pt(228, deg)}" stroke="${IVORY}" stroke-opacity="${opacity}"/>`;
  }).join("");
  const ticks = Array.from({ length: 64 }, (_, i) => {
    const deg = i * 5.625;
    return `<path d="M${pt(i % 2 === 0 ? 280 : 284, deg)} L${pt(292, deg)}" stroke="${IVORY}" stroke-opacity="${i % 2 === 0 ? 0.7 : 0.4}"/>`;
  }).join("");
  const points = (degs: number[], r: number, stroke: number, fill: number) =>
    degs.map((d) => `<path d="${kite(r, d)}" fill="${NAVY}"/><path d="${half(r, d)}" fill="${IVORY}" fill-opacity="${fill}"/><path d="${kite(r, d)} M${C} ${C} L${pt(r, d)}" stroke="${IVORY}" stroke-opacity="${stroke}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="none" stroke-width="1">${rhumbs}<circle cx="${C}" cy="${C}" r="304" stroke="${BRASS}"/>${ticks}<circle cx="${C}" cy="${C}" r="280" stroke="${IVORY}" stroke-opacity="0.35"/><circle cx="${C}" cy="${C}" r="236" stroke="${IVORY}" stroke-opacity="0.35"/><circle cx="${C}" cy="${C}" r="228" stroke="${IVORY}" stroke-opacity="0.16"/>${points([45, 135, 225, 315], 132, 0.45, 0.1)}${points([0, 90, 180], 222, 0.85, 0.22)}<path d="${kite(222, 270)}" fill="${BRASS_LIGHT}"/><path d="${half(222, 270)}" fill="${BRASS}"/><path d="M${pt(318, 270)} L${pt(305, 268.6)} L${pt(305, 271.4)}Z" fill="${BRASS}"/><circle cx="${C}" cy="${C}" r="6.5" fill="${NAVY}" stroke="${IVORY}"/><circle cx="${C}" cy="${C}" r="1.8" fill="${IVORY}"/></svg>`;
}
const compassUri = `data:image/svg+xml;base64,${Buffer.from(compassCard()).toString("base64")}`;

async function fonts() {
  const dir = join(process.cwd(), "assets/fonts");
  const [display, iLatin, iExt] = await Promise.all([
    readFile(join(dir, "cormorant-garamond-latin-tr-500.woff")),
    readFile(join(dir, "inter-latin-500-normal.woff")),
    readFile(join(dir, "inter-latin-ext-500-normal.woff")),
  ]);
  return [
    { name: "Cormorant", data: display, weight: 500 as const, style: "normal" as const },
    { name: "Inter", data: iLatin, weight: 500 as const, style: "normal" as const },
    { name: "Inter", data: iExt, weight: 500 as const, style: "normal" as const },
  ];
}

/** Brand share card: navy, the compass card at the right edge, a serif headline, the motto. */
export async function renderOg({ title, kicker, footer, locale }: { title: string; kicker: string; footer: string; locale: "tr" | "en" }) {
  // Satori's text-transform is not locale-aware (it would print "BILGI" for "Bilgi").
  const kickerUpper = kicker.toLocaleUpperCase(locale === "tr" ? "tr-TR" : "en-US");
  const long = title.length > 70;
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: NAVY,
          padding: "64px 72px",
          fontFamily: "Inter",
          color: IVORY,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={compassUri} width={760} height={760} alt="" style={{ position: "absolute", top: -65, left: 760, opacity: 0.55 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={roseUri} width={52} height={52} alt="" />
          <div style={{ fontFamily: "Cormorant", fontSize: 32, letterSpacing: 9, color: IVORY }}>PONENTI</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 780 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 40, height: 1, backgroundColor: BRASS }} />
            <div style={{ fontSize: 19, color: BRASS_LIGHT, letterSpacing: 3.4 }}>{kickerUpper}</div>
          </div>
          <div style={{ fontFamily: "Cormorant", fontSize: long ? 56 : 70, lineHeight: 1.06, letterSpacing: -1, color: IVORY }}>{title}</div>
        </div>
        <div style={{ display: "flex", fontSize: 22, color: IVORY_DIM }}>{footer}</div>
      </div>
    ),
    { ...ogSize, fonts: await fonts() },
  );
}

/** Square brand icon (apple touch icon). */
export function renderIcon(size: number) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: NAVY }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={roseUri} width={Math.round(size * 0.78)} height={Math.round(size * 0.78)} alt="" />
      </div>
    ),
    { width: size, height: size },
  );
}
