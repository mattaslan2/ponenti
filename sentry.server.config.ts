import * as Sentry from "@sentry/nextjs";

// Server-side error monitoring. Off until SENTRY_DSN is set. No PII, errors only.
const dsn = process.env.SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: 0,
  });
}
