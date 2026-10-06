import { useSyncExternalStore } from "react";

export const CONSENT_COOKIE = "ponenti_consent";
export const CONSENT_EVENT = "ponenti:consent";
export const CONSENT_OPEN_EVENT = "ponenti:consent-open";

export type ConsentValue = "granted" | "denied";

export function readConsent(): ConsentValue | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=(granted|denied)`));
  return (match?.[1] as ConsentValue | undefined) ?? null;
}

export function writeConsent(value: ConsentValue) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${value}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent<ConsentValue>(CONSENT_EVENT, { detail: value }));
}

/** Reopens the cookie banner (footer "Cookie settings" link). */
export function openConsentPreferences() {
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}

/* React binding: hydration-safe read of the consent cookie ("unknown" on the server). */

function subscribeConsent(callback: () => void) {
  window.addEventListener(CONSENT_EVENT, callback);
  return () => window.removeEventListener(CONSENT_EVENT, callback);
}

export function useConsent(): ConsentValue | null | "unknown" {
  return useSyncExternalStore(subscribeConsent, readConsent, () => "unknown" as const);
}
