import "server-only";
import { Resend } from "resend";
import { getTranslations } from "next-intl/server";
import { site } from "@/lib/site";
import { sources } from "@/lib/sources";
import { riskSources, type RiskId } from "@/lib/risk-test";
import { calUrl } from "@/lib/links";
import { formatUsd, formatUsdRounded } from "@/lib/format";
import { getPathname } from "@/i18n/navigation";
import { getCountryOverview, getProductSnapshot } from "@/lib/trade/analysis";
import { TURKIYE, countryByIso, countryName } from "@/lib/trade/countries";
import { pct, usdCompact, windowLabel } from "@/lib/trade/format";
import { siteUrl } from "@/lib/seo";
import { overviewHref, productHref } from "@/lib/trade/links";
import { cashContextSchema, form5472ContextSchema, riskContextSchema, tradeContextSchema, type Lead } from "./schema";

/**
 * Resend: a confirmation to the visitor in their language and an internal
 * alert. Needs RESEND_API_KEY, LEADS_FROM_EMAIL (a verified sender on your
 * domain) and LEADS_ALERT_EMAIL (where alerts go).
 */
const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.LEADS_FROM_EMAIL);
}

function parseContext(lead: Lead): unknown {
  try {
    return lead.context ? JSON.parse(lead.context) : null;
  } catch {
    return null;
  }
}

/** Result lines for risk-test and calculator leads, in the visitor's language. */
export async function resultLines(lead: Lead): Promise<string[]> {
  const t = await getTranslations({ locale: lead.locale });
  const ctx = parseContext(lead);
  const lines: string[] = [];
  if (lead.formType === "risk_test") {
    const r = riskContextSchema.safeParse(ctx);
    if (r.success) {
      lines.push(t("emails.riskIntro", { level: t(`riskTest.result.${r.data.level}`) }));
      if (r.data.top.length) {
        lines.push(t("emails.riskTop"));
        for (const id of r.data.top) {
          if (!t.has(`riskTest.risks.${id}.title`)) continue;
          const src = riskSources[id as RiskId];
          lines.push(`- ${t(`riskTest.risks.${id}.title`)}: ${t(`riskTest.risks.${id}.body`)}${src ? ` (${sources[src]})` : ""}`);
        }
      }
    }
  } else if (lead.formType === "calc_cash") {
    const r = cashContextSchema.safeParse(ctx);
    if (r.success) {
      lines.push(
        t("emails.cashResult", {
          sales: formatUsd(r.data.sales, lead.locale),
          current: r.data.current,
          target: r.data.target,
          result: formatUsdRounded(r.data.result, lead.locale),
        }),
      );
    }
  } else if (lead.formType === "trade_data") {
    const r = tradeContextSchema.safeParse(ctx);
    if (r.success) lines.push(...(await tradeLines(r.data, lead.locale)));
  } else if (lead.formType === "calc_5472") {
    const r = form5472ContextSchema.safeParse(ctx);
    if (r.success) {
      lines.push(t("emails.form5472Result", { years: r.data.years, result: formatUsd(r.data.result, lead.locale) }));
      lines.push(sources.irsInternationalPenalties);
    }
  }
  return lines;
}

export async function sendLeadEmails(lead: Lead, internalSummary: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.LEADS_FROM_EMAIL;
  const alertTo = process.env.LEADS_ALERT_EMAIL;
  if (!apiKey || !from) return { confirmation: false, alert: false };

  const resend = new Resend(apiKey);
  const t = await getTranslations({ locale: lead.locale, namespace: "emails" });
  const booking = calUrl();
  const founder = site.founder.name[lead.locale];

  const paragraphs = [
    t("greeting", { name: lead.name }),
    t("thanks"),
    ...(await resultLines(lead)),
    t("reply"),
    ...(booking ? [t("book", { url: booking })] : []),
    t("noTaxIds"),
    t("informational"),
    `${t("signoff")}\n${founder}\nPonenti`,
  ];
  const text = paragraphs.join("\n\n");
  const html = `<div style="font-family:Georgia,'Times New Roman',serif;color:#0e1a2b;font-size:16px;line-height:1.6;max-width:560px">${paragraphs
    .map((p) => `<p style="margin:0 0 16px">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("")}</div>`;

  const [confirmation, alert] = await Promise.allSettled([
    resend.emails.send({ from, to: lead.email, subject: t("confirmSubject"), text, html, ...(alertTo ? { replyTo: alertTo } : {}) }),
    alertTo
      ? resend.emails.send({
          from,
          to: alertTo,
          subject: `[Ponenti lead] ${lead.formType} / ${lead.company} / ${lead.locale.toUpperCase()}`,
          text: internalSummary,
          replyTo: lead.email,
        })
      : Promise.resolve(null),
  ]);

  const ok = (r: PromiseSettledResult<unknown>) =>
    r.status === "fulfilled" && r.value !== null && !(r.value as { error?: unknown }).error;
  if (confirmation.status === "rejected" || (confirmation.status === "fulfilled" && (confirmation.value as { error?: unknown })?.error)) {
    console.error("[resend] confirmation failed", confirmation.status === "rejected" ? confirmation.reason : (confirmation.value as { error?: unknown }).error);
  }
  if (alert.status === "rejected" || (alert.status === "fulfilled" && (alert.value as { error?: unknown } | null)?.error)) {
    console.error("[resend] alert failed", alert.status === "rejected" ? alert.reason : (alert.value as { error?: unknown }).error);
  }
  return { confirmation: ok(confirmation), alert: ok(alert) };
}

/** Trade-data summary for the visitor's email, recomputed on the server from the monthly Census snapshot. */
async function tradeLines(ctx: { hs?: string; country: string }, locale: "tr" | "en"): Promise<string[]> {
  const t = await getTranslations({ locale, namespace: "emails" });
  const country = countryByIso(ctx.country) ?? TURKIYE;
  const name = countryName(country, locale);
  const url = siteUrl() + getPathname({ locale, href: ctx.hs ? productHref(ctx.hs, country.iso2) : overviewHref(country.iso2) });
  const growthText = (g: number | null) => (g === null ? "–" : pct(g, locale, { signed: true }));
  try {
    if (ctx.hs) {
      const snap = await getProductSnapshot(ctx.hs, country.code, locale);
      if (!snap) return [t("tradeLink", { url })];
      const label = snap.label.length > 90 ? `${snap.label.slice(0, 87)}…` : snap.label;
      return [
        t("tradeProduct", {
          code: snap.hs.code,
          label,
          window: windowLabel(snap.windows.cur.first, snap.windows.cur.last, locale),
          world: usdCompact(snap.worldValue, locale),
          country: name,
          value: usdCompact(snap.value, locale),
          growth: growthText(snap.growth),
          share: pct(snap.share, locale),
        }),
        ...(snap.rank ? [t("tradeRank", { country: name, rank: snap.rank })] : []),
        t("tradeLink", { url }),
        t("tradeSource"),
      ];
    }
    const o = await getCountryOverview(country.code, locale);
    return [
      t("tradeCountry", {
        country: name,
        window: windowLabel(o.windows.cur.first, o.windows.cur.last, locale),
        value: usdCompact(o.value, locale),
        growth: growthText(o.growth),
        share: pct(o.share, locale),
      }),
      t("tradeLink", { url }),
      t("tradeSource"),
    ];
  } catch {
    return [t("tradeLink", { url })];
  }
}
