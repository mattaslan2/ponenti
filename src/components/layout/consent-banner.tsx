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
      className="fixed inset-x-3 bottom-3 z-50 animate-fade-in sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[27rem]"
    >
      <div className="on-navy rounded-xs bg-navy p-5 text-ivory shadow-sheet sm:p-6">
        <p className="text-caption text-ivory-dim sm:text-small">
          <strong className="font-sans font-semibold text-ivory">{labels.title}</strong> {body}
        </p>

        {prefs && (
          <div className="mt-5 space-y-4 border-t border-line-navy pt-5 text-small">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-ivory">{labels.necessary}</p>
                <p className="text-ivory-dim">{labels.necessaryBody}</p>
              </div>
              <span className="mt-0.5 text-[0.75rem] font-medium tracking-[0.14em] text-brass-light" aria-hidden="true">
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

        <div className="mt-5 grid grid-cols-3 gap-2">
          <Button variant="outlineLight" size="sm" className="px-2" onClick={() => decide(true)}>
            {labels.accept}
          </Button>
          <Button variant="outlineLight" size="sm" className="px-2" onClick={() => decide(false)}>
            {labels.decline}
          </Button>
          {prefs ? (
            <Button variant="outlineLight" size="sm" className="px-2" onClick={() => decide(analytics)}>
              {labels.save}
            </Button>
          ) : (
            <Button variant="outlineLight" size="sm" className="px-2" onClick={() => setPrefs(true)}>
              {labels.preferences}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
