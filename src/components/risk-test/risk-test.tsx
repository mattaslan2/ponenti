"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, CircleCheck, CircleDot, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LeadForm } from "@/components/forms/lead-form";
import { track } from "@/lib/analytics";
import { questions, scoreRiskTest, type AnswerValue, type Answers, type RiskId } from "@/lib/risk-test";
import { cn } from "@/lib/utils";

const levelStyle = {
  low: { icon: CircleCheck, className: "border-risk-low/50 bg-risk-low/10 text-risk-low" },
  medium: { icon: CircleDot, className: "border-risk-medium/50 bg-risk-medium/10 text-risk-medium" },
  high: { icon: AlertTriangle, className: "border-risk-high/50 bg-risk-high/10 text-risk-high" },
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
      <div className="rounded-sm border border-line bg-paper p-6 sm:p-10">
        <p className="text-lead text-graphite">{t("intro")}</p>
        <p className="mt-3 text-[0.9375rem] text-mist">{t("autoAdvance")}</p>
        <Button size="lg" className="mt-8" onClick={() => setStep(0)}>
          {t("start")}
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
    );
  }

  if (result) {
    const style = levelStyle[result.level];
    const Icon = style.icon;
    return (
      <div className="space-y-8">
        <div className="rounded-sm border border-line bg-paper p-6 sm:p-10">
          <h2 ref={(el) => void (focusRef.current = el)} tabIndex={-1} className="text-display-md outline-none">
            {t("result.title")}
          </h2>
          <p className={cn("mt-5 inline-flex items-center gap-2 rounded-xs border px-3 py-1.5 font-semibold", style.className)}>
            <Icon aria-hidden="true" className="size-5" />
            {t(`result.${result.level}`)}
          </p>
          <p className="mt-4 max-w-2xl text-graphite">{t(`result.${result.level}Body`)}</p>

          <h3 className="mt-8 font-display text-[1.375rem]">{t("result.top")}</h3>
          {result.top.length === 0 ? (
            <p className="mt-3 text-mist">{t("result.none")}</p>
          ) : (
            <ol className="mt-4 space-y-4">
              {result.top.map((id, i) => (
                <li key={id} className="grid grid-cols-[auto_1fr] gap-4 border-t border-line pt-4">
                  <span className="font-display text-2xl leading-none font-semibold text-brass-deep">{i + 1}</span>
                  <div>
                    <p className="font-semibold text-navy">{t(`risks.${id}.title`)}</p>
                    <p className="mt-1 text-mist">{t(`risks.${id}.body`)}</p>
                    {sourceUrls[id] && (
                      <a href={sourceUrls[id]} target="_blank" rel="noopener noreferrer" className="link mt-1 inline-block text-[0.875rem]">
                        {tc("source")}
                        <span className="sr-only"> {tc("opensNewTab")}</span>
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-8 text-[0.875rem] text-mist">{t("result.informational")}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg">
              <Link
                href={{ pathname: "/contact", hash: "book" }}
                data-track="cta_click"
                data-track-label="book"
                data-track-location="risk_result"
              >
                {cta("book")}
              </Link>
            </Button>
            <Button
              variant="ghost"
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
        </div>

        <div className="rounded-sm border border-line bg-paper p-6 sm:p-10">
          <h3 className="font-display text-[1.5rem]">{t("result.emailTitle")}</h3>
          <p className="mt-2 text-mist">{t("result.emailBody")}</p>
          <LeadForm
            className="mt-6"
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
    <div className="rounded-sm border border-line bg-paper p-6 sm:p-10">
      <div className="flex items-center justify-between gap-4 text-[0.875rem] text-mist">
        <span aria-live="polite">{t("progress", { current: step + 1, total: questions.length })}</span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={questions.length}
        aria-valuenow={step + 1}
        aria-label={t("progress", { current: step + 1, total: questions.length })}
        className="mt-2 h-1 overflow-hidden rounded-full bg-sand"
      >
        <div className="h-full bg-brass transition-[width] duration-250" style={{ width: `${((step + 1) / questions.length) * 100}%` }} />
      </div>

      <fieldset key={q.id} className="mt-8 animate-fade-in">
        <legend
          ref={(el) => void (focusRef.current = el)}
          tabIndex={-1}
          className="font-display text-[1.625rem] leading-snug font-semibold text-navy outline-none sm:text-[1.875rem]"
        >
          {t(`q.${q.id}.text` as "q.usEntity.text")}
        </legend>
        {help && <p className="mt-3 text-mist">{help}</p>}
        <div className="mt-6 grid gap-3" onPointerDown={() => (pointerRef.current = true)}>
          {q.options.map((value) => (
            <label
              key={value}
              className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xs border border-field bg-ivory px-4 text-[1.0625rem] transition-colors duration-200 hover:border-navy has-[:checked]:border-navy has-[:checked]:bg-sand has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-cobalt"
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

      <div className="mt-8 flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => setStep((s) => Math.max(-1, s - 1))}>
          <ArrowLeft aria-hidden="true" />
          {t("back")}
        </Button>
        <Button onClick={() => setStep((s) => s + 1)} disabled={!selected} aria-disabled={!selected}>
          {step === questions.length - 1 ? t("result.title") : t("next")}
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
