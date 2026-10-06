"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CalendarDays } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

type CalApi = ((...args: unknown[]) => void) & { ns: Record<string, (...args: unknown[]) => void>; loaded?: boolean; q?: unknown[] };
declare global {
  interface Window {
    Cal?: CalApi;
  }
}

/** Official Cal.com embed loader, run only when the visitor opens the calendar. */
function loadCalScript() {
  /* eslint-disable */
  (function (C: any, A: string, L: string) {
    const p = function (a: any, ar: any) {
      a.q.push(ar);
    };
    const d = C.document;
    C.Cal =
      C.Cal ||
      function () {
        const cal = C.Cal;
        const ar = arguments;
        if (!cal.loaded) {
          cal.ns = {};
          cal.q = cal.q || [];
          d.head.appendChild(d.createElement("script")).src = A;
          cal.loaded = true;
        }
        if (ar[0] === L) {
          const api: any = function () {
            p(api, arguments);
          };
          const namespace = ar[1];
          api.q = api.q || [];
          if (typeof namespace === "string") {
            cal.ns[namespace] = cal.ns[namespace] || api;
            p(cal.ns[namespace], ar);
            p(cal, ["initNamespace", namespace]);
          } else p(cal, ar);
          return;
        }
        p(cal, ar);
      };
  })(window, "https://app.cal.com/embed/embed.js", "init");
  /* eslint-enable */
}

export function CalEmbed({
  calLink,
  labels,
}: {
  calLink: string;
  labels: { load: string; notice: string; missing: string };
}) {
  const [open, setOpen] = useState(false);
  const started = useRef(false);

  const start = () => {
    if (started.current || !calLink) return;
    started.current = true;
    setOpen(true);
    track("booking_open", { source: "contact" });
  };

  useEffect(() => {
    // Arriving from a "Book a call" button (#book) opens the calendar directly.
    if (window.location.hash === "#book") start();
    const onHash = () => window.location.hash === "#book" && start();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    loadCalScript();
    const Cal = window.Cal!;
    Cal("init", "ponenti", { origin: "https://app.cal.com" });
    Cal.ns.ponenti("inline", {
      elementOrSelector: "#cal-inline",
      calLink,
      config: { layout: "month_view", theme: "light" },
    });
    Cal.ns.ponenti("ui", {
      theme: "light",
      layout: "month_view",
      hideEventTypeDetails: false,
      cssVarsPerTheme: { light: { "cal-brand": "#0e1a2b" } },
    });
    Cal.ns.ponenti("on", {
      action: "bookingSuccessful",
      callback: () => track("form_submit", { form: "booking" }),
    });
  }, [open, calLink]);

  if (!calLink) {
    return <p className="rounded-xs border border-line bg-paper p-4 text-mist">{labels.missing}</p>;
  }

  return (
    <div>
      {!open && (
        <div className="rounded-sm border border-line bg-paper p-6">
          <Button size="lg" onClick={start}>
            <CalendarDays aria-hidden="true" />
            {labels.load}
          </Button>
          <p className="mt-3 text-[0.8125rem] text-mist">{labels.notice}</p>
        </div>
      )}
      <div id="cal-inline" className={open ? "min-h-[640px] overflow-hidden rounded-sm border border-line bg-paper" : "hidden"} />
    </div>
  );
}

/** Current time in Istanbul and New York, plus today's collections hours in both. */
/* A shared 30-second clock (hydration-safe: the server renders "--:--"). */
let clockNow = 0;
let clockTimer = 0;
const clockListeners = new Set<() => void>();
function subscribeClock(callback: () => void) {
  clockListeners.add(callback);
  if (!clockTimer) {
    clockTimer = window.setInterval(() => {
      clockNow = Date.now();
      clockListeners.forEach((l) => l());
    }, 30_000);
  }
  return () => {
    clockListeners.delete(callback);
    if (clockListeners.size === 0) {
      window.clearInterval(clockTimer);
      clockTimer = 0;
    }
  };
}
const clockSnapshot = () => clockNow || (clockNow = Date.now());

export function DualClock() {
  const t = useTranslations("contact");
  const locale = useLocale();
  const stamp = useSyncExternalStore(subscribeClock, clockSnapshot, () => 0);
  const now = stamp ? new Date(stamp) : null;

  const fmt = (zone: string, d: Date) =>
    new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: zone }).format(d);

  let hours = "";
  if (now) {
    const minutesIn = (zone: string) => {
      const parts = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "numeric", hour12: false, timeZone: zone }).formatToParts(now);
      const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
      const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
      return h * 60 + m;
    };
    let delta = minutesIn("Europe/Istanbul") - minutesIn("America/New_York");
    if (delta < 0) delta += 24 * 60;
    const hhmm = (mins: number) => {
      const v = ((mins % 1440) + 1440) % 1440;
      return `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
    };
    hours = t("callHours", { nyStart: "08:00", nyEnd: "16:00", istStart: hhmm(8 * 60 + delta), istEnd: hhmm(16 * 60 + delta) });
  }

  return (
    <div className="rounded-sm border border-line bg-paper p-5">
      <dl className="grid grid-cols-2 gap-4">
        <div>
          <dt className="text-[0.8125rem] text-mist">{t("istanbul")}</dt>
          <dd className="font-display text-[2rem] leading-tight font-semibold text-navy [font-variant-numeric:tabular-nums]">
            {now ? fmt("Europe/Istanbul", now) : "--:--"}
          </dd>
        </div>
        <div>
          <dt className="text-[0.8125rem] text-mist">{t("newYork")}</dt>
          <dd className="font-display text-[2rem] leading-tight font-semibold text-navy [font-variant-numeric:tabular-nums]">
            {now ? fmt("America/New_York", now) : "--:--"}
          </dd>
        </div>
      </dl>
      <p className="mt-3 min-h-[1.5em] text-[0.875rem] text-mist">{hours}</p>
    </div>
  );
}
