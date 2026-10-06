"use client";

import { openConsentPreferences } from "@/lib/consent";
import { cn } from "@/lib/utils";

export function CookieSettingsButton({ label, className }: { label: string; className?: string }) {
  return (
    <button type="button" onClick={openConsentPreferences} className={cn("text-left", className)}>
      {label}
    </button>
  );
}
