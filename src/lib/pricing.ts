/**
 * Every price on the site comes from here (USD). Copy references these values
 * through placeholders, so a change here updates all pages, JSON-LD and emails.
 * Source: Ponenti plan v8 (Oct 5, 2026).
 */
export const pricing = {
  check: 2500,
  checkCreditDays: 30,
  plans: {
    essentials: 500,
    standard: 850,
    complete: 1250,
  },
  cashDesk: { monthly: 1500, onboarding: 1500, invoices: 150 },
  orderDesk: { monthly: 2000, onboarding: 2500, orders: 120 },
  // [confirm] full-desk onboarding ($5,000 in plan v8)
  fullDesk: { monthly: 4750, onboarding: 5000 },
  hiring: { assist: 3000, full: 7500 },
  extraPer100: 500,
  penaltyPromiseCap: 25000,
  form5472Penalty: 25000,
  // [confirm] Food and packaging add-ons, shown as "from" prices (Oct 15, 2026): other vendors'
  // listed prices from the compliance services research, not plan v8. The engagement letter sets the fee.
  food: {
    /** FSVP program setup for a US importer. */
    fsvp: 8000,
    /** Food-contact file, per product. */
    foodContact: 1495,
    /** FCE registration with the first process filing (SID). */
    canning: 790,
    /** Each further process filing. */
    canningExtra: 195,
  },
} as const;
