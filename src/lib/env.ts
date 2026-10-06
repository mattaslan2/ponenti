/**
 * Public (browser-safe) settings. NEXT_PUBLIC_* values are inlined at build
 * time, so each one must be referenced literally.
 */
export const publicEnv = {
  /** Cal.com event path, e.g. "ponenti/15min" (or a full https://cal.com/... URL). */
  calLink: (process.env.NEXT_PUBLIC_CAL_LINK ?? "").replace(/^https?:\/\/(app\.)?cal\.com\//, "").replace(/^\/+/, ""),
  /** WhatsApp number in international format, digits only (e.g. 14045550100). */
  whatsappNumber: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, ""),
  /** Client portal link. "/portal" (default) shows the placeholder page. */
  portalUrl: process.env.NEXT_PUBLIC_PORTAL_URL || "/portal",
  posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "",
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? "",
  /** Preview aid: show hidden proof slots as marked boxes. Never set in production. */
  showPlaceholders: process.env.NEXT_PUBLIC_SHOW_PLACEHOLDERS === "true",
  /** Set to "true" only after the E&O carrier confirms the penalty promise is covered. */
  eoConfirmed: process.env.NEXT_PUBLIC_EO_CONFIRMED === "true",
} as const;
