import { NextResponse, type NextRequest } from "next/server";
import { searchHs } from "@/lib/trade/hs";

/** Product search for the trade-data tool. Static index, no external calls. */
export function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").slice(0, 80);
  const locale = request.nextUrl.searchParams.get("locale") === "en" ? "en" : "tr";
  const results = q.trim().length >= 2 ? searchHs(q, locale, 10) : [];
  return NextResponse.json({ results }, { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" } });
}
