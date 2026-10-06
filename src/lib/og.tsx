import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };

const NAVY = "#0e1a2b";
const IVORY = "#f6f1e7";
const BRASS = "#b08d57";
const BRASS_LIGHT = "#cdae7c";
const IVORY_DIM = "#c9c1b1";

const rose = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><g stroke="${BRASS}" stroke-width="0.9"><circle cx="32" cy="32" r="21" opacity="0.6"/><path d="M32 32 44.6 19.4M32 32 44.6 44.6M32 32 19.4 44.6M32 32 19.4 19.4" opacity="0.6"/><path d="M32 9.5 34.4 29.6 32 32 29.6 29.6Z"/><path d="M54.5 32 34.4 34.4 32 32 34.4 29.6Z"/><path d="M32 54.5 29.6 34.4 32 32 34.4 34.4Z"/></g><path d="M2.5 32 29.6 28.4 32 32 29.6 35.6Z" fill="${BRASS}"/><circle cx="32" cy="32" r="2.2" fill="${BRASS}"/></svg>`;
const roseUri = `data:image/svg+xml;base64,${Buffer.from(rose).toString("base64")}`;

const pattern = `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72"><g fill="none" stroke="${BRASS}" stroke-width="1" opacity="0.07"><path d="M36 6 L43 29 L66 36 L43 43 L36 66 L29 43 L6 36 L29 29 Z"/><path d="M36 22 L50 36 L36 50 L22 36 Z"/></g></svg>`;
const patternUri = `data:image/svg+xml;base64,${Buffer.from(pattern).toString("base64")}`;

async function fonts() {
  const dir = join(process.cwd(), "assets/fonts");
  const [cLatin, cExt, iLatin, iExt] = await Promise.all([
    readFile(join(dir, "cormorant-garamond-latin-600-normal.woff")),
    readFile(join(dir, "cormorant-garamond-latin-ext-600-normal.woff")),
    readFile(join(dir, "inter-latin-500-normal.woff")),
    readFile(join(dir, "inter-latin-ext-500-normal.woff")),
  ]);
  return [
    { name: "Cormorant", data: cLatin, weight: 600 as const, style: "normal" as const },
    { name: "Cormorant", data: cExt, weight: 600 as const, style: "normal" as const },
    { name: "Inter", data: iLatin, weight: 500 as const, style: "normal" as const },
    { name: "Inter", data: iExt, weight: 500 as const, style: "normal" as const },
  ];
}

/** Brand Open Graph card: navy, brass wind rose, serif headline, pride line. */
export async function renderOg({ title, kicker, footer, locale }: { title: string; kicker: string; footer: string; locale: "tr" | "en" }) {
  // Satori's text-transform is not locale-aware (it would print "BILGI" for "Bilgi").
  const kickerUpper = kicker.toLocaleUpperCase(locale === "tr" ? "tr-TR" : "en-US");
  const long = title.length > 70;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: NAVY,
          backgroundImage: `url(${patternUri})`,
          backgroundSize: "72px 72px",
          padding: "64px 72px",
          fontFamily: "Inter",
          color: IVORY,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={roseUri} width={64} height={64} alt="" />
          <div style={{ fontFamily: "Cormorant", fontSize: 36, letterSpacing: 8, color: IVORY }}>PONENTI</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 24, color: BRASS_LIGHT, letterSpacing: 3 }}>{kickerUpper}</div>
          <div style={{ fontFamily: "Cormorant", fontSize: long ? 58 : 72, lineHeight: 1.08, color: IVORY, maxWidth: 1000 }}>{title}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ width: 120, height: 1, backgroundColor: BRASS }} />
          <div style={{ fontSize: 26, color: IVORY_DIM }}>{footer}</div>
        </div>
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
