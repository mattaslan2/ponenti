import "server-only";
import { z } from "zod";
import { UTM_KEYS } from "@/lib/utm";

export const FORM_TYPES = ["contact", "risk_test", "calc_cash", "calc_5472", "prospect"] as const;
export const PAYMENT_DAYS = ["0-29", "30-45", "46-60", "61-90", "90+"] as const;
export const SEGMENTS = ["us_entity", "sells_from_tr"] as const;
export const RISK_LEVELS = ["low", "medium", "high"] as const;

/** Empty form fields arrive as "", which must mean "not provided". */
const blank = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) => z.preprocess(blank, z.enum(values).optional());

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const leadSchema = z.object({
  formType: z.enum(FORM_TYPES),
  locale: z.enum(["tr", "en"]),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().max(200).pipe(z.email()),
  company: z.string().trim().min(1).max(160),
  phone: z
    .string()
    .trim()
    .max(40)
    .regex(/^[+0-9 ()\-.]*$/)
    .optional()
    .transform((v) => (v ? v : undefined)),
  segment: optionalEnum(SEGMENTS),
  paymentDays: optionalEnum(PAYMENT_DAYS),
  riskLevel: optionalEnum(RISK_LEVELS),
  message: optionalText(2000),
  context: optionalText(4000),
  firm: z.preprocess(blank, z.string().max(80).regex(/^[a-z0-9-]+$/).optional()),
  consent: z.literal("on"),
  ...Object.fromEntries(UTM_KEYS.map((k) => [k, optionalText(200)])),
});

export type LeadInput = z.infer<typeof leadSchema>;

export type Lead = LeadInput & {
  utm: Partial<Record<(typeof UTM_KEYS)[number], string>>;
  consentAt: string;
};

export type FieldErrorCode = "required" | "email" | "tooLong" | "phone" | "consent" | "taxId";

/** Maps Zod issues to the short codes the form translates. */
export function toFieldErrors(issues: z.core.$ZodIssue[]): Record<string, FieldErrorCode> {
  const out: Record<string, FieldErrorCode> = {};
  for (const issue of issues) {
    const field = String(issue.path[0] ?? "form");
    if (out[field]) continue;
    if (field === "consent") out[field] = "consent";
    else if (field === "email" && issue.code !== "too_big") out[field] = "email";
    else if (field === "phone" && issue.code !== "too_big") out[field] = "phone";
    else if (issue.code === "too_big") out[field] = "tooLong";
    else out[field] = "required";
  }
  return out;
}

/** The site never collects tax IDs. Flag EIN- or SSN-shaped numbers in free text. */
export function containsTaxId(text?: string): boolean {
  if (!text) return false;
  return /\b\d{2}-\d{7}\b/.test(text) || /\b\d{3}-\d{2}-\d{4}\b/.test(text);
}

/* Context payloads sent by the risk test and calculators */

export const riskContextSchema = z.object({
  level: z.enum(RISK_LEVELS),
  top: z.array(z.string().max(40)).max(3),
  answers: z.record(z.string().max(20), z.string().max(10)).optional(),
});

export const cashContextSchema = z.object({
  sales: z.number().nonnegative().max(1e12),
  current: z.number().nonnegative().max(1000),
  target: z.number().nonnegative().max(1000),
  result: z.number().nonnegative().max(1e12),
});

export const form5472ContextSchema = z.object({
  years: z.number().int().nonnegative().max(50),
  result: z.number().nonnegative().max(1e10),
});
