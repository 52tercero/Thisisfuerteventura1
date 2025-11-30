# Manual Test Checklist (Next App)

## Environment
1. Start dev server:
   - PowerShell: `Push-Location .\next; $env:PORT=3010; npm run dev`
2. Ensure RSS proxy (if required) is running on port 3000 for news aggregation.
   - If unavailable, news pages should degrade gracefully (empty list or not found messages).

## Localization (i18n)
1. Switch between `es`, `en`, `de` locales via route prefix (e.g., `/en/playas`).
2. Verify translated navigation labels (`nav` keys) appear in header (home, news, tourism, etc.).
3. Check feature chips translation on:
   - `/[locale]/alojamiento` (e.g., "Infinity pool" vs "Piscina infinity").
   - `/[locale]/playas` (e.g., "Sunbeds" vs "Hamacas").
4. Trails page `/[locale]/senderos`:
   - Difficulty, Distance, Duration labels localized.
5. Tourism detail `/[locale]/turismo/{id}`:
   - Section headings: Information, History, Extended description, Gallery localized.
6. News detail `/[locale]/noticia/{slug}`:
   - Published label localized.
   - Back to news link localized.

## Dates
1. News detail page: verify date format changes (Spanish: `dd/mm/aaaa`; German: `dd.mm.yyyy`; English: `dd/mm/yyyy` or locale default).

## Images & Fallback
1. Confirm hero/listing images load (no 404 in network panel).
2. Temporarily rename one image under `next/public/images/playas` and refresh page → placeholder appears.
3. Verify `alt` attributes present on all images (accommodation, beaches, tourism, news).

## Links & External Navigation
1. Maps links on beaches and accommodation open a new tab; confirm `rel="noopener noreferrer"` is present.
2. External news source link opens new tab with source label localized.

## RSS Aggregation
1. With proxy running: `/[locale]/noticias` lists items with images if available.
2. Without proxy (stop server): page should not crash—shows empty or fallback message.
3. Detail page for a non-existent slug shows localized not found messages.

## Accessibility & Semantics
1. Heading order: Each page starts with a single `h1`, subsections use `h2`.
2. Feature chips use list markup (`ul > li`).
3. Color contrast: Check blue links against white background (≥ WCAG AA). If insufficient, flag.

## Performance (Basic Smoke)
1. Lighthouse (or browser devtools) quick run: ensure images have correct dimensions & no large layout shifts.
2. Confirm no console errors (React hydration, missing keys, etc.).

## Security / Sanitization
1. News detail description: ensure no `<script>` tags rendered (replacement logic applied).
2. External URLs encoded (Google Maps queries) — verify `%20` present for spaces in queries.

## Regression After Changes
1. Add a new feature label to `alojamiento` and confirm slug -> translation fallback works (untranslated shows original string).
2. Remove a translation key intentionally (e.g., `features.popular`) and confirm UI falls back to original label.

## Checklist Completion Log
| Item | Status | Notes |
|------|--------|-------|
| Localization labels | Pending |  |
| Feature chips translation | Pending |  |
| Trails metrics | Pending |  |
| Tourism headings | Pending |  |
| News published date | Pending |  |
| Image fallback | Pending |  |
| External links rel attrs | Pending |  |
| RSS aggregation success | Pending |  |
| Not found page localization | Pending |  |
| Heading structure | Pending |  |
| Console errors absent | Pending |  |
| Script sanitization | Pending |  |
| Maps query encoding | Pending |  |
| Slug translation fallback | Pending |  |

Update the Status column as you verify each item.
