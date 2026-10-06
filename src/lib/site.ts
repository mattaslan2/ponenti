/**
 * COMPANY FACTS
 * ---------------------------------------------------------------------------
 * Used by the footer, About page, legal pages (through <Company field="..."/>)
 * and JSON-LD. Every value created with R() renders on the site as a visible,
 * marked "[REPLACE WITH REAL: ...]" placeholder until you replace it.
 * Run `npm run placeholders` to list everything still open.
 *
 * Trust rules: use a real street address (never a virtual office or registered
 * agent), a real phone and the exact legal entity name.
 */
export const REPLACE_PREFIX = "[REPLACE WITH REAL";
const R = (what: string) => `${REPLACE_PREFIX}: ${what}]`;

export const site = {
  name: "Ponenti",
  legalName: R("legal entity name, e.g. Ponenti LLC"),
  address: R("street address, city, state ZIP (a real office, never a virtual office)"),
  phone: R("business phone with country code"),
  email: R("contact email on your domain"),
  founder: {
    // [confirm] display name per language
    name: { tr: "Hikmet (Matt) Aslan", en: "Matt Aslan" },
    // Put the photo in /public/images and set the path, e.g. "/images/founder.jpg" (square, 800x800 or larger).
    photo: R("founder photo, square, at /public/images/founder.jpg"),
    linkedin: R("founder LinkedIn URL"),
  },
  areaServed: ["US", "TR"],
  /**
   * Photography: real architectural photography only (no stock handshakes or
   * globes). Nothing renders until you add a licensed file under /public/images
   * and fill the entry, e.g.
   * bosphorus: { src: "/images/bosphorus-dawn.jpg", width: 2400, height: 1500,
   *   alt: { tr: "Şafakta Boğaz", en: "The Bosphorus at dawn" }, credit: "Photo: ..." }
   */
  photos: {
    bosphorus: null as SitePhoto | null, // Bosphorus at dawn, 2400x1500+, About page
    savannah: null as SitePhoto | null, // Savannah port cranes, 2400x1500+, Services page
    ledger: null as SitePhoto | null, // ledger and paper texture, 2000x1200+, Home weekly-report band
  },
};

export type SitePhoto = { src: string; width: number; height: number; alt: { tr: string; en: string }; credit?: string };

export type CompanyField = "legalName" | "address" | "phone" | "email";

export function isPlaceholder(value?: string | null): boolean {
  return !value || value.startsWith(REPLACE_PREFIX);
}

/** Digits-only phone for tel: links, or null while it is still a placeholder. */
export function telHref(phone: string): string | null {
  if (isPlaceholder(phone)) return null;
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
}
