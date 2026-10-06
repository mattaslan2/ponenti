import * as Sentry from "@sentry/nextjs";

/** API keys travel in some upstream URLs (the Census API takes ?key=); never let them reach Sentry. */
const scrub = (text: string) => text.replace(/([?&](?:key|token|api_key)=)[^&\s"]+/gi, "$1[redacted]");

// Server-side error monitoring. Off until SENTRY_DSN is set. No PII, errors only.
const dsn = process.env.SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: 0,
    beforeBreadcrumb(breadcrumb) {
      if (typeof breadcrumb.data?.url === "string") breadcrumb.data.url = scrub(breadcrumb.data.url);
      if (breadcrumb.message) breadcrumb.message = scrub(breadcrumb.message);
      return breadcrumb;
    },
    beforeSend(event) {
      if (event.request?.url) event.request.url = scrub(event.request.url);
      if (event.request?.query_string && typeof event.request.query_string === "string") event.request.query_string = scrub(event.request.query_string);
      for (const ex of event.exception?.values ?? []) if (ex.value) ex.value = scrub(ex.value);
      return event;
    },
  });
}
