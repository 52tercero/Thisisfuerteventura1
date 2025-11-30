# Technical Audit — thisisfuerteventura.es (2025-11-30)

## Scope
- Pages: Inicio, Noticias, Turismo, Alojamiento, Playas, Blog, Contacto
- Features: Mapa (Leaflet), Quiz, Cookies banner, Ambient sounds, RSS news

## Changes Applied
- Caching headers added in `_headers` for static assets (CSS/JS/images) with immutable cache; dynamic endpoints unaffected.
- GSAP + ScrollTrigger wired on `noticias.html` with `js/animations/news.js` for modular card animations.
- Local dev verified via VS Code tasks: proxy auto-switched to port 3002; static server running on 8000.

## Proposed (Pending Approval or Next Pass)
- Image optimization: convert heavy JPGs (e.g., `images/Fuerteventura.jpeg`) to AVIF/WEBP and update `<picture>` fallbacks; add explicit `width/height` on core images to reduce CLS.
- Reliability: add a dedicated `images/news-placeholder.jpg` and use graceful fallback in `toImageSrc()` when proxy fails; keep logo as secondary fallback.
- Weather/Ocean modules: add retries (2-3 attempts with backoff) and offline indicators; gate fetches with AbortController.
- Map modules: idempotent initialization guards and teardown to prevent leaks; defer tile layer load.
- Accessibility: ensure heading order, `aria-current` across nav, icon `aria-hidden`, and dark-mode contrast.
- Linting/CI: add ESLint+Prettier configs, minimal unit tests for map/quiz and e2e smoke for cookies consent.

## Deletions
- Dev-only pages previously removed: `test-dedupe.html`, `test-news-debug.html`, `alojamiento.html.backup` (not referenced).
- No new deletions in this pass. Before removing any assets (e.g., `images/turismo/*.avif`), a references graph will be generated.

## Notes
- CSP: `frame-ancestors` must be header-based; meta directive removed where present. `_headers` governs CSP.
- Service Worker: ensure caching static assets only; avoid caching dynamic news responses.

## Next Steps
- Approve image conversions and placeholder addition.
- Implement reliability and accessibility improvements.
- Add lint/test configs and smoke checks for CSP and broken links.
