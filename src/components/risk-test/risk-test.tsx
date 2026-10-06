"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, ArrowUpRight, CircleCheck, CircleDot, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LeadForm } from "@/components/forms/lead-form";
import { track } from "@/lib/analytics";
import { questions, scoreRiskTest, type AnswerValue, type Answers, type RiskId } from "@/lib/risk-test";
import { cn } from "@/lib/utils";

/* The level is said in words first; the icon and the tone only repeat it. */
const levelStyle = {
  low: { icon: CircleCheck, className: "text-navy" },
  medium: { icon: CircleDot, className: "text-brass-deep" },
  high: { icon: AlertTriangle, className: "text-oxblood" },
} as const;

export function RiskTest({ sourceUrls }: { sourceUrls: Partial<Record<RiskId, string>> }) {
  const t = useTranslations("riskTest");
  const tc = useTranslations("common");
  const cta = useTranslations("cta");
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Answers>({});
  const focusRef = useRef<HTMLElement | null>(null);
  const pointerRef = useRef(false);
  const started = step >= 0;
  const done = step >= questions.length;
  const result = useMemo(() => (done ? scoreRiskTest(answers) : null), [done, answers]);

  useEffect(() => {
    if (started) focusRef.current?.focus();
  }, [step, started]);

  useEffect(() => {
    if (result) track("risk_test_complete", { level: result.level, segment: result.segment, top: result.top.join(",") });
  }, [result]);

  const optionLabel = (id: string, value: AnswerValue) =>
    value.startsWith("r") ? t(`q.${id}.${value}` as "q.salesStates.r0") : t(`options.${value}` as "options.yes");

  if (!started) {
    return (
      <div>
        <p className="max-w-2xl font-display text-display-md font-medium text-navy">{t("intro")}</p>
        <p className="mt-5 text-small text-mist">{t("autoAdvance")}</p>
        <Button size="lg" className="mt-10" onClick={() => setStep(0)}>
          {t("start")}
          <ArrowRight aria-hidden="true" className="nudge" />
        </Button>
      </div>
    );
  }

  if (result) {
    const style = levelStyle[result.level];
    const Icon = style.icon;
    return (
      <div>
        <p className="eyebrow kicker">{t("result.title")}</p>
        <h2 ref={(el) => void (focusRef.current = el)} tabIndex={-1} className={cn("mt-6 flex items-center gap-4 text-display-lg outline-none", style.className)}>
          <Icon aria-hidden="true" className="size-8 shrink-0" />
          {t(`result.${result.level}`)}
        </h2>
        <p className="mt-6 max-w-2xl text-lead text-navy">{t(`result.${result.level}Body`)}</p>

        <h3 className="eyebrow mt-16">{t("result.top")}</h3>
        {result.top.length === 0 ? (
          <p className="mt-4 text-mist">{t("result.none")}</p>
        ) : (
          <ol className="mt-5 border-t border-line">
            {result.top.map((id, i) => (
              <li key={id} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 border-b border-line py-7">
                <span aria-hidden="true" className="font-display text-[1.375rem] leading-[1.3] font-medium text-brass-deep">
                  0{i + 1}
                </span>
                <div>
                  <p className="font-sans text-title font-semibold text-navy">{t(`risks.${id}.title`)}</p>
                  <p className="mt-2 max-w-xl text-mist">{t(`risks.${id}.body`)}</p>
                  {sourceUrls[id] && (
                    <a href={sourceUrls[id]} target="_blank" rel="noopener noreferrer" className="link mt-3 inline-flex items-baseline gap-1 text-caption text-mist-soft">
                      {tc("source")}
                      <ArrowUpRight aria-hidden="true" className="nudge-up size-3.5 translate-y-0.5" />
                      <span className="sr-only"> {tc("opensNewTab")}</span>
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-6 text-caption text-mist-soft">{t("result.informational")}</p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Button asChild size="lg">
            <Link
              href={{ pathname: "/contact", hash: "book" }}
              data-track="cta_click"
              data-track-label="book"
              data-track-location="risk_result"
            >
              {cta("book")}
              <ArrowRight aria-hidden="true" className="nudge" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              setAnswers({});
              setStep(0);
            }}
          >
            <RotateCcw aria-hidden="true" />
            {t("restart")}
          </Button>
        </div>

        <div className="sheet mt-20 p-6 sm:p-10">
          <h3 className="text-display-sm">{t("result.emailTitle")}</h3>
          <p className="mt-3 text-mist">{t("result.emailBody")}</p>
          <LeadForm
            className="mt-8"
            formType="risk_test"
            riskLevel={result.level}
            segment={result.segment}
            paymentDays={result.paymentDays}
            context={JSON.stringify({ level: result.level, top: result.top, answers })}
          />
        </div>
      </div>
    );
  }

  const q = questions[step];
  const selected = answers[q.id];
  const help = t.has(`q.${q.id}.help` as "q.ior.help") ? t(`q.${q.id}.help` as "q.ior.help") : null;

  const choose = (value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
    if (pointerRef.current) {
      pointerRef.current = false;
      window.setTimeout(() => setStep((s) => s + 1), 220);
    }
  };

  return (
    <div>
      <p aria-live="polite" className="figures text-caption text-mist-soft">
        {t("progress", { current: step + 1, total: questions.length })}
      </p>
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={questions.length}
        aria-valuenow={step + 1}
        aria-label={t("progress", { current: step + 1, total: questions.length })}
        className="mt-3 h-0.5 bg-line"
      >
        <div className="h-full bg-navy transition-[width] duration-300" style={{ width: `${((step + 1) / questions.length) * 100}%` }} />
      </div>

      <fieldset key={q.id} className="mt-12 animate-fade-in">
        <legend ref={(el) => void (focusRef.current = el)} tabIndex={-1} className="max-w-2xl font-display text-display-md font-medium text-navy outline-none">
          {t(`q.${q.id}.text` as "q.usEntity.text")}
        </legend>
        {help && <p className="mt-4 max-w-xl text-mist">{help}</p>}
        <div className="mt-10 border-t border-line" onPointerDown={() => (pointerRef.current = true)}>
          {q.options.map((value) => (
            <label
              key={value}
              className="flex min-h-16 cursor-pointer items-center gap-4 border-b border-line px-4 text-body text-navy transition-colors duration-200 hover:bg-sand/70 has-[:checked]:bg-sand has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-navy"
            >
              <input
                type="radio"
                name={q.id}
                value={value}
                checked={selected === value}
                onChange={() => choose(value)}
                className="size-5 shrink-0 accent-navy focus-visible:outline-none"
              />
              <span>{optionLabel(q.id, value)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-10 flex items-center justify-between gap-3">
        <Button variant="ghost" className="-ml-4 hover:bg-transparent" onClick={() => setStep((s) => Math.max(-1, s - 1))}>
          <ArrowLeft aria-hidden="true" />
          {t("back")}
        </Button>
        <Button onClick={() => setStep((s) => s + 1)} disabled={!selected} aria-disabled={!selected}>
          {step === questions.length - 1 ? t("result.title") : t("next")}
          <ArrowRight aria-hidden="true" className="nudge" />
        </Button>
      </div>
    </div>
  );
}
