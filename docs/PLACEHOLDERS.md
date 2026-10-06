# Placeholders: every [REPLACE WITH REAL] and [confirm]

Run `npm run placeholders` for the live list with file and line numbers. At launch, `npm run placeholders -- --strict` must pass (it fails while any `[REPLACE WITH REAL]` remains).

How each type behaves on the site:

| Marker | On the live site | Why |
|---|---|---|
| `[REPLACE WITH REAL]` business fact | Shows as a visible dashed marker | Required facts (footer, legal pages). The gap must be obvious, never invented. |
| `[REPLACE WITH REAL]` proof slot | Hidden. Shows only with `NEXT_PUBLIC_SHOW_PLACEHOLDERS=true` (use on Preview) | No invented testimonials, logos, counts, case studies or results. |
| `[SHOW ONLY AFTER E&O CONFIRMS]` | Hidden. Shows only with `NEXT_PUBLIC_EO_CONFIRMED=true` | The penalty promise needs written E&O confirmation first. |
| `[confirm]` copy | Renders normally. Outlined only with `NEXT_PUBLIC_SHOW_PLACEHOLDERS=true` | Drafted or copied text you should approve. |
| `[confirm with counsel]` | Visible note inside the legal pages | Legal drafts need a lawyer's review. |

## 1. Launch blockers: business facts (visible markers)

| # | Item | Where to fill | Shows on |
|---|---|---|---|
| 1 | Legal entity name (exact) | `src/lib/site.ts` → `legalName` | Footer, copyright, legal pages, JSON-LD |
| 2 | Street address of a real office (never a virtual office or registered agent) | `site.ts` → `address` | Footer, legal pages, JSON-LD |
| 3 | Business phone with country code | `site.ts` → `phone` | Footer, legal pages |
| 4 | Contact email on your domain | `site.ts` → `email` | Footer, legal pages |
| 5 | Founder photo, square, 800 x 800 px or larger | Save as `public/images/founder.jpg`, then set `site.ts` → `founder.photo` to `"/images/founder.jpg"` | Home, About, footer |
| 6 | Founder LinkedIn URL | `site.ts` → `founder.linkedin` | Home, About, footer |
| 7 | WhatsApp number | Vercel env `NEXT_PUBLIC_WHATSAPP_NUMBER` (digits, international) | Contact page marker; buttons fall back to the contact page until set |
| 8 | Cal.com booking link | Vercel env `NEXT_PUBLIC_CAL_LINK` | Contact page shows "calendar not connected" until set |

## 2. Launch blockers: legal pages (visible markers)

| # | Item | File |
|---|---|---|
| 9 | Türkiye-based representative for VERBIS: name and address (2 places) | `src/content/legal/{tr,en}/privacy.mdx` |
| 10 | Business email and calendar provider, and its location (internal alerts land there) | `privacy.mdx` |
| 11 | Retention periods at Resend, PostHog, Sentry and Vercel | `privacy.mdx` |
| 12 | KEP address, or delete the line | `privacy.mdx` |
| 13 | Liability cap amount | `src/content/legal/{tr,en}/terms.mdx` |

## 3. Hidden until real: proof slots

Location: `ProofSlots` in `src/components/home/sections.tsx`. Pass real content as children of `<ReplaceWithReal>`.

- Testimonial from a named client, with written permission
- Client logos, with written permission
- Case study with real, verifiable results

The site states no client counts and no results anywhere. Add numbers only when they are real and you can back them up.

## 4. Hidden until E&O confirms

- Penalty promise (home page): "If a filing we own is late, we pay the penalty, up to $25,000 a year per client." / "Sorumluluğumuzdaki bir beyanname geç kalırsa cezayı biz öderiz; müşteri başına yıllık üst sınır $25.000."
- Turn on with `NEXT_PUBLIC_EO_CONFIRMED=true` only after the carrier confirms coverage in writing. The cap comes from `src/lib/pricing.ts` (`penaltyPromiseCap`).

## 5. Photography (optional, nothing renders until added)

Real architectural photography only. No stock handshakes or globes. Set each entry in `site.ts` → `photos` with `src`, size, alt text in both languages and a credit.

| Slot | Subject | Size | Where |
|---|---|---|---|
| `bosphorus` | The Bosphorus at dawn | 2400 x 1500 or larger | About page, under the header |
| `savannah` | Port of Savannah cranes | 2400 x 1500 or larger | Services page, under the header |
| `ledger` | Ledger and paper texture | 2000 x 1200 or larger | Home, behind the weekly-report section |

## 6. [confirm] copy to approve

| Item | Current text | Where |
|---|---|---|
| Founder display name | TR "Hikmet (Matt) Aslan", EN "Matt Aslan" | `site.ts` → `founder.name` |
| Hero trust line | "Kurucu: eski UPS finans analisti ve kıdemli müdür" / "Founder: former UPS financial analyst and senior manager" | `messages` → `home.hero.trustFounder` |
| Bio | Your draft from the brief, TR and EN | `home.founder.body`, `about.bio` |
| Founder story (3 short paragraphs, first person) | Drafted from your background and plan v8 | `about.founderP1-3` |
| Review and e-file partner | "anlaşmalı bir ABD muhasebe firması" / "a US accounting firm under contract" (the word CPA is deliberately not used) | `about.data3` |
| Full-desk onboarding | $5,000 (plan v8; the brief listed only the monthly price) | `src/lib/pricing.ts` → `fullDesk.onboarding` |
| Check, plan and desk inclusions, capacities, terms | Copied from Ponenti plan v8 (Oct 5, 2026) | `messages` → `services.*` |
| First 10 business days timeline | Drafted from v8's 10-day check delivery | `about.step1-5` |
| "Your data" commitments | 2FA on every system, encrypted portal (being prepared), written security plan, Section 7216 consent, AI only on no-training business plans | `home.data.*`. The plan and the consent form must exist before launch. |
| Collections hours | Calls 8:00-16:00 US Eastern | Facts band, cash desk, FAQ |
| Sample report figures | Invented; always labeled "Örnek veriler / Sample data" | `src/components/report/sample-report.tsx` |

## 7. Legal [confirm with counsel]

From the legal drafts (both languages):

- Draft banner at the top of each legal page (remove after review)
- VERBIS registration and the Türkiye representative
- Provider locations (Attio contracts as Attio Limited, UK)
- Cross-border transfer basis under amended KVKK Article 9: standard contracts not yet signed; interim reliance on Article 9(6)(a)/(b)
- Lead retention (24 months after last contact) and consent-record retention
- The Do Not Track line
- A separate notice for clients (the site policy covers visitors and leads)
- Liability cap, governing law (Georgia, USA), courts, and which language prevails

## 8. Prospect pages

- `src/content/prospects/ornek-firma.json`: a labeled sample page at `/tr/ozel/ornek-firma`. Delete it before outreach, or keep it as a demo (it is noindex).
- `src/content/prospects/_template.json`: copy to `{firm-slug}.json` for each prospect. Every observation must come from public import records, with a date and a source. The optional `hs` field (the firm's main product, 4 or 6 digits) adds a live US market snapshot from Census data; delete the line if you don't know the code.

## 9. Time-sensitive facts to re-check

| Fact | Source | Re-check |
|---|---|---|
| CBP can void importer numbers with registered-agent, P.O. box or business-center addresses on Form 5106 since Sep 18, 2026 | Federal Register, Aug 19, 2026 | When CBP publishes more |
| EO 14411: DHS steps due within 180 days (about Nov 30, 2026); foreign-importer rules "promptly" | Federal Register, Jun 10, 2026 | Weekly until the rules publish |
| CBP holds IEEPA refunds for filers with no ACH account in ACE | Federal Register, Oct 5, 2026 | Monthly |
| State sales-tax thresholds table | State revenue department pages | Each January |
