/** Month arithmetic for monthly trade statistics (UTC, no time zones involved). */
export type Ym = { y: number; m: number };

export const ymKey = ({ y, m }: Ym) => `${y}-${String(m).padStart(2, "0")}`;

export function parseYm(s: string): Ym {
  const [y, m] = s.split("-").map(Number);
  return { y, m };
}

export function addMonths({ y, m }: Ym, n: number): Ym {
  const idx = y * 12 + (m - 1) + n;
  return { y: Math.floor(idx / 12), m: (idx % 12) + 1 };
}

/** The n months ending at `last`, oldest first. */
export function monthsEnding(last: Ym, n: number): Ym[] {
  return Array.from({ length: n }, (_, i) => addMonths(last, i - n + 1));
}

/**
 * Basis for year-to-date comparisons. From April on, compare Jan–latest with the
 * same months a year earlier; in January–March, three months are too few, so
 * compare the last two full calendar years instead.
 */
export type YtdBasis = { kind: "ytd" | "year"; cur: Ym; prev: Ym };
export function ytdBasis(latest: Ym): YtdBasis {
  return latest.m >= 4
    ? { kind: "ytd", cur: latest, prev: { y: latest.y - 1, m: latest.m } }
    : {
        kind: "year",
        cur: { y: latest.y - 1, m: 12 },
        prev: { y: latest.y - 2, m: 12 },
      };
}
