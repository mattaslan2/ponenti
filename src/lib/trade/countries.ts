import data from "@/data/trade/countries.json";

/**
 * Trading partners as the Census Bureau codes them (4 digits; USITC uses the same
 * codes), with ISO codes for URLs and localized names. Regional groupings
 * (EU, OECD, "Asia") are excluded.
 */
export type Country = {
  code: string;
  iso2: string;
  name: string;
  imports: number;
};

export const COUNTRIES: Country[] = data.countries;
export const TURKIYE: Country = COUNTRIES.find((c) => c.iso2 === "TR")!;

const byIso = new Map(COUNTRIES.map((c) => [c.iso2, c]));
const byCode = new Map(COUNTRIES.map((c) => [c.code, c]));

export const countryByIso = (iso2: string | undefined | null) => (iso2 ? byIso.get(iso2.toUpperCase()) : undefined);
export const countryByCode = (code: string) => byCode.get(code);

const displayNames = new Map<string, Intl.DisplayNames>();
export function countryName(country: Pick<Country, "iso2" | "name">, locale: string): string {
  if (country.iso2 === "TR") return "Türkiye";
  let dn = displayNames.get(locale);
  if (!dn) {
    dn = new Intl.DisplayNames([locale], { type: "region", fallback: "none" });
    displayNames.set(locale, dn);
  }
  return dn.of(country.iso2) ?? country.name;
}
