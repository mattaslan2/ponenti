import type { SourceKey } from "@/lib/sources";

/**
 * The dated rail under the hero: rules that took effect and deadlines ahead, each
 * with its official source. A "rule" reads "in effect" once its date has passed;
 * a "deadline" reads "passed". The browser works out the status from the
 * visitor's clock, so the static page never shows a stale countdown.
 *
 * Re-check when a date passes (docs/PLACEHOLDERS.md section 9): replace past
 * deadlines with the next ones and keep five items.
 */
export type DatedItem = {
  key: "s301" | "address" | "extended" | "eo14411" | "returns";
  /** YYYY-MM-DD, US Eastern calendar date. */
  date: string;
  kind: "rule" | "deadline";
  source: SourceKey;
};

export const DATED_ITEMS: DatedItem[] = [
  { key: "s301", date: "2026-07-24", kind: "rule", source: "frSection301ForcedLabor" },
  { key: "address", date: "2026-09-18", kind: "rule", source: "frImporterData" },
  { key: "extended", date: "2026-10-15", kind: "deadline", source: "irs7004" },
  { key: "eo14411", date: "2026-11-30", kind: "deadline", source: "frEo14411" },
  { key: "returns", date: "2027-04-15", kind: "deadline", source: "irs1120" },
];
