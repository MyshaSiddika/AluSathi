# Farmer and Buyer updates

Local work in `E:\AluSathi`, branch `codex/farmer-buyer-refinements`.
Prepared for GitHub review as a separate feature branch against the team repository's `main`.

## Changes

- One shared footer on React routes and marketplace screens. Both project links are visible and open the correct About section in the same tab.
- Farmer photo screen: removed the leaf-problem section; added crop age, with 8 days for the existing demo.
- Compact season calendar: preserved the five growth stages, week navigation, today/Day 90 shortcuts, weather, work records and all 90 tips. Restored the day slider and status icons. Select a day to read its tip; expand for the week.
- Removed the requested stage disclaimer and the “Recorded in Khata” prefix from stage records.
- Khata starts with the latest three recorded dates, including saved calculations. Show more/less preserves the existing filters and records.
- Renamed the potato-information heading and added a changeable cold-storage district selector.
- Buyer search recognises variety, kg and district from typed text. Existing tonne, date and budget parsing remains. Buyers can review and change recognised fields. Matches use the existing browser catalogue, not an external AI service.
- Voice input uses the browser's speech-recognition capability, with a typing fallback. This is not a promise of offline speech recognition.
- Cards show the supplied variety, including the legacy `potatoVariety` field. Unknown varieties are labelled as missing rather than invented. Removed the representative-photo caption; example-listing labels remain.
- Farmer contact stays in a popup. Phone is on the left, Call on the right, with WhatsApp and an editable prepared message. Demo numbers have working preview buttons but never dial an invented number. Shared actual numbers produce validated phone/WhatsApp links. WhatsApp calling opens a chat; users tap WhatsApp's call button there.
- Cost & profit buttons open a budget modal without changing the URL. Separate costs include transport, labour, loading, tolls, communication and other expenses. Blank costs remain unknown. Remaining budget is not called profit. Optional resale input enables an estimated profit/loss comparison.
- Added cost-breakdown, budget/cost, listing-price comparison and optional resale charts. The existing detailed finance route remains available by its direct URL. Removed its yellow practice notice and only the kg/maund/bag conversion section.
- Buyer profile uses a profile pill and More menu matching the Farmer style. Photo, saved lots, Khata, language switching and sign-out remain available.
- Added the supplied farmer weather animation to the season page and the supplied potato-truck animation to Buyer transport, directly below navigation. Both use local assets and still images for reduced-motion settings; the Buyer lots banner stays unchanged.

## Validation

- `node tests/buyer-budget.mjs`: calculation and parser checks.
- `PLAYWRIGHT_CHANNEL=msedge node tests/farmer-buyer-updates.cjs`: both languages, 1440 × 900 and 390 × 844, all main routes, filters, empty matches, voice mock/fallback, modal persistence, keyboard access, no page errors or horizontal overflow.
- `PLAYWRIGHT_CHANNEL=msedge node tests/buyer-contact-links.cjs`: shared numbers, encoded editable messages, legacy varieties, HTML-injection checks. No external contact link was opened.
- `PLAYWRIGHT_CHANNEL=msedge node tests/farmer-profile.cjs`: existing profile regression coverage.
- `PLAYWRIGHT_CHANNEL=msedge node tests/buyer-profile.cjs`: existing profile regression coverage; selectors updated for the More menu.
- `npm run check`: TypeScript, ESLint and production build. Ten existing React-refresh lint warnings; existing Vite configuration/chunk-size warnings.
- `git diff --check`.
- Both new banners were checked with Playwright at 1440px and 390px, with normal and reduced motion. Images load at the expected 2172 × 304 dimensions, with no browser errors or horizontal overflow. Buyer pickup, destination and date fields still update trip details.

The older `tests/marketplace-money.mjs` cannot run: it imports `purchaseCost`, which current GitHub `main` no longer exports. `market.mjs` was not modified by this work. The new budget calculations have separate passing coverage.

Screenshots are under ignored `test-results/feature-updates/`. Actual microphone recognition and real phone/WhatsApp calls were not performed; voice callbacks and unsupported-browser handling were tested without sending a call or message.
