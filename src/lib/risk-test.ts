/**
 * Risk test: 10 questions, yes/no and ranges only (never tax IDs or documents).
 * Scoring is transparent and informational. Copy lives in messages (riskTest.*).
 */
import type { SourceKey } from "./sources";

export type AnswerValue = "yes" | "no" | "unsure" | "na" | "r0" | "r1" | "r2" | "r3" | "r4";

export type QuestionId =
  | "usEntity"
  | "ior"
  | "iorAddress"
  | "brokerCheck"
  | "form5472"
  | "salesStates"
  | "taxRegs"
  | "paymentDays"
  | "followUp"
  | "refundBank";

export const questions: { id: QuestionId; options: AnswerValue[]; ranged?: boolean }[] = [
  { id: "usEntity", options: ["yes", "no"] },
  { id: "ior", options: ["yes", "no", "unsure"] },
  { id: "iorAddress", options: ["yes", "no", "unsure", "na"] },
  { id: "brokerCheck", options: ["yes", "no", "unsure", "na"] },
  { id: "form5472", options: ["yes", "no", "unsure", "na"] },
  { id: "salesStates", options: ["r0", "r1", "r2", "r3"], ranged: true },
  { id: "taxRegs", options: ["r0", "r1", "r2", "r3", "unsure"], ranged: true },
  { id: "paymentDays", options: ["r0", "r1", "r2", "r3", "r4"], ranged: true },
  { id: "followUp", options: ["yes", "no"] },
  { id: "refundBank", options: ["yes", "no", "unsure", "na"] },
];

export type RiskId =
  | "form5472Missing"
  | "form5472Unknown"
  | "iorAddress"
  | "iorUnknown"
  | "brokerCheck"
  | "salesTaxGap"
  | "salesTaxUnknown"
  | "paymentDays"
  | "noFollowUp"
  | "refundBank"
  | "refundUnknown";

/** Official source for each risk explanation (shown as a link in the result). */
export const riskSources: Partial<Record<RiskId, SourceKey>> = {
  form5472Missing: "irsInternationalPenalties",
  form5472Unknown: "irs5472",
  iorAddress: "frImporterData",
  iorUnknown: "frImporterData",
  brokerCheck: "frEo14411",
  salesTaxGap: "scotusWayfair",
  salesTaxUnknown: "scotusWayfair",
  refundBank: "frIeepaRefundsHeld",
  refundUnknown: "frElectronicRefunds",
};

export type RiskLevel = "low" | "medium" | "high";
export type Segment = "us_entity" | "sells_from_tr";
export type PaymentDaysRange = "0-29" | "30-45" | "46-60" | "61-90" | "90+";

export type Answers = Partial<Record<QuestionId, AnswerValue>>;

export type RiskResult = {
  level: RiskLevel;
  score: number;
  top: RiskId[];
  segment: Segment;
  paymentDays?: PaymentDaysRange;
};

const rangeIndex = (v?: AnswerValue) => (v && v.startsWith("r") ? Number(v.slice(1)) : -1);

const paymentRanges: PaymentDaysRange[] = ["0-29", "30-45", "46-60", "61-90", "90+"];

export function scoreRiskTest(a: Answers): RiskResult {
  const found = new Map<RiskId, number>();
  const add = (id: RiskId, weight: number) => found.set(id, Math.max(found.get(id) ?? 0, weight));
  const importsThemselves = a.ior !== "no";

  if (a.form5472 === "no") add("form5472Missing", 10);
  else if (a.form5472 === "unsure") add("form5472Unknown", 5);

  if (a.ior === "unsure") add("iorUnknown", 4);
  if (importsThemselves) {
    if (a.iorAddress === "yes") add("iorAddress", 9);
    else if (a.iorAddress === "unsure") add("iorUnknown", 4);
    if (a.brokerCheck === "no" || a.brokerCheck === "unsure") add("brokerCheck", 4);
    if (a.refundBank === "no") add("refundBank", 6);
    else if (a.refundBank === "unsure") add("refundUnknown", 3);
  }

  const sold = rangeIndex(a.salesStates);
  if (sold > 0) {
    if (a.taxRegs === "unsure") add("salesTaxUnknown", 3);
    else if (rangeIndex(a.taxRegs) < sold) add("salesTaxGap", 6);
  }

  const pd = rangeIndex(a.paymentDays);
  if (pd >= 2) add("paymentDays", pd === 2 ? 3 : pd === 3 ? 5 : 7);
  if (a.followUp === "no") add("noFollowUp", 3);

  const score = [...found.values()].reduce((sum, w) => sum + w, 0);
  const critical = found.has("form5472Missing") || found.has("iorAddress");
  const level: RiskLevel = critical || score >= 12 ? "high" : score >= 5 ? "medium" : "low";
  const top = [...found.entries()].sort((x, y) => y[1] - x[1]).slice(0, 3).map(([id]) => id);

  return {
    level,
    score,
    top,
    segment: a.usEntity === "yes" ? "us_entity" : "sells_from_tr",
    paymentDays: pd >= 0 ? paymentRanges[pd] : undefined,
  };
}
