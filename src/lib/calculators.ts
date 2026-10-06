import { pricing } from "./pricing";
import type { PaymentDaysRange } from "./risk-test";

/** Cash freed = annual US sales / 365 x (current payment days - target days). */
export function cashFreed(annualSales: number, currentDays: number, targetDays: number): number {
  if (!(annualSales > 0) || !(currentDays > targetDays) || targetDays < 0) return 0;
  return (annualSales / 365) * (currentDays - targetDays);
}

/** Initial Form 5472 exposure = missing years x $25,000 (before continuation penalties). */
export function form5472Exposure(missingYears: number): number {
  return Math.max(0, Math.floor(missingYears)) * pricing.form5472Penalty;
}

export function paymentDaysRange(days: number): PaymentDaysRange {
  if (days < 30) return "0-29";
  if (days <= 45) return "30-45";
  if (days <= 60) return "46-60";
  if (days <= 90) return "61-90";
  return "90+";
}
