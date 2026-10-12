"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/routing";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { track } from "@/lib/analytics";
import { formatNumber } from "@/lib/format";

/** Fires calculator_used once per calculator, after the visitor changes an input. */
export function useUsedOnce(name: string, deps: unknown[]) {
  const first = useRef(true);
  const sent = useRef(false);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (sent.current) return;
    const id = window.setTimeout(() => {
      sent.current = true;
      track("calculator_used", { calculator: name });
    }, 800);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

type FieldBase = {
  id: string;
  label: string;
  /** One short line under the label (what to include). */
  hint?: string;
  locale: Locale;
  suffix?: string;
  max: number;
  placeholder?: string;
};

type NumberFieldProps = FieldBase &
  (
    | { allowEmpty?: false; value: number; onChange: (n: number) => void }
    | { allowEmpty: true; value: number | null; onChange: (n: number | null) => void }
  );

/**
 * A whole-number field: digits only while typing, grouped (1.500.000) once the
 * visitor leaves it. With allowEmpty, clearing it means "not given" (null).
 */
export function NumberField(props: NumberFieldProps) {
  const { id, label, hint, locale, suffix, max, placeholder } = props;
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(props.value === null ? "" : String(props.value));
  const shown = props.value === null ? "" : formatNumber(props.value, locale);
  const emit = (digits: string) => {
    if (props.allowEmpty) props.onChange(digits === "" ? null : Math.min(max, Number(digits)));
    else props.onChange(Math.min(max, Number(digits || 0)));
  };
  return (
    <div>
      <Label htmlFor={id} className="text-small leading-snug font-medium text-navy">
        {label}
      </Label>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-caption text-mist-soft">
          {hint}
        </p>
      )}
      <div className="relative mt-2.5">
        <Input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder}
          aria-describedby={hint ? `${id}-hint` : undefined}
          value={focused ? draft : shown}
          onFocus={() => {
            setDraft(props.value === null ? "" : String(props.value));
            setFocused(true);
          }}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, 13);
            setDraft(digits);
            emit(digits);
          }}
          className="figures"
        />
        {suffix && <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-small text-mist-soft">{suffix}</span>}
      </div>
    </div>
  );
}
