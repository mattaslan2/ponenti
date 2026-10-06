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
      <body style={{ margin: 0, background: "#f6f1e7", color: "#0e1a2b", fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif" }}>
        <main style={{ maxWidth: 640, margin: "0 auto", padding: "120px 24px" }}>
          <p style={{ color: "#7a5c2e", letterSpacing: "0.16em", fontSize: 12, fontWeight: 500, margin: 0 }}>PONENTI</p>
          <h1 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400, fontSize: 40, lineHeight: 1.12, margin: "24px 0 0" }}>
            Bir sorun oluştu. / Something went wrong.
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: "#4f5660", margin: "24px 0 0" }}>
            Lütfen sayfayı yenileyin. / Please reload the page.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 40, background: "#0e1a2b", color: "#f6f1e7", border: 0, borderRadius: 2, padding: "0 32px", height: 56, fontSize: 15, fontWeight: 500, cursor: "pointer" }}
          >
            Yeniden dene / Try again
          </button>
        </main>
      </body>
    </html>
  );
}
