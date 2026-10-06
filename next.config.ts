import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import createNextIntlPlugin from "next-intl/plugin";
import { withBotId } from "botid/next/config";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  // One SENTRY_DSN variable feeds both the server and the browser SDK.
  // A DSN is a public identifier by design, so exposing it is safe.
  env: {
    NEXT_PUBLIC_SENTRY_DSN: process.env.SENTRY_DSN ?? "",
  },

  // PostHog (US cloud) behind a first-party path so it is not blocked.
  // The browser only calls it after the visitor accepts analytics cookies.
  async rewrites() {
    return [
      { source: "/ingest/static/:path*", destination: "https://us-assets.i.posthog.com/static/:path*" },
      { source: "/ingest/array/:path*", destination: "https://us-assets.i.posthog.com/array/:path*" },
      { source: "/ingest/:path*", destination: "https://us.i.posthog.com/:path*" },
    ];
  },
  skipTrailingSlashRedirect: true,
  productionBrowserSourceMaps: process.env.ANALYZE === "1",

  // Files read at request time by the share-image routes.
  outputFileTracingIncludes: {
    "/[locale]/opengraph-image": ["./assets/fonts/**"],
    "/[locale]/insights/[slug]/opengraph-image": ["./assets/fonts/**", "./src/content/insights/**"],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
        ],
      },
    ];
  },
};

const withMDX = createMDX({
  options: {
    // Turbopack needs plugin names as strings.
    remarkPlugins: ["remark-gfm"],
  },
});

const withNextIntl = createNextIntlPlugin({
  requestConfig: "./src/i18n/request.ts",
  experimental: {
    // ICU messages are compiled at build time, so the browser skips the message parser (~26 KB).
    messages: { path: "./src/messages", format: "json", locales: "infer", sourceLocale: "tr", precompile: true },
  },
});

export default withSentryConfig(withBotId(withNextIntl(withMDX(nextConfig))), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  telemetry: false,
  // Source maps upload only when a Sentry auth token is configured.
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  // Route browser error reports through the site so ad blockers don't drop them.
  tunnelRoute: "/monitoring",
});
