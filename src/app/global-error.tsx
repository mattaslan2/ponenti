"use client";

import { useEffect } from "react";
import { loadSentry } from "@/lib/sentry-browser";

/** Last-resort error page (replaces the root layout). Bilingual, no dependencies. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    loadSentry()
      ?.then((Sentry) => Sentry.captureException(error))
      .catch(() => {});
  }, [error]);

  return (
    <html lang="tr">
      <body style={{ margin: 0, background: "#f6f1e7", color: "#1c1c1c", fontFamily: "Georgia, serif" }}>
        <main style={{ maxWidth: 640, margin: "0 auto", padding: "96px 24px" }}>
          <p style={{ color: "#7a5c2e", letterSpacing: "0.12em", fontSize: 13, fontFamily: "system-ui, sans-serif" }}>PONENTI</p>
          <h1 style={{ color: "#0e1a2b", fontSize: 36, lineHeight: 1.15 }}>Bir sorun oluştu. / Something went wrong.</h1>
          <p style={{ fontSize: 18, lineHeight: 1.6 }}>
            Lütfen sayfayı yenileyin. Sorun sürerse bize WhatsApp&apos;tan yazın. / Please reload the page. If it continues, message us on WhatsApp.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 24, background: "#0e1a2b", color: "#f6f1e7", border: 0, padding: "12px 20px", fontSize: 16, cursor: "pointer" }}
          >
            Yeniden dene / Try again
          </button>
        </main>
      </body>
    </html>
  );
}
