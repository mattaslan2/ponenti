/**
 * Analytics events. PostHog loads only after the visitor accepts analytics
 * cookies; before that, track() is a no-op and nothing is queued.
 */
export type AnalyticsEvent =
  | "cta_click"
  | "whatsapp_click"
  | "booking_open"
  | "form_submit"
  | "risk_test_complete"
  | "calculator_used"
  | "portal_click";

type Capture = (event: string, properties?: Record<string, unknown>) => void;

let capture: Capture | null = null;

export function setAnalyticsCapture(fn: Capture | null) {
  capture = fn;
}

export function track(event: AnalyticsEvent, properties?: Record<string, unknown>) {
  try {
    capture?.(event, properties);
  } catch {
    // Analytics must never break the page.
  }
}
