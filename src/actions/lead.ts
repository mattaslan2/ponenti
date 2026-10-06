"use server";

import { checkBotId } from "botid/server";
import * as Sentry from "@sentry/nextjs";
import { UTM_KEYS } from "@/lib/utm";
import { attioConfigured, pushLeadToAttio } from "@/lib/leads/attio";
import { emailConfigured, resultLines, sendLeadEmails } from "@/lib/leads/email";
import { containsTaxId, leadSchema, toFieldErrors, type FieldErrorCode, type Lead } from "@/lib/leads/schema";

export type LeadState =
  | { status: "idle" }
  | { status: "success"; emailed: boolean }
  | {
      status: "error";
      code: "validation" | "bot" | "not_configured" | "server";
      fieldErrors?: Record<string, FieldErrorCode>;
    };

const MIN_FILL_MS = 1500;

export async function submitLead(_prev: LeadState, formData: FormData): Promise<LeadState> {
  // 1. Honeypot: a hidden field people never fill. Bots get a quiet "success".
  if (String(formData.get("website") ?? "").trim() !== "") return { status: "success", emailed: false };

  // 2. Validation first, so a person who submits too early still sees what to fix.
  const raw = Object.fromEntries(
    [...formData.entries()].filter(([k]) => !k.startsWith("$ACTION")).map(([k, v]) => [k, typeof v === "string" ? v : ""]),
  );
  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", code: "validation", fieldErrors: toFieldErrors(parsed.error.issues) };
  if (containsTaxId(parsed.data.message)) return { status: "error", code: "validation", fieldErrors: { message: "taxId" } };

  // 3. A complete form filled faster than a person can type is a bot.
  const startedAt = Number(formData.get("startedAt"));
  if (Number.isFinite(startedAt) && startedAt > 0 && Date.now() - startedAt < MIN_FILL_MS) return { status: "success", emailed: false };

  // 4. Vercel BotID (invisible check).
  if (await looksLikeBot()) return { status: "error", code: "bot" };

  const utm = Object.fromEntries(UTM_KEYS.map((k) => [k, (parsed.data as Record<string, string | undefined>)[k]]).filter(([, v]) => v));
  const lead: Lead = { ...parsed.data, utm, consentAt: new Date().toISOString() };

  if (!attioConfigured() && !emailConfigured()) {
    console.warn("[lead] Neither ATTIO_API_KEY nor RESEND_API_KEY/LEADS_FROM_EMAIL is set; lead not stored.", {
      formType: lead.formType,
      locale: lead.locale,
    });
    return { status: "error", code: "not_configured" };
  }

  const summary = await leadSummary(lead);
  const [crm, mail] = await Promise.allSettled([
    attioConfigured() ? pushLeadToAttio(lead, { title: `Website: ${lead.formType} (${lead.locale})`, markdown: summary }) : Promise.resolve(null),
    emailConfigured() ? sendLeadEmails(lead, summary) : Promise.resolve({ confirmation: false, alert: false }),
  ]);

  if (crm.status === "rejected") {
    console.error("[lead] Attio failed", crm.reason);
    Sentry.captureException(crm.reason, { tags: { area: "attio" } });
  }
  if (mail.status === "rejected") {
    console.error("[lead] Resend failed", mail.reason);
    Sentry.captureException(mail.reason, { tags: { area: "resend" } });
  }

  const stored = crm.status === "fulfilled" && crm.value !== null;
  const alerted = mail.status === "fulfilled" && mail.value.alert;
  const emailed = mail.status === "fulfilled" && mail.value.confirmation;

  // Success only if the lead landed somewhere we will see it.
  if (!stored && !alerted) return { status: "error", code: "server" };
  return { status: "success", emailed };
}

/**
 * BotID only works on Vercel. If the check itself fails (misconfiguration, an
 * outage), the submission goes through: the honeypot and fill-time checks still
 * apply, and losing a real lead costs more than one spam message.
 */
async function looksLikeBot(): Promise<boolean> {
  if (process.env.VERCEL !== "1") return false;
  try {
    return (await checkBotId()).isBot;
  } catch (error) {
    console.error("[botid] check failed; allowing the submission", error);
    Sentry.captureException(error, { tags: { area: "botid" } });
    return false;
  }
}

async function leadSummary(lead: Lead): Promise<string> {
  const results = await resultLines(lead);
  const lines = [
    `**Form:** ${lead.formType}`,
    `**Language:** ${lead.locale}`,
    `**Name:** ${lead.name}`,
    `**Email:** ${lead.email}`,
    `**Company:** ${lead.company}`,
    lead.phone ? `**Phone:** ${lead.phone}` : null,
    lead.segment ? `**Segment:** ${lead.segment}` : null,
    lead.riskLevel ? `**Risk level:** ${lead.riskLevel}` : null,
    lead.paymentDays ? `**Payment days:** ${lead.paymentDays}` : null,
    lead.firm ? `**Prospect page:** /ozel/${lead.firm}` : null,
    `**Consent:** yes, ${lead.consentAt}`,
    ...Object.entries(lead.utm).map(([k, v]) => `**${k}:** ${v}`),
    lead.message ? `\n**Message:**\n${lead.message}` : null,
    ...(results.length ? ["\n**Result sent to visitor:**", ...results] : []),
    lead.context ? `\n**Raw context:** ${lead.context}` : null,
  ];
  return lines.filter(Boolean).join("\n");
}
