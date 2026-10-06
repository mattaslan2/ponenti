# Ponenti marketing site

The website for Ponenti, the US compliance and collections desk for Turkish companies. Turkish is the default language (`/tr`), English is at `/en`. Built to raise reply rates on cold emails, calls and WhatsApp: a Turkish owner or CFO opens the link on a phone and, within 10 seconds, sees who we are, what we do, for whom, what it costs and why to trust us, then books a call.

- **Live:** every push to `main` deploys to Vercel Production. Other branches get Preview URLs.
- **Public repo:** everything committed here is visible on GitHub. Never commit keys, client data or internal Ponenti documents.
- **Before launch:** see [`docs/LAUNCH-CHECKLIST.md`](docs/LAUNCH-CHECKLIST.md) and [`docs/PLACEHOLDERS.md`](docs/PLACEHOLDERS.md).
- **All copy, Turkish and English side by side:** [`docs/COPY.md`](docs/COPY.md) (generated).

## Stack

Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 4, shadcn/ui, next-intl 4 (messages precompiled at build), MDX (`@next/mdx`), Server Actions with Zod, Vercel BotID, Attio, Resend, PostHog (US cloud, consent-gated), Sentry. No database: leads live in Attio.

## Run it locally

```bash
npm install
cp .env.example .env.local   # fill what you have; everything degrades gracefully
npm run dev                  # http://localhost:3000 (redirects to /tr)
```

| Script | What it does |
|---|---|
| `npm run dev` | Local development |
| `npm run build` / `npm start` | Production build and server |
| `npm run typecheck` | Route types + TypeScript |
| `npm run lint` | ESLint |
| `npm run placeholders` | Lists every `[REPLACE WITH REAL]`, `[confirm]` and E&O item; `-- --strict` fails if facts are missing |
| `npm run copy:export` | Regenerates `docs/COPY.md` from the message files |
| `npm run test:e2e` | Main journeys on a local production build (uses your Chrome; `BASE_URL` defaults to `http://localhost:3000`) |
| `npm run test:a11y` | axe-core scan of 18 pages at phone and desktop widths |
| `npm run test:leads` | Lead flow against mock Attio and Resend (`tests/mock-apis.cjs`; setup in the file header) |

## Where things live

| You want to change | Edit |
|---|---|
| Any sentence on the site (TR and EN) | `src/messages/tr.json`, `src/messages/en.json` |
| Prices (one place, used everywhere incl. JSON-LD and emails) | `src/lib/pricing.ts` |
| Company facts: legal name, address, phone, email, founder photo, LinkedIn, photos | `src/lib/site.ts` |
| Official source links behind regulatory claims | `src/lib/sources.ts` |
| Knowledge-center articles | `src/content/insights/{tr,en}/{slug}.mdx` (the file name is the URL slug; `meta.key` pairs the two languages) |
| Privacy, terms, cookie notice | `src/content/legal/{tr,en}/*.mdx` |
| Prospect pages (`/tr/ozel/{firm}`) | `src/content/prospects/{firm}.json` (copy `_template.json`) |
| Risk-test questions and scoring | `src/lib/risk-test.ts` (copy in `riskTest.*` messages) |
| Calculator formulas | `src/lib/calculators.ts` |
| Trade-data copy, Turkish product words, data logic | `trade.*` messages, `src/data/trade/hs-tr.ts`, `src/lib/trade/` |
| Design tokens (colors, type, spacing, motion) | `src/design/tokens.css` |

```
src/
  app/[locale]/        pages: home, services, risk-test, calculators, insights, about,
                       contact, privacy, terms, cookies, portal, ozel/[firm], 404
  actions/lead.ts      the one Server Action: spam checks, validation, Attio, Resend
  components/          layout (header, footer, consent), home sections, forms,
                       risk test, calculators, booking, placeholders, ui (shadcn)
  content/             MDX articles and legal pages, prospect JSON
  design/tokens.css    design tokens (shared with the future portal)
  i18n/                next-intl routing (localized paths), request config
  lib/                 pricing, site facts, sources, SEO, JSON-LD, leads (Attio, Resend)
  messages/            tr.json, en.json
  proxy.ts             language routing (Next 16 "proxy", formerly middleware)
  fonts/               self-hosted web fonts, Latin + Turkish subsets (OFL)
docs/                  placeholders, launch checklist, generated copy
tests/                 end-to-end, accessibility and lead-flow scripts
scripts/               placeholder report, copy export, font subsetting
assets/fonts/          fonts for share images (OFL)
```

Localized URLs: `/tr/hizmetler` = `/en/services`, `/tr/risk-testi`, `/tr/hesaplayicilar`, `/tr/bilgi-merkezi`, `/tr/hakkimizda`, `/tr/iletisim`, `/tr/gizlilik`, `/tr/kosullar`, `/tr/cerezler`, `/tr/portal`, `/tr/ozel/{firm}`. The bare domain opens Turkish unless the visitor chose English with the switcher (stored in `NEXT_LOCALE` for 12 months). Browser language never redirects.

## Environment variables

Copy `.env.example`. Nothing is required to build; each integration switches on when its variable is set.

| Variable | Scope | Purpose | Without it |
|---|---|---|---|
| `ATTIO_API_KEY` | server | Create or update the Company and Person, plus a note per submission | Leads are not stored in Attio |
| `RESEND_API_KEY` | server | Visitor confirmation (in their language) and your internal alert | No emails |
| `LEADS_FROM_EMAIL` | server | Sender on your verified domain | No emails |
| `LEADS_ALERT_EMAIL` | server | Where alerts go | No alert |
| `NEXT_PUBLIC_POSTHOG_KEY` | public | Analytics, loaded only after cookie consent | No analytics |
| `SENTRY_DSN` | both | Error monitoring (server and browser) | No error reports |
| `NEXT_PUBLIC_CAL_LINK` | public | Cal.com event, e.g. `ponenti/15min` | Contact page says the calendar isn't connected |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | public | Click-to-chat with a prefilled Turkish or English message | WhatsApp buttons go to the contact page |
| `NEXT_PUBLIC_PORTAL_URL` | public | Client-portal button target, default `/portal` | Placeholder portal page |
| `CENSUS_API_KEY` | server | US import statistics for the trade-data pages | Trade pages say the data isn't connected |
| `USITC_DATAWEB_TOKEN` | server | HTS tariff lines on 6-digit product pages. Expires every 180 days (current: 2027-04-04) | Tariff card hidden; everything else works |
| `NEXT_PUBLIC_SITE_URL` | public | Canonical URL, hreflang, sitemap | Falls back to Vercel's production URL |
| `SITE_INDEXABLE` | server | `true` lets search engines index the site | `noindex` + `Disallow: /` (pre-launch default) |
| `NEXT_PUBLIC_EO_CONFIRMED` | public | Shows the penalty promise | Promise stays hidden |
| `NEXT_PUBLIC_SHOW_PLACEHOLDERS` | public | Preview aid: marks hidden proof slots and `[confirm]` copy | Nothing marked |
| `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | build | Source-map upload | Minified stack traces |

If neither Attio nor Resend is configured, forms tell the visitor to use WhatsApp or book a call instead of pretending to succeed. A submission counts as a success only when it reached Attio or your alert inbox.

## Deploying on Vercel

The GitHub repo `mattaslan2/ponenti` is already connected to Vercel, and `main` deploys to Production.

1. Vercel → Project → Settings → General: Framework Preset "Next.js" (also forced by `vercel.json`), Node.js 22.x (`package.json` engines), Root Directory empty.
2. Settings → Environment Variables: add the table above for Production (and Preview where useful). Redeploy after changes.
3. Settings → Domains: add your domain; then set `NEXT_PUBLIC_SITE_URL`.
4. Push to a branch for a Preview URL; merge or push to `main` for Production.
5. Before the first outreach email, finish [`docs/LAUNCH-CHECKLIST.md`](docs/LAUNCH-CHECKLIST.md) and set `SITE_INDEXABLE=true`.

## How a lead flows

1. Visitor submits a form (contact, risk-test result, calculator result, prospect page).
2. `src/actions/lead.ts`: honeypot field and minimum fill time, then `checkBotId()`, then Zod validation. Free text with EIN- or SSN-shaped numbers is refused; the site never asks for tax IDs or documents.
3. Attio: Company upserted by email domain (by name for Gmail-type addresses), Person upserted by email and linked, custom fields written (language, segment, risk level, payment-days range, form, consent, UTM), and a note with the full submission.
4. Resend: confirmation to the visitor in Turkish or English, alert to you with reply-to set to the visitor.
5. UTM tags from the landing link are kept in page memory only (no cookie, no storage) and attached to the submission.

To test this flow without real accounts, run a mock server and set `ATTIO_API_URL` and `RESEND_BASE_URL` to it (see the end of `.env.example`). Never set them in Vercel.

## Trade data tool

`/tr/ticaret-verileri` (`/en/trade-data`) lets anyone explore US imports by product and country. It opens on Türkiye; any partner country can be selected.

- **Overview** (per country): last-12-month imports and change, share of US imports and rank, effective duty rate, sea/air split, a 36-month trend, the duty-rate trend, top products, biggest gains and declines, and main US ports of entry.
- **Product pages** (`/tr/ticaret-verileri/{HS code}`, 2, 4 or 6 digits): total US imports vs the selected country, share and rank, duty paid, top 10 suppliers with growth and duty rates, sub-products, ports of entry, and for 6-digit codes the HTS tariff lines from USITC.
- **Search**: HS codes, GTİP codes (first 6 digits), English product words and everyday Turkish words (`src/data/trade/hs-tr.ts`). Works without JavaScript too (`?q=`).
- **Leads**: "Email me this analysis" creates an Attio lead (`ponenti_form = trade_data`) and emails the visitor a summary recomputed on the server.
- **Prospect pages**: add `"hs": "5702"` to a prospect JSON file to show a US market snapshot for that firm's product.

Data: U.S. Census Bureau International Trade API (imports, monthly, about five weeks after month end), cached for a day; USITC DataWeb for HTS rates, cached for a week. Keys never reach the browser. The Census terms require the notice shown under every trade page ("This product uses the Census Bureau Data API but is not endorsed or certified by the Census Bureau."); keep it. Search ranking uses a static index in `src/data/trade/` (2025 values); rebuild it once a year with `CENSUS_API_KEY=... USITC_DATAWEB_TOKEN=... node scripts/build-trade-index.mjs 2026`.

Definitions shown on the pages: value = general imports at customs value; effective duty rate = Census calculated duty ÷ imports for consumption (includes additional duties, not later refunds). Quantities exist only at the 10-digit level, so unit prices are not shown yet.

## Analytics events (PostHog, after consent)

`cta_click`, `whatsapp_click`, `booking_open`, `form_submit` (also fired on a completed Cal.com booking with `form: booking`), `risk_test_complete`, `calculator_used`, `portal_click`. Clicks are tracked through `data-track` attributes, so server components need no client code.

## Client portal switch

The header button "Müşteri Portalı / Client portal" reads `NEXT_PUBLIC_PORTAL_URL`. Today it points to `/portal`, a calm noindex page with a sample-data preview and a "Request access" button (no login form). When the portal ships as its own Next.js app with Supabase auth on `portal.yourdomain.com`, set the variable to that URL and redeploy. Nothing else changes. The portal can reuse `src/design/tokens.css` as is.

## Design tokens

`src/design/tokens.css` holds every color, type size, radius and motion value as a Tailwind v4 `@theme`, plus the shadcn/ui semantic mapping. Palette: midnight navy `#0E1A2B`, ivory `#F6F1E7`, brass `#B08D57`, graphite `#1C1C1C`, Iznik cobalt `#1F4E8C` as a rare accent. The file header lists the verified WCAG contrast ratios. Rule: brass is never body text on ivory (2.75:1); use `brass-deep` (5.5:1). Fonts: Cormorant Garamond 600 (display, large serif numerals) and Inter 400 to 600 (body), self-hosted from `src/fonts/` as Latin + Turkish subsets (47 KB together, down from 207 KB). If new copy needs a character outside `scripts/font-chars.txt`, add it and run `scripts/subset-fonts.py`.

## Performance and accessibility

Measured on a local production build with Lighthouse 13.5, mobile profile (simulated slow 4G, 4x CPU slowdown), October 2026:

| Page | Performance | Accessibility | Best practices | SEO | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|
| `/tr` (home) | 94 to 97 | 100 | 100 | 100* | 2.1 to 2.6 s | 150 to 190 ms | 0 |
| `/en` (home) | 94 to 97 | 100 | 100 | 100* | 2.1 to 2.7 s | 130 to 180 ms | 0 |
| `/tr/hizmetler` | 99 | 100 | 100 | 100* | 1.6 to 1.8 s | 70 to 110 ms | 0 |
| `/tr/iletisim` | 95 to 97 | 100 | 100 | 100* | 2.3 to 2.7 s | 90 to 140 ms | 0.002 |
| `/tr/risk-testi` | 96 to 98 | 100 | 100 | 100* | 2.0 to 2.6 s | 120 ms | 0 |

Ranges are 2 to 4 runs per page; the same build moves 2 to 3 points between runs.

\* With `SITE_INDEXABLE=true`. While the site is `noindex` (pre-launch default), Lighthouse SEO shows 58 by design.

The brief's LCP target of 1.5 s is met on content pages in this lab profile, not yet on the home pages; React and Next.js alone are about 130 KB of the 170 KB of compressed JavaScript. Real phones on 4G should load faster than this throttled profile; check field data in Vercel after launch. What keeps it light: subset fonts, a native `<dialog>` menu, precompiled messages, Sentry loaded when the browser is idle, PostHog only after consent. axe-core: 0 violations on 18 pages at 390 px and 1280 px, including axe's experimental rules.

## SEO

Metadata API with canonical and hreflang (`tr`, `en`, `x-default`) on every page, `sitemap.xml` with alternates, `robots.txt`, JSON-LD (Organization, ProfessionalService, FAQPage on services, Article and BreadcrumbList on articles), a share image per language and per article (`next/og`, the engine behind `@vercel/og`), wind-rose favicon and Apple icon, localized 404. Prospect and portal pages are always `noindex`.

## Trust rules built into the code

- No credential the founder doesn't hold: never "CPA", "Enrolled Agent", "licensed customs broker" (except "your licensed customs broker") or "certified".
- No invented testimonials, logos, counts, case studies or results: proof slots render nothing until real content is passed in.
- Every regulatory claim links to its official source (`src/lib/sources.ts`, article `meta.sources`).
- The penalty promise renders only with `NEXT_PUBLIC_EO_CONFIRMED=true`.
- No public AI chatbot. Forms never ask for tax IDs, EINs or financial documents; the risk test uses yes/no answers and ranges only.
- Footer disclaimer: informational content, not legal, tax or customs advice; no government affiliation.
