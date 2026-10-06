# Ponenti design system

The rules behind `src/design/tokens.css` and `src/app/globals.css`. The marketing site follows them today; the client portal should follow the same ones.

The look is editorial and restrained: one ground color, one ink, one accent, large serif headings, generous whitespace, hairlines instead of boxes. Every rule below exists to keep a new page from drifting away from that.

## 1. Color

Three roles and nothing else.

| Role | Token | Hex | Use |
|---|---|---|---|
| Neutral, the ground | `ivory` | `#F6F1E7` | Page background |
| | `paper` | `#FBF8F2` | Sheets (a report, a form) and form fields |
| | `sand` | `#EFE9DC` | The closing band on every page, the sample-report band, selected rows |
| | `line` | `#D9CFBC` | Hairlines on ivory |
| | `field` | `#8A8376` | Form field borders |
| Ink, the one dark tone | `navy` | `#0E1A2B` | Every heading, all body text, primary buttons, the dark band |
| | `mist` | `#4F5660` | Secondary text |
| | `mist-soft` | `#62676F` | Captions and meta text |
| | `ivory-dim` / `ivory-soft` | `#C9C1B1` / `#999B9C` | Secondary and meta text on navy |
| | `line-navy` | `#2F3845` | Hairlines on navy |
| Accent | `brass` | `#B08D57` | Hairline rules, the wind rose, link underlines, the kicker rule |
| | `brass-deep` | `#7A5C2E` | Brass-toned text on light grounds: labels, numerals, icons |
| | `brass-light` | `#CDAE7C` | Brass-toned text on navy |
| Functional | `oxblood` | `#8A2A2A` | Form errors and negative figures. Nothing else. |

Rules

- Brass is never a fill behind text and never covers a large area. It is a line, a mark or a small label.
- `brass` (`#B08D57`) is never text on ivory: the contrast is 2.75:1. Use `brass-deep` (5.5:1).
- A page has at most one navy band and one sand band besides the closing band. Everything else sits on ivory.
- No gradients, no tinted cards, no second accent. If a design seems to need a new color, it needs a hairline or more space instead.

Contrast, measured (WCAG 2.2 needs 4.5:1 for text, 3:1 for UI): navy on ivory 15.5, mist on ivory 6.6, mist-soft on ivory 5.1, brass-deep on ivory 5.5, oxblood on ivory 7.6, ivory on navy 15.5, ivory-dim on navy 9.8, ivory-soft on navy 6.3, brass-light on navy 8.3, field on ivory 3.3.

## 2. Typography

Two families. Cormorant Garamond Medium (500), roman and italic, is the voice: headings, prices, large numerals. Inter (400 to 600) is the workhorse: body text, labels, forms and all data.

| Style | Phone (390 px) size / line | Desktop (1440 px) size / line | Weight | Tracking | Family | Used for |
|---|---|---|---|---|---|---|
| `display-xl` | 42 / 45 | 76 / 78 | 500 | -0.02em | Serif | The one h1 of a page |
| `display-lg` | 32 / 36 | 52 / 56 | 500 | -0.015em | Serif | Section titles |
| `display-md` | 26 / 31 | 36 / 42 | 500 | -0.01em | Serif | Titles in a split section, plan names, article h2 |
| `display-sm` | 22 / 28 | 27 / 34 | 500 | -0.005em | Serif | Row titles, card titles, FAQ questions |
| `numeral` | 52 / 52 | 88 / 84 | 500 | -0.02em | Serif | One key figure (calculator results, clocks) |
| `lead` | 18 / 28 | 21 / 33 | 400 | -0.011em | Sans | The paragraph under a title |
| `body` | 16 / 27 | 17 / 29 | 400 | -0.006em | Sans | Running text |
| `title` | 17 / 24 | 18 / 26 | 600 | -0.01em | Sans | Small sans headings inside dense lists |
| `small` | 14 / 22 | 14 / 22 | 400 | 0 | Sans | Supporting text, list items |
| `caption` | 13 / 20 | 13 / 20 | 400 | 0 | Sans | Captions, sources, meta |
| `eyebrow` | 12 / 16 | 12 / 16 | 500 | +0.16em, uppercase | Sans | Labels above titles |

Sizes between 390 and 1440 px are fluid (`clamp`), so there are no jumps at breakpoints.

Rules

- One h1 per page, in `display-xl`. Headings never skip a level.
- Serif is always weight 500. Never bold a serif heading; never set body text in serif.
- Italic is for one phrase per heading at most, and only where the copy marks it (`<em>` in the messages, rendered with `t.rich`).
- Figures in the serif are lining figures (baked into the font files), so `$1,500` and `18:06` read cleanly.
- Data is set in the sans: stat tiles in Inter 600, tables in Inter 400 with `tabular-nums` (class `figures`). A standalone figure stays proportional.
- Text columns stop at about 72 characters (`max-w-2xl`, or `--container-prose` in articles).
- Turkish uppercase: labels are uppercased by CSS with the page language set, so "i" becomes "İ". Do not hardcode uppercase strings.

## 3. Space and layout

Whitespace does the work that boxes did before.

| Token | Phone | Desktop | Use |
|---|---|---|---|
| `py-section` | 104 px | 192 px | Vertical padding of every section |
| `py-band` | 72 px | 120 px | Page headers, bands that belong to their neighbor, the footer |
| `mt-stack` | 48 px | 96 px | From a section header to its content |
| Side gutter | 24 px | 64 px (40 px from 640 px) | Class `page`, max width 1280 px |

Grid: 12 columns, 32 px gap, from 1024 px. Below that everything is one column.

The `Section` component (`src/components/section.tsx`) is the only way to open a section.

- `layout="stack"`: header on top, content below at full width. Use for wide content: columns of three, tables, the sample report.
- `layout="split"`: header in the left 4 columns (it stays in view while the right side scrolls), content in the right 8. Use for lists and long reading.
- Alternate the two down a page. That alternation is the rhythm.
- A section opens with one full-width hairline (`rule`, on by default). Pass `rule={false}` directly under a page header or a band.

Rules

- No cards. Group with a hairline above, whitespace below. Lists are ruled rows.
- The one raised surface is the sheet (`sheet`): paper on ivory with a hairline and one soft shadow. It is reserved for things that are documents or forms in real life: the sample report, the contact form.
- When a list ends a section in a one-column layout, the list drops its closing line (`max-lg:last:border-b-0`), so two identical rules never sit 104 px apart.
- Corners are almost square: 2 px (`rounded-xs`). No pills except the sample-data badge.
- Columns that must line up across neighbors (plan name, price, scope) use CSS subgrid, not fixed heights.

## 4. Components

| Component | Rule |
|---|---|
| Primary button | Navy fill, ivory text, 56 px tall (`size="lg"`), arrow icon that moves on hover. One per screen region. |
| Secondary button | 1 px navy outline at 30%, same height. |
| Text link | Class `link`: brass underline that turns to the text color on hover. With an arrow, use `ArrowLink`. |
| Label | Class `eyebrow`. Add `kicker` for the 28 px brass rule in front; use the kicker once per section, on its top label. |
| Ruled row | `border-b border-line` with 32 to 56 px of vertical padding. If the whole row is a link, add `hover-rule`. |
| Numbered row | Serif numeral in `brass-deep` in a fixed left column; never a circle or a badge. |
| Price | Serif figure, with the period and any qualifier in `small` beside it. |
| Note | A short brass rule on the left (`border-l border-brass pl-5`), `small` text. For scope limits and disclaimers. |
| Form field | 48 px tall, paper fill, `field` border, navy border and soft navy ring on focus. Labels above, in `small` 500. |
| Error | Oxblood text with a 2 px oxblood rule on the left. Never a red box. |

## 5. Icons and images

- Icons are Lucide line icons at a 1.5 px stroke (set globally in `globals.css`), 16 to 20 px, in `brass-deep` or the text color. No emoji, no filled icons, no icon inside a colored circle.
- An icon must mean something specific. If a row reads fine without it, leave it out. Shields, locks and check badges used as decoration are not allowed: they claim security instead of describing it.
- Arrows on links are functional and always sit after the label.
- The one illustration is the compass card (`src/components/brand/compass-card.tsx`): an engraved wind rose whose west point, ponente, is the only brass shape. It appears in the home hero, on the About page and in share images. Do not add stock photos or abstract shapes next to it.
- Photos (`site.photos`) render only when a real file is set.

## 6. Interactions

Three, all plain CSS transitions. No animation library, no scroll-linked effects, nothing that loops.

| # | Where | Trigger | What happens | Why it helps | Where it turns into distraction |
|---|---|---|---|---|---|
| 1 | Rows and panels that are one link (price list, the two doors, article index, nav links); arrows on every link and button | Hover or keyboard focus | A 1 px brass rule draws left to right under the row in 400 ms; the arrow moves 4 px in 200 ms | Shows the whole row is clickable without color blocks or shadows, and reuses the hairline the layout is built from | On anything that is not a link. On text inside paragraphs. If the rule were thicker, or the row also changed background, lifted or scaled. One response per element. |
| 2 | Each section's top rule and its content blocks (`data-reveal`) | The block scrolls into view, once | The rule draws across in 900 ms; content fades in and rises 8 px in 400 ms | Gives a long page a quiet pace and makes the hairline structure visible as you read | On the hero or anything on screen at load (never animate what the visitor already sees). If it replays on scroll up, staggers item by item, or moves more than 8 px. Numbers must never count up. |
| 3 | The sticky header | The page has scrolled 12 px | The header gains a hairline and a 90% ivory veil with a slight blur in 200 ms | Keeps the header out of the hero's way, then separates it cleanly from content passing under it | If the header shrank, hid on scroll down, or changed color. It only gains a line. |

With `prefers-reduced-motion: reduce`, transitions are instant, content is never hidden and arrows do not move.

Not allowed: parallax, hover lifts and shadows, tilt, typewriter or counting text, carousels, auto-playing anything, cursor effects.

## 7. Data UI (trade pages, sample report, later the portal)

- A headline number is a stat tile, not a chart: label in `caption`, value in Inter 600 at 36 px, change below it with a sign and an arrow.
- Positive values are ink. Only an unfavorable change is oxblood, and it always carries a sign and an arrow, never color alone.
- One accent series (`chart-accent` `#2A548C`, the ink's own hue lifted until it reads as a color), gray (`chart-muted`) for context, oxblood for declines. Validated on ivory for contrast and color-vision deficiency.
- Bars are 8 px tall, square at the baseline, 4 px rounded at the data end. Lines are 2 px with a 10% wash. Gridlines are hairlines; the end point is labeled directly.
- One y-axis per chart. Two measures get two charts.
- Stat tiles go two across from 640 px and four across only from 1280 px, because Turkish values ("$17 milyar") need the width.
- Every chart has a "show as table" view, and every trade page keeps the Census notice.
- Sample numbers always carry the "Örnek veriler / Sample data" badge and a line saying they are not a client's results.

## 8. Trust rules in the design

- Proof is a section of its own, built only from things a visitor can check: each card states a fact and links to where it can be checked. A card whose claim cannot be checked yet is not shown. The founder card appears when `site.founder.linkedin` is set; until then the section says "three things", not "four".
- No badge, seal, star rating, "trusted by" row, counter or testimonial unless the content is real and permitted. Empty proof slots render nothing.
- A bracketed placeholder never reaches a visitor on a marketing page: the row is absent until the fact is real. Markers show in preview builds (`NEXT_PUBLIC_SHOW_PLACEHOLDERS=true`) and inside the legal drafts.
- A button never names a channel that is not connected. Without a WhatsApp number the secondary button reads "Send a message" and opens the form; contact copy and form errors name only the channels that exist.
- A regulatory fact carries its source link in the same block. Ponenti's own facts (hours, prices) are labeled as its own.
- Future tense for things that are not live yet (the portal).

## 9. Before you ship a new page

1. One h1, sections opened with `Section`, stack and split alternating.
2. Only tokens from `tokens.css`: no hex values, no new font sizes, no new spacing scale.
3. No card, no shadow other than `sheet`, no icon that is decoration.
4. Every link row has `hover-rule`; nothing else moves.
5. Turkish and English strings in both message files, checked at 390, 1024 and 1440 px in both languages.
6. `npm run typecheck`, `npm run lint`, `npm run test:e2e`, `npm run test:a11y` pass.
