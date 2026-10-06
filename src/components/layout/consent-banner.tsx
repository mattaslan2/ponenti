"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CONSENT_OPEN_EVENT, readConsent, useConsent, writeConsent } from "@/lib/consent";
import { Button } from "@/components/ui/button";

type Labels = {
  title: string;
  accept: string;
  decline: string;
  preferences: string;
  save: string;
  necessary: string;
  necessaryBody: string;
  analytics: string;
  analyticsBody: string;
  dialogLabel: string;
};

/**
 * Cookie banner. Analytics (PostHog) stays off until "Accept" or until the
 * analytics switch is turned on in Preferences. All three buttons carry equal weight.
 */
export function ConsentBanner({ labels, body }: { labels: Labels; body: ReactNode }) {
  const consent = useConsent();
  const [reopened, setReopened] = useState(false);
  const [prefs, setPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    const reopen = () => {
      setAnalytics(readConsent() === "granted");
      setPrefs(true);
      setReopened(true);
    };
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
  }, []);

  const open = consent === null || reopened;
  if (!open) return null;

  const decide = (granted: boolean) => {
    writeConsent(granted ? "granted" : "denied");
    setReopened(false);
    setPrefs(false);
  };

  return (
    <section
      aria-label={labels.dialogLabel}
      className="fixed inset-x-3 bottom-3 z-50 animate-fade-in sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[26rem]"
    >
      <div className="on-navy rounded-sm border border-brass/40 bg-navy p-4 text-ivory shadow-quiet sm:p-5">
        <p className="text-[0.8125rem] leading-relaxed text-ivory-dim sm:text-[0.875rem]">
          <strong className="font-display text-[1.0625rem] font-semibold text-ivory">{labels.title}</strong> {body}
        </p>

        {prefs && (
          <div className="mt-4 space-y-3 border-t border-brass/30 pt-4 text-[0.875rem]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-ivory">{labels.necessary}</p>
                <p className="text-ivory-dim">{labels.necessaryBody}</p>
              </div>
              <span className="mt-0.5 text-[0.75rem] font-semibold tracking-wide text-brass-light" aria-hidden="true">
                ON
              </span>
            </div>
            <label className="flex cursor-pointer items-start justify-between gap-4">
              <span>
                <span className="block font-medium text-ivory">{labels.analytics}</span>
                <span className="block text-ivory-dim">{labels.analyticsBody}</span>
              </span>
              <input
                type="checkbox"
                role="switch"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="mt-1 size-5 shrink-0 accent-brass"
              />
            </label>
          </div>
        )}

        <div className="mt-3 grid grid-cols-3 gap-2">
          <Button variant="outlineLight" size="sm" onClick={() => decide(true)}>
            {labels.accept}
          </Button>
          <Button variant="outlineLight" size="sm" onClick={() => decide(false)}>
            {labels.decline}
          </Button>
          {prefs ? (
            <Button variant="outlineLight" size="sm" onClick={() => decide(analytics)}>
              {labels.save}
            </Button>
          ) : (
            <Button variant="outlineLight" size="sm" onClick={() => setPrefs(true)}>
              {labels.preferences}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
