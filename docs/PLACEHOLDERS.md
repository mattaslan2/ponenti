# Placeholders: every [REPLACE WITH REAL] and [confirm]

Run `npm run placeholders` for the live list with file and line numbers. At launch, `npm run placeholders -- --strict` must pass (it fails while any `[REPLACE WITH REAL]` remains).

How each type behaves on the site:

| Marker | On the live site | Why |
|---|---|---|
| `[REPLACE WITH REAL]` business fact | Hidden on every marketing page: the row is simply absent until the fact is real. Shows as a dashed marker inside the legal drafts, and everywhere with `NEXT_PUBLIC_SHOW_PLACEHOLDERS=true` (use on Preview) | A visitor never reads a bracketed marker. A legal draft must still show that it is a draft. Nothing is ever invented. |
| `[REPLACE WITH REAL]` proof slot | Hidden. Shows only with `NEXT_PUBLIC_SHOW_PLACEHOLDERS=true` (use on Preview) | No invented testimonials, logos, counts, case studies or results. |
| `[SHOW ONLY AFTER E&O CONFIRMS]` | Hidden. Shows only with `NEXT_PUBLIC_EO_CONFIRMED=true` | The penalty promise needs written E&O confirmation first. |
| `[confirm]` copy | Renders normally. Outlined only with `NEXT_PUBLIC_SHOW_PLACEHOLDERS=true` | Drafted or copied text you should approve. |
| `[confirm with counsel]` | Visible note inside the legal pages | Legal drafts need a lawyer's review. |

## 1. Launch blockers: business facts

| # | Item | Where to fill | Shows on |
|---|---|---|---|
| 1 | Legal entity name (exact) | `src/lib/site.ts` → `legalName` | Footer, copyright, legal pages, JSON-LD |
| 2 | Street address of a real office (never a virtual office or registered agent) | `site.ts` → `address` | Footer, legal pages, JSON-LD |
| 3 | Business phone with country code | `site.ts` → `phone` | Footer, legal pages |
| 4 | Contact email on your domain | `site.ts` → `email` | Footer, legal pages |
| 5 | Founder photo, square, 800 x 800 px or larger | Save as `public/images/founder.jpg`, then set `site.ts` → `founder.photo` to `"/images/founder.jpg"` | Home, About, footer |
| 6 | Founder LinkedIn URL | `site.ts` → `founder.linkedin` | Home (the proof section gains the founder card and says "four things" instead of "three"), About, footer |
| 7 | WhatsApp number | Vercel env `NEXT_PUBLIC_WHATSAPP_NUMBER` (digits, international) | Until set, no button says WhatsApp: the secondary button reads "Send a message" and opens the form, and the contact page has no WhatsApp block |
| 8 | Cal.com booking link | Vercel env `NEXT_PUBLIC_CAL_LINK` | Until set, the booking block asks the visitor to send the short form and promises two possible times by reply |

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

Support file page (`src/app/[locale]/support-file/page.tsx`, "Fees and scope" section):

- Logos of the Turkish support consultancies you work with, each with written permission. Nothing renders until a consultancy signs and agrees.

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
| Founder line in the proof section | "UPS'te finans analisti, ardından Pazara Giriş Stratejisi Kıdemli Müdürü olarak çalıştı. Her dosyayı inceler." / "Former UPS financial analyst and Senior Manager of Go-to-Market Strategy. Reviews every file." | `messages` → `home.trust.founder.body` (the card shows once `site.founder.linkedin` is set) |
| Bio | Your draft from the brief, TR and EN | `home.founder.body`, `about.bio` |
| Founder story (3 short paragraphs, first person) | Drafted from your background and plan v8 | `about.founderP1-3` |
| Review and e-file partner | "anlaşmalı bir ABD muhasebe firması" / "a US accounting firm under contract" (the word CPA is deliberately not used) | `about.data3` |
| Full-desk onboarding | $5,000 (plan v8; the brief listed only the monthly price) | `src/lib/pricing.ts` → `fullDesk.onboarding` |
| Check, plan and desk inclusions, capacities, terms | Copied from Ponenti plan v8 (Oct 5, 2026) | `messages` → `services.*` |
| First 10 business days timeline | Drafted from v8's 10-day check delivery | `about.step1-5` |
| Support file: rates, caps and conditions | 50% base, 20 points more when the US is on the target-country list for the payment year (the latest posted list is 2022-2023; confirm the current one), 2026 caps, filing windows | `src/lib/support.ts`, `supportFile.*`, `supportEstimator.*`, the article `abd-kira-destegi-neden-reddedilir.mdx` |
| Support file: what Ponenti does | "Ponenti sets it up", Counselor package, licensed real-estate brokers for "one lease, two problems", the document promise, file included in Standard and Complete | `supportFile.*`, `services.check.i7`, `services.plans.standard.i7`, `services.terms.i6`, FAQ q8-q9 |
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
- Sharing support-file records with a client's Turkish support consultant only with written consent, and a separate Section 7216 consent for anything from tax return work
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
| Turkish support caps (rent 9,862,972 TL per site, promotion, trademark, documents, fulfillment) | Ministry of Trade limit tables for the year | Each January: update `src/lib/support.ts` (`limitsYear` and the TL figures) |
| Target-country list (the 70% column) | ticaret.gov.tr, "Hedef ve öncelikli ülkeler" | Each January, and before every first claim |
| Unit rent, promotion, trademark and e-export circulars | ticaret.gov.tr circular PDFs (unit rent in force Apr 20, 2026; promotion Jun 26, 2026) | Quarterly |
| TCMB fallback rate | `USD_TRY_FALLBACK` in `src/lib/tcmb.ts` (used only if TCMB does not answer) | When you touch the file |
| Section 301 forced-labor duty on products of Türkiye: 12.5% since Jul 24, 2026 (HTSUS 9903.05.79) | Federal Register, Jul 28, 2026 (91 FR 47318); CBP CSMS #69326983 | When USTR modifies the action (a Turkish import ban could move the rate to 10%): update `src/lib/market.ts`, `home.market.f3`, and the article `section-301-forced-labor-duty-turkiye-12-5-percent.mdx` / `abd-301-madde-ek-vergi-turkiye-yuzde-12-5.mdx` |
| FDA "did not develop an FSVP" citations: 483 in fiscal year 2025, the most-cited food observation | FDA Inspection Observations spreadsheet, FY2025, Foods tab | When FDA posts the FY2026 file (usually in the first months of the calendar year): update `src/lib/market.ts` and `home.market.f6` |
| Market figures on the home page (imports, effective duty rate, sea share, ports, largest lines) | Census snapshot in `src/data/trade/snapshot/` | Automatic with the monthly snapshot; no copy to touch. `MARKET_RULES.checkedOn` is the date the two rules above were last checked |
