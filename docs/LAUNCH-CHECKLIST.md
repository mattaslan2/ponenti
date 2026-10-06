# Launch checklist

Work top to bottom. Each line is a yes/no check.

## 1. Domain

- [ ] Vercel → Project → Settings → Domains: add the apex domain and `www`; redirect `www` to the apex (or the reverse, pick one).
- [ ] At your registrar, add the DNS records Vercel shows. Wait for "Valid Configuration".
- [ ] Set `NEXT_PUBLIC_SITE_URL=https://yourdomain.com` (no trailing slash) for Production, then redeploy.
- [ ] Open `https://yourdomain.com/sitemap.xml` and check that every URL uses the domain.

## 2. Environment variables (Vercel → Settings → Environment Variables)

| Variable | Production | Preview | Notes |
|---|---|---|---|
| `ATTIO_API_KEY` | yes | yes (or a test workspace) | Server only |
| `RESEND_API_KEY` | yes | yes | Server only |
| `LEADS_FROM_EMAIL` | yes | yes | e.g. `Ponenti <merhaba@yourdomain.com>`, on the verified domain |
| `LEADS_ALERT_EMAIL` | yes | yes | Where lead alerts go |
| `NEXT_PUBLIC_POSTHOG_KEY` | yes | optional | US cloud project key |
| `SENTRY_DSN` | yes | yes | |
| `NEXT_PUBLIC_CAL_LINK` | yes | yes | e.g. `ponenti/15min` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | yes | yes | Digits only, international |
| `NEXT_PUBLIC_PORTAL_URL` | `/portal` | `/portal` | Change only when the portal app is live |
| `NEXT_PUBLIC_SITE_URL` | yes | no | Your domain |
| `SITE_INDEXABLE` | `true` at launch | never | Keeps Preview and pre-launch out of search |
| `NEXT_PUBLIC_EO_CONFIRMED` | only after E&O confirms | no | Shows the penalty promise |
| `NEXT_PUBLIC_SHOW_PLACEHOLDERS` | never | optional | Shows hidden proof slots as marked boxes |

After changing variables, redeploy (Deployments → ⋯ → Redeploy). `NEXT_PUBLIC_*` values are baked in at build time.

## 3. Email authentication for the sending domain (Resend)

- [ ] Resend → Domains → Add domain. Use a subdomain for sending, e.g. `send.yourdomain.com`, so marketing tools never share its reputation.
- [ ] SPF: add the TXT (and MX, if shown) records Resend lists for that subdomain. Keep one SPF record per hostname.
- [ ] DKIM: add the `resend._domainkey` TXT record Resend lists.
- [ ] DMARC on the root domain: TXT `_dmarc.yourdomain.com` = `v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com; fo=1`. After 2-4 weeks of clean reports, move to `p=quarantine`.
- [ ] Resend shows the domain as Verified.
- [ ] Send a test lead to a Gmail address. Gmail → Show original: SPF PASS, DKIM PASS, DMARC PASS.

## 4. Attio fields (People object)

Create these attributes with exactly these slugs (Attio → Settings → Objects → People → Attributes). Select option titles must match exactly.

| Title | Slug | Type | Options |
|---|---|---|---|
| Ponenti language | `ponenti_language` | Select | `tr`, `en` |
| Ponenti segment | `ponenti_segment` | Select | `us_entity`, `sells_from_tr` |
| Ponenti risk level | `ponenti_risk_level` | Select | `low`, `medium`, `high` |
| Ponenti payment days | `ponenti_payment_days` | Select | `0-29`, `30-45`, `46-60`, `61-90`, `90+` |
| Ponenti form | `ponenti_form` | Select | `contact`, `risk_test`, `calc_cash`, `calc_5472`, `prospect` |
| Ponenti consent | `ponenti_consent` | Checkbox | |
| UTM source | `utm_source` | Text | |
| UTM medium | `utm_medium` | Text | |
| UTM campaign | `utm_campaign` | Text | |
| UTM term | `utm_term` | Text | |
| UTM content | `utm_content` | Text | |

- [ ] API token scopes: `record_permission:read-write`, `object_configuration:read`, `note:read-write`.
- [ ] If a field is missing, leads still save with name, email, phone and company, the full submission goes into a note, and Vercel logs show `[attio] custom attributes rejected`. Fix the field and re-test.

## 5. Test a lead end to end (on the production URL)

Use a link with campaign tags, e.g. `/tr?utm_source=test&utm_medium=email&utm_campaign=launch`.

- [ ] Contact form (TR): Attio has the person, the company (matched by email domain) and a note; custom fields filled; UTM fields filled.
- [ ] The visitor gets the Turkish confirmation ("Sayın ...", "Saygılarımla"); you get the alert.
- [ ] Repeat in English from `/en/contact`.
- [ ] Risk test → "Get your result by email": risk level, segment, payment days in Attio; the email lists the top issues with sources.
- [ ] Both calculators → "Email me my result".
- [ ] Prospect page form (`/tr/ozel/{firm}`): the note shows the prospect page.
- [ ] Message with an EIN-shaped number (`12-3456789`) is refused with the "don't share tax IDs" message.
- [ ] Vercel → Logs: no errors.

## 6. Cookie consent

- [ ] Fresh private window: the banner shows; DevTools → Network shows no requests to `/ingest` before a choice.
- [ ] Decline: still no `/ingest` requests after browsing three pages.
- [ ] Accept: PostHog loads; a `$pageview` arrives in PostHog → Activity.
- [ ] Footer → "Çerez tercihleri" reopens the banner and the analytics switch reflects the choice.
- [ ] The `ponenti_consent` cookie lasts 12 months; `NEXT_LOCALE` appears only after switching language.

## 7. Analytics events (PostHog, after accepting cookies)

- [ ] `cta_click`, `whatsapp_click`, `booking_open`, `form_submit`, `risk_test_complete`, `calculator_used`, `portal_click` all appear with `label` and `location` properties.

## 8. Spam protection (Vercel BotID)

- [ ] BotID runs only on Vercel. Submit each form from a normal browser on the production URL: success.
- [ ] Optional (Pro plan): Vercel → Firewall → enable BotID Deep Analysis.

## 9. Booking and WhatsApp

- [ ] Cal.com: a 15-minute event, availability set in US Eastern, buffer between calls, Turkish and English event descriptions.
- [ ] `/tr/iletisim#book` opens the calendar; a test booking fires `form_submit` with `form: booking`.
- [ ] WhatsApp button on a phone opens the chat with the Turkish message prefilled.

## 10. Error monitoring (Sentry)

- [ ] `SENTRY_DSN` set; Sentry project receives a test event (Sentry → Issues).
- [ ] Optional: `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` for readable stack traces.

## 11. Content and trust rules

- [ ] `npm run placeholders -- --strict` passes.
- [ ] Every `[confirm]` item in `docs/PLACEHOLDERS.md` approved or rewritten.
- [ ] Counsel reviewed privacy, terms and cookie pages; draft banners removed.
- [ ] No "CPA", "Enrolled Agent", "certified" or any credential you don't hold. No government logos or seals.
- [ ] Proof slots hidden or filled with real, permitted content.
- [ ] Penalty promise hidden unless E&O confirmed in writing.
- [ ] Sample prospect page deleted or kept intentionally.

## 12. Before the first client's data arrives

- [ ] Written information security plan (IRS Publication 5708 template; FTC Safeguards Rule).
- [ ] Section 7216 consent form ready for any processing outside the US.
- [ ] Two-factor login on every system that will hold client data.
- [ ] E&O, cyber and crime cover in force.
- [ ] KVKK: counsel's decision on VERBIS registration (controllers abroad must register, through a Türkiye-based representative) and standard contracts with processors (Article 9).
- [ ] Secure document upload link set up (the site promises no email attachments).

## 12b. Trade data tool

- [ ] Vercel → Settings → Environment Variables: add `CENSUS_API_KEY` and `USITC_DATAWEB_TOKEN` (Production and Preview), then redeploy.
- [ ] GitHub → Settings → Secrets and variables → Actions → New repository secret: `CENSUS_API_KEY` (same value). Without it the monthly data refresh skips and the pages keep showing the last snapshot.
- [ ] GitHub → Actions → Trade data snapshot → Run workflow (leave "force" off): it should finish green with "Snapshot already has [month]" or commit a new month.
- [ ] Open `/tr/ticaret-verileri`: the Türkiye overview shows numbers and "Son veri: [month]". Open `/tr/ticaret-verileri/570242`: suppliers, ports and the HTS tariff table appear. Switch the country to Almanya: the Germany line and ports load a moment after the rest.
- [ ] Send yourself "Bu analizi e-postayla alın" from a product page: the email shows the product summary and link; the lead appears in Attio with form `trade_data`.
- [ ] Calendar reminder for 2027-03-25: renew the USITC DataWeb token (it expires 2027-04-04) at https://dataweb.usitc.gov/api-key and update `USITC_DATAWEB_TOKEN` in Vercel.
- [ ] Once a month, glance at GitHub → Actions: a red "Trade data snapshot" run means the refresh failed (usually the Census API being down; it retries the next day).
- [ ] Each January or February, after full-year data is out: rebuild the search index with `node scripts/build-trade-index.mjs <last year>` and commit `src/data/trade/`.

## 13. Go live

- [ ] `SITE_INDEXABLE=true` for Production, then redeploy.
- [ ] `https://yourdomain.com/robots.txt` allows crawling and lists the sitemap.
- [ ] Google Search Console: add the domain property, submit `sitemap.xml`. Bing Webmaster Tools and Yandex Webmaster (useful for Türkiye) optional.
- [ ] PageSpeed Insights (mobile) on `/tr`, `/tr/hizmetler`, `/tr/iletisim`: 95+ in every category. Local lab runs scored 94 to 99 on performance (see README); the home page LCP was 2.1 to 2.6 s in the throttled lab profile.
- [ ] After two weeks of traffic, check real-visitor LCP (PageSpeed Insights field data or Vercel Speed Insights). Target: under 1.5 s.
- [ ] Share a page link in WhatsApp: the Turkish preview card shows.
