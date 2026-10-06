/** Typed hrefs for the trade pages (Türkiye is the default, so it never needs ?country=). */
export type ProductHref = { pathname: "/trade-data/[hs]"; params: { hs: string }; query?: Record<string, string> };
export type OverviewHref = { pathname: "/trade-data"; query?: Record<string, string> };

export const productHref = (hs: string, iso2: string): ProductHref =>
  iso2 === "TR" ? { pathname: "/trade-data/[hs]", params: { hs } } : { pathname: "/trade-data/[hs]", params: { hs }, query: { country: iso2 } };

export const overviewHref = (iso2: string): OverviewHref => (iso2 === "TR" ? { pathname: "/trade-data" } : { pathname: "/trade-data", query: { country: iso2 } });
