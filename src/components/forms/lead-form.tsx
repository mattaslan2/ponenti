"use client";

import { startTransition, useActionState, useEffect, useId, useRef } from "react";
import { Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { submitLead, type LeadState } from "@/actions/lead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { track } from "@/lib/analytics";
import { publicEnv } from "@/lib/env";
import { getUtm, UTM_KEYS } from "@/lib/utm";
import { cn } from "@/lib/utils";

type FormType = "contact" | "risk_test" | "calc_cash" | "calc_5472" | "prospect" | "trade_data";

const PAYMENT_OPTIONS = [
  { value: "0-29", key: "r0" },
  { value: "30-45", key: "r1" },
  { value: "46-60", key: "r2" },
  { value: "61-90", key: "r3" },
  { value: "90+", key: "r4" },
] as const;

export function LeadForm({
  formType,
  full = false,
  context,
  riskLevel,
  segment,
  paymentDays,
  firm,
  submitLabel,
  paymentLabels,
  className,
}: {
  formType: FormType;
  /** Contact form: adds phone, segment, payment days and message. */
  full?: boolean;
  context?: string;
  riskLevel?: string;
  segment?: string;
  paymentDays?: string;
  firm?: string;
  submitLabel?: string;
  /** Labels for the payment-days ranges (from riskTest.q.paymentDays). */
  paymentLabels?: Record<"r0" | "r1" | "r2" | "r3" | "r4", string>;
  className?: string;
}) {
  const t = useTranslations("forms");
  const locale = useLocale();
  const uid = useId();
  const [state, action, pending] = useActionState<LeadState, FormData>(submitLead, { status: "idle" });
  const startedAt = useRef(0);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  // Fill-time and campaign tags (kept in page memory) are added at submit time.
  // Submitting through onSubmit (not the form action prop) keeps what the
  // visitor typed when the server returns a validation error.
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("startedAt", String(startedAt.current || Date.now()));
    const utm = getUtm();
    for (const key of UTM_KEYS) if (utm[key]) formData.set(key, utm[key]!);
    startTransition(() => action(formData));
  };

  useEffect(() => {
    if (state.status === "success") track("form_submit", { form: formType, locale });
    if (state.status !== "idle") statusRef.current?.focus();
  }, [state, formType, locale]);

  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const errorText = (field: string) => {
    const code = errors[field];
    if (!code) return null;
    const map = {
      required: t("errRequired"),
      email: t("errEmail"),
      tooLong: t("errTooLong"),
      phone: t("errPhone"),
      consent: t("errConsent"),
      taxId: t("errTaxId"),
    } as const;
    return map[code];
  };
  const fieldId = (name: string) => `${uid}-${name}`;
  const describedBy = (name: string, extra?: string) =>
    [errors[name] ? `${fieldId(name)}-error` : null, extra].filter(Boolean).join(" ") || undefined;

  if (state.status === "success") {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className={cn("border-t border-brass pt-6 outline-none", className)}>
        <Check aria-hidden="true" className="size-6 text-brass-deep" />
        <p className="mt-4 font-display text-display-sm font-medium text-navy">{t("successTitle")}</p>
        <p className="mt-2 text-mist">{state.emailed ? t("successBody") : t("successNoEmail")}</p>
      </div>
    );
  }

  // WhatsApp is offered as the way around a failed send only when a number is connected.
  const orWhatsapp = publicEnv.whatsappNumber ? ` ${t("errWhatsapp")}` : "";
  const formError =
    state.status === "error"
      ? state.code === "validation"
        ? t("errSummary")
        : (state.code === "bot" ? t("errBot") : state.code === "not_configured" ? t("errNotConfigured") : t("errGeneric")) + orWhatsapp
      : null;

  return (
    <form onSubmit={submit} noValidate className={cn("space-y-6", className)} aria-describedby={formError ? `${uid}-status` : undefined}>
      <input type="hidden" name="formType" value={formType} />
      <input type="hidden" name="locale" value={locale} />
      {context && <input type="hidden" name="context" value={context} />}
      {riskLevel && <input type="hidden" name="riskLevel" value={riskLevel} />}
      {!full && segment && <input type="hidden" name="segment" value={segment} />}
      {!full && paymentDays && <input type="hidden" name="paymentDays" value={paymentDays} />}
      {firm && <input type="hidden" name="firm" value={firm} />}

      {/* Honeypot: hidden from people and assistive tech; bots fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div ref={statusRef} tabIndex={-1} id={`${uid}-status`} aria-live="polite" className="outline-none">
        {formError && <p className="border-l-2 border-oxblood py-1 pl-4 text-small text-oxblood">{formError}</p>}
      </div>

      <div className={cn("grid gap-6", full && "sm:grid-cols-2")}>
        <Field id={fieldId("name")} label={t("name")} error={errorText("name")}>
          <Input id={fieldId("name")} name="name" autoComplete="name" required maxLength={120} aria-invalid={!!errors.name} aria-describedby={describedBy("name")} />
        </Field>
        <Field id={fieldId("email")} label={t("email")} error={errorText("email")}>
          <Input id={fieldId("email")} name="email" type="email" inputMode="email" autoComplete="email" required maxLength={200} aria-invalid={!!errors.email} aria-describedby={describedBy("email")} />
        </Field>
        <Field id={fieldId("company")} label={t("company")} error={errorText("company")}>
          <Input id={fieldId("company")} name="company" autoComplete="organization" required maxLength={160} aria-invalid={!!errors.company} aria-describedby={describedBy("company")} />
        </Field>
        {full && (
          <Field id={fieldId("phone")} label={t("phone")} error={errorText("phone")} hint={t("phoneHint")}>
            <Input id={fieldId("phone")} name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={40} aria-invalid={!!errors.phone} aria-describedby={describedBy("phone", `${fieldId("phone")}-hint`)} />
          </Field>
        )}
      </div>

      {full && (
        <>
          <fieldset>
            <legend className="text-small font-medium text-navy">{t("segment")}</legend>
            <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
              {[
                { value: "us_entity", label: t("segmentUs") },
                { value: "sells_from_tr", label: t("segmentTr") },
              ].map((o) => (
                <label key={o.value} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xs border border-field bg-paper px-3.5 py-2.5 text-small leading-snug transition-colors duration-200 hover:border-navy/70 has-[:checked]:border-navy has-[:checked]:bg-sand has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-navy">
                  <input type="radio" name="segment" value={o.value} defaultChecked={segment === o.value} className="size-4 shrink-0 accent-navy focus-visible:outline-none" />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {paymentLabels && (
            <div>
              <Label htmlFor={fieldId("paymentDays")} className="text-small leading-snug font-medium text-navy">
                {t("paymentDays")}
              </Label>
              <select
                id={fieldId("paymentDays")}
                name="paymentDays"
                defaultValue={paymentDays ?? ""}
                className="mt-2.5 h-12 w-full rounded-xs border border-field bg-paper px-3 text-base text-navy transition-colors duration-200 hover:border-navy/70 focus-visible:border-navy"
              >
                <option value="">{t("paymentDaysNone")}</option>
                {PAYMENT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {paymentLabels[o.key]}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Field id={fieldId("message")} label={t("message")} error={errorText("message")} hint={t("noTaxIds")}>
            <Textarea id={fieldId("message")} name="message" rows={4} maxLength={2000} aria-invalid={!!errors.message} aria-describedby={describedBy("message", `${fieldId("message")}-hint`)} />
          </Field>
        </>
      )}

      <div>
        <label className="flex cursor-pointer items-start gap-3 text-caption text-mist">
          <input
            type="checkbox"
            name="consent"
            required
            aria-invalid={!!errors.consent}
            aria-describedby={errors.consent ? `${fieldId("consent")}-error` : undefined}
            className="mt-0.5 size-5 shrink-0 accent-navy"
          />
          <span>
            {t.rich("consent", {
              link: (chunks) => (
                <Link href="/privacy" className="link" target="_blank">
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </label>
        {errors.consent && (
          <p id={`${fieldId("consent")}-error`} className="mt-2 text-caption text-oxblood">
            {errorText("consent")}
          </p>
        )}
      </div>

      {!full && <p className="text-caption text-mist-soft">{t("noTaxIds")}</p>}

      <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
        {pending ? t("sending") : (submitLabel ?? t("submit"))}
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error: string | null;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-small font-medium text-navy">
        {label}
      </Label>
      <div className="mt-2.5">{children}</div>
      {hint && (
        <p id={`${id}-hint`} className="mt-2 text-caption text-mist-soft">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-2 text-caption text-oxblood">
          {error}
        </p>
      )}
    </div>
  );
}
