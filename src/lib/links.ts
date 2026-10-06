import { publicEnv } from "./env";

/** WhatsApp click-to-chat link with a prefilled message, or null if no number is set. */
export function whatsappHref(message: string): string | null {
  if (!publicEnv.whatsappNumber) return null;
  return `https://wa.me/${publicEnv.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export type PortalTarget = { kind: "internal" } | { kind: "external"; href: string };

/**
 * The header's client-portal button. Default "/portal" shows the placeholder
 * page; set NEXT_PUBLIC_PORTAL_URL to the portal app (e.g. https://portal.example.com)
 * and the button switches with no other change.
 */
export function portalTarget(): PortalTarget {
  const url = publicEnv.portalUrl.trim();
  if (url === "/portal" || url === "") return { kind: "internal" };
  return { kind: "external", href: url };
}

/** Public Cal.com booking URL (used in emails), or null if not configured. */
export function calUrl(): string | null {
  return publicEnv.calLink ? `https://cal.com/${publicEnv.calLink}` : null;
}
