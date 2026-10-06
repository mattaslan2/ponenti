import "server-only";
import type { Lead } from "./schema";

/**
 * Attio CRM (REST API v2). Creates or updates the Company and the Person, links
 * them, and adds a note with the full submission. The API key never leaves the
 * server. Custom person attributes (see docs/LAUNCH-CHECKLIST.md) are written
 * when they exist; if Attio rejects them, the lead is still saved with standard
 * fields and the note holds everything.
 */
// ATTIO_API_URL is only for local tests against a mock server; leave it unset.
const API = process.env.ATTIO_API_URL || "https://api.attio.com/v2";

class AttioError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`Attio ${status}: ${body.slice(0, 300)}`);
  }
}

async function attio<T>(apiKey: string, path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new AttioError(res.status, await res.text());
  return (await res.json()) as T;
}

type RecordResponse = { data: { id: { record_id: string } } };
type QueryResponse = { data: { id: { record_id: string } }[] };

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "hotmail.com", "outlook.com", "live.com", "msn.com", "yahoo.com",
  "icloud.com", "me.com", "aol.com", "yandex.com", "yandex.com.tr", "mail.ru", "proton.me",
  "protonmail.com", "gmx.com", "gmx.net", "mynet.com", "windowslive.com",
]);

function companyDomain(email: string): string | null {
  const domain = email.split("@")[1]?.toLowerCase();
  return domain && !FREE_EMAIL_DOMAINS.has(domain) ? domain : null;
}

function splitName(full: string) {
  const parts = full.trim().split(/\s+/);
  const last = parts.length > 1 ? parts.pop()! : "";
  return { first_name: parts.join(" "), last_name: last, full_name: full.trim() };
}

/** Attio accepts E.164 only; anything else stays in the note. */
function e164(phone?: string): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/[^\d+]/g, "");
  return /^\+\d{8,15}$/.test(cleaned) ? cleaned : null;
}

export function attioConfigured(): boolean {
  return Boolean(process.env.ATTIO_API_KEY);
}

export async function pushLeadToAttio(lead: Lead, note: { title: string; markdown: string }) {
  const apiKey = process.env.ATTIO_API_KEY;
  if (!apiKey) throw new Error("ATTIO_API_KEY is not set");

  // 1. Company: match by email domain; fall back to the company name for free email domains.
  const domain = companyDomain(lead.email);
  let companyId: string;
  if (domain) {
    const company = await attio<RecordResponse>(apiKey, "/objects/companies/records?matching_attribute=domains", {
      method: "PUT",
      body: JSON.stringify({ data: { values: { domains: [domain], name: lead.company } } }),
    });
    companyId = company.data.id.record_id;
  } else {
    const found = await attio<QueryResponse>(apiKey, "/objects/companies/records/query", {
      method: "POST",
      body: JSON.stringify({ filter: { name: lead.company }, limit: 1 }),
    });
    companyId =
      found.data[0]?.id.record_id ??
      (
        await attio<RecordResponse>(apiKey, "/objects/companies/records", {
          method: "POST",
          body: JSON.stringify({ data: { values: { name: lead.company } } }),
        })
      ).data.id.record_id;
  }

  // 2. Person: match by email.
  const phone = e164(lead.phone);
  const standard: Record<string, unknown> = {
    email_addresses: [lead.email],
    name: splitName(lead.name),
    company: [{ target_object: "companies", target_record_id: companyId }],
    ...(phone ? { phone_numbers: [phone] } : {}),
  };
  const custom: Record<string, unknown> = Object.fromEntries(
    Object.entries({
      ponenti_language: lead.locale,
      ponenti_segment: lead.segment,
      ponenti_risk_level: lead.riskLevel,
      ponenti_payment_days: lead.paymentDays,
      ponenti_form: lead.formType,
      ponenti_consent: true,
      utm_source: lead.utm.utm_source,
      utm_medium: lead.utm.utm_medium,
      utm_campaign: lead.utm.utm_campaign,
      utm_term: lead.utm.utm_term,
      utm_content: lead.utm.utm_content,
    }).filter(([, v]) => v !== undefined && v !== ""),
  );

  const upsertPerson = (values: Record<string, unknown>) =>
    attio<RecordResponse>(apiKey, "/objects/people/records?matching_attribute=email_addresses", {
      method: "PUT",
      body: JSON.stringify({ data: { values } }),
    });

  let personId: string;
  try {
    personId = (await upsertPerson({ ...standard, ...custom })).data.id.record_id;
  } catch (error) {
    if (error instanceof AttioError && error.status === 400) {
      console.warn("[attio] custom attributes rejected; saved standard fields only. Create the attributes in docs/LAUNCH-CHECKLIST.md.", error.body.slice(0, 500));
      personId = (await upsertPerson(standard)).data.id.record_id;
    } else {
      throw error;
    }
  }

  // 3. Note with the full submission.
  await attio(apiKey, "/notes", {
    method: "POST",
    body: JSON.stringify({
      data: { parent_object: "people", parent_record_id: personId, title: note.title, format: "markdown", content: note.markdown },
    }),
  });

  return { personId, companyId };
}
