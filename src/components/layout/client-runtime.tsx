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
 * Small client runtime: UTM capture (memory only), consent-gated analytics,
 * click tracking via data-track attributes, the header's scrolled state, and
 * the reveal for content below the fold (section rules draw, content fades up).
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
    const fold = window.innerHeight * 0.92;
    const below: HTMLElement[] = [];
    for (const el of elements) {
      if (el.getBoundingClientRect().top < fold) el.dataset.shown = "";
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
          el.dataset.shown = "";
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
