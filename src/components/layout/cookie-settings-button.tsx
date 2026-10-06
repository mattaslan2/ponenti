"use client";

import { openConsentPreferences } from "@/lib/consent";

export function CookieSettingsButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={openConsentPreferences} className="text-left hover:underline">
      {label}
    </button>
  );
}
