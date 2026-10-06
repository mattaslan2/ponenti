import "server-only";

/**
 * USITC DataWeb: current US tariff (HTS) lines under an HS6 code. The token is
 * personal, server-side only, and expires every 180 days (renew it at
 * https://dataweb.usitc.gov/api-key, then update USITC_DATAWEB_TOKEN in Vercel).
 * Without a valid token the tariff card is simply hidden.
 */
const BASE = "https://datawebws.usitc.gov/dataweb/api/v2";
const WEEK = 60 * 60 * 24 * 7;

export type TariffLine = {
  hts8: string;
  description: string;
  /** General (MFN, column 1) rate as written in the HTS, e.g. "Free", "6.4%", "2.8¢/kg". */
  general: string;
  units: string[];
};

type Node = { id: string; value: string | null; children?: Node[] | null };

function find(nodes: Node[] | null | undefined, id: string): Node | undefined {
  for (const n of nodes ?? []) {
    if (n.id === id && n.value) return n;
    const hit = find(n.children, id);
    if (hit) return hit;
  }
  return undefined;
}

async function usitc<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  const token = process.env.USITC_DATAWEB_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "force-cache",
      next: { revalidate: WEEK, tags: ["trade-tariff"] },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) console.warn("[usitc] token rejected; renew USITC_DATAWEB_TOKEN");
      return null;
    }
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function tariffLines(hs6: string, year: number): Promise<TariffLine[] | null> {
  if (!/^\d{6}$/.test(hs6)) return null;
  const list = await usitc<{
    list: { code: string; desc: string; isExpired: boolean }[];
  }>("/tariff/currentTariffLookup", {
    method: "POST",
    body: JSON.stringify({ searchTerm: hs6, tariffYear: String(year) }),
  });
  if (!list?.list) return null;
  const lines = list.list.filter((l) => !l.isExpired && l.code.startsWith(hs6) && /^\d{8}$/.test(l.code)).slice(0, 12);
  const details = await Promise.all(lines.map((l) => usitc<{ sections: Node[] }>(`/tariff/currentTariffDetails?year=${year}&hts8=${l.code}`)));
  return lines.map((l, i) => {
    const sections = details[i]?.sections;
    return {
      hts8: l.code,
      description: l.desc,
      general: find(sections, "mfn_text")?.value ?? "",
      units: [find(sections, "uoq1")?.value, find(sections, "uoq2")?.value].filter((u): u is string => Boolean(u)),
    };
  });
}
