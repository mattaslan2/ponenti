/**
 * UTM parameters from the landing URL, kept in memory only (no cookie, no
 * storage). They survive in-app navigation and are attached to a form when the
 * visitor submits it. A full reload starts fresh.
 */
export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
export type UtmKey = (typeof UTM_KEYS)[number];
export type Utm = Partial<Record<UtmKey, string>>;

let captured: Utm | null = null;

export function captureUtm(search: string) {
  if (captured) return;
  const params = new URLSearchParams(search);
  const found: Utm = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) found[key] = value.slice(0, 200);
  }
  if (Object.keys(found).length > 0) captured = found;
}

export function getUtm(): Utm {
  return captured ?? {};
}
