/**
 * Browser error monitoring (Sentry), loaded on demand so it never slows the
 * first paint. Off until SENTRY_DSN is set. No cookies, no replay, no PII.
 */
type SentryModule = typeof import("@sentry/nextjs");

let loading: Promise<SentryModule> | null = null;

export function loadSentry(): Promise<SentryModule> | null {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return null;
  loading ??= import("@sentry/nextjs").then((Sentry) => {
    if (!Sentry.getClient()) {
      Sentry.init({ dsn, environment: process.env.NODE_ENV, tracesSampleRate: 0, integrations: [] });
    }
    return Sentry;
  });
  return loading;
}
