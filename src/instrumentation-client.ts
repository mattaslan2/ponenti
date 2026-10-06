import { initBotId } from "botid/client/core";
import { loadSentry } from "@/lib/sentry-browser";

// Vercel BotID: invisible bot check on every form POST (Server Actions post to the page URL).
initBotId({
  protect: [
    { path: "/tr/*", method: "POST" },
    { path: "/en/*", method: "POST" },
  ],
});

// Sentry starts once the browser is idle after load.
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_SENTRY_DSN) {
  const start = () => void loadSentry();
  if ("requestIdleCallback" in window) window.requestIdleCallback(start, { timeout: 4000 });
  else setTimeout(start, 2000);
}
