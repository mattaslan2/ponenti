"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { captureUtm } from "@/lib/utm";
import { CONSENT_EVENT, readConsent, type ConsentValue } from "@/lib/consent";
import { setAnalyticsCapture, track, type AnalyticsEvent } from "@/lib/analytics";
import { publicEnv } from "@/lib/env";

type PostHogClient = typeof import("posthog-js").default;
let posthog: PostHogClient | null = null;
let loading: Promise<void> | null = null;

/** Loads PostHog (US cloud, via the /ingest proxy) only after consent. */
function startAnalytics() {
  if (!publicEnv.posthogKey) return;
  if (posthog) {
    posthog.opt_in_capturing();
    setAnalyticsCapture((e, p) => posthog?.capture(e, p));
    return;
  }
  loading ??= import("posthog-js").then(({ default: ph }) => {
    ph.init(publicEnv.posthogKey, {
      api_host: "/ingest",
      ui_host: "https://us.posthog.com",
      defaults: "2025-05-24",
      capture_pageview: "history_change",
      person_profiles: "identified_only",
      autocapture: false,
      disable_session_recording: true,
    });
    posthog = ph;
    setAnalyticsCapture((e, p) => ph.capture(e, p));
  });
}

function stopAnalytics() {
  setAnalyticsCapture(null);
  posthog?.opt_out_capturing();
}

/**
 * A figure counts up to its value: "$17B" runs 0 to 17, "%12,5" runs 0,0 to 12,5.
 * The server renders the final text; this reads the first number in it, keeps the
 * text around it and the locale's separators, and writes the final text back at
 * the end so nothing depends on the animation. Figures tick on tabular numerals
 * so the text does not wobble.
 */
const COUNT_MS = 1100;
function countUp(el: HTMLElement) {
  const text = el.textContent ?? "";
  const match = text.match(/\d(?:[\d.,  ]*\d)?/);
  if (!match || match.index === undefined) return;
  const raw = match[0];
  const tr = document.documentElement.lang.startsWith("tr");
  const decimal = tr ? "," : ".";
  const group = tr ? "." : ",";
  const groupRe = new RegExp(`[\\u00a0 \\${group}]`, "g");
  const value = Number(raw.replace(groupRe, "").replace(decimal, "."));
  if (!Number.isFinite(value) || value === 0) return;
  const decimals = raw.includes(decimal) ? raw.split(decimal)[1].length : 0;
  const format = new Intl.NumberFormat(tr ? "tr-TR" : "en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: raw.includes(group) || raw.includes(" "),
  });
  const before = text.slice(0, match.index);
  const after = text.slice(match.index + raw.length);
  el.style.fontVariantNumeric = "tabular-nums";
  let start: number | null = null;
  const frame = (now: number) => {
    start ??= now;
    const p = Math.min(1, (now - start) / COUNT_MS);
    const eased = 1 - (1 - p) ** 3;
    if (p < 1) {
      el.textContent = before + format.format(value * eased) + after;
      requestAnimationFrame(frame);
    } else {
      el.textContent = text;
      el.style.fontVariantNumeric = "";
    }
  };
  el.textContent = before + format.format(0) + after;
  requestAnimationFrame(frame);
}

/**
 * Small client runtime: UTM capture (memory only), consent-gated analytics,
 * click tracking via data-track attributes, the header's scrolled state, and
 * the reveal for content below the fold (section rules draw, content fades up,
 * figures count up).
 */
export function ClientRuntime() {
  const pathname = usePathname();

  useEffect(() => {
    captureUtm(window.location.search);
    if (readConsent() === "granted") startAnalytics();

    const onConsent = (event: Event) => {
      const value = (event as CustomEvent<ConsentValue>).detail;
      if (value === "granted") startAnalytics();
      else stopAnalytics();
    };
    const onClick = (event: MouseEvent) => {
      const el = (event.target as Element | null)?.closest<HTMLElement>("[data-track]");
      if (!el?.dataset.track) return;
      track(el.dataset.track as AnalyticsEvent, {
        label: el.dataset.trackLabel,
        location: el.dataset.trackLocation,
        path: window.location.pathname,
      });
    };
    // Header state: clear at the top of the page, a hairline and a veil once it moves.
    const root = document.documentElement;
    let scrolled: boolean | null = null;
    const onScroll = () => {
      const next = window.scrollY > 12;
      if (next === scrolled) return;
      scrolled = next;
      root.toggleAttribute("data-scrolled", next);
    };
    onScroll();
    window.addEventListener(CONSENT_EVENT, onConsent);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick, { capture: true });
    return () => {
      window.removeEventListener(CONSENT_EVENT, onConsent);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick, { capture: true });
    };
  }, []);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-shown])"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      elements.forEach((el) => (el.dataset.shown = ""));
      return;
    }
    // Content already on screen stays put; only content below the fold fades in.
    // Figures (data-count) count up either way, once, when their block shows.
    const fold = window.innerHeight * 0.92;
    const below: HTMLElement[] = [];
    const show = (el: HTMLElement) => {
      el.dataset.shown = "";
      el.querySelectorAll<HTMLElement>("[data-count]:not([data-counted])").forEach((figure) => {
        figure.dataset.counted = "";
        countUp(figure);
      });
    };
    for (const el of elements) {
      if (el.getBoundingClientRect().top < fold) show(el);
      else {
        el.dataset.pending = "";
        below.push(el);
      }
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          delete el.dataset.pending;
          show(el);
          observer.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -6% 0px" },
    );
    below.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
