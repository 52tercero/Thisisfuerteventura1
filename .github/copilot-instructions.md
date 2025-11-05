## Repository overview

- This is a small static site (HTML/CSS/JS) for Fuerteventura news. Main pages: `index.html`, `noticias.html`, `noticia.html`.
- Client-side code lives in `js/` (notably `js/content-loader.js`, `js/main.js`, `js/news.js`). Styles are in `css/styles.css` and images under `images/`.

## Big picture architecture (what an agent should know)

- No backend in the repo: the client attempts to fetch RSS via a local proxy (see `server/`). Real RSS feed URLs are listed in the `newsSources` array but fetching directly from the browser will hit CORS limits — run the proxy locally to fetch real feeds.
- Key client flows:
  - Homepage: `loadFeaturedNews()` writes into `#featured-news`.
  - News index: `loadFullNewsPage()` populates `#news-container` with pagination, filtering and search controls (buttons/inputs by id: `prev-page`, `next-page`, `page-info`, `category-filter`, `date-filter`, `apply-filters`, `news-search`, `search-btn`).
  - Single article: `loadSingleNews()` writes into `#article-container` and supports `?id=` or `?title=` query params.

## Project-specific patterns & conventions

- Dates use Spanish locale via `formatDate(...).toLocaleDateString('es-ES', ...)`.
- Templates are built with innerHTML (e.g., card markup in `loadFeaturedNews` and `loadFullNewsPage`) — if you wire real external data, sanitize to avoid XSS.
- Note: This project no longer includes simulated demo news. If the proxy is not running or feeds are blocked, the UI will show friendly messages like `No se pudieron cargar las noticias`.
- Pagination: `itemsPerPage` is defined in `loadFullNewsPage()` (currently 9). Sorting uses a `currentSort` value of `'newest'` or the reverse.

## Where to change behavior / integration points

- Add real RSS/API integration: update `newsSources` and move fetch logic server-side (to avoid CORS) or implement a server proxy. See `fetchRSSFeeds()` (top of `js/content-loader.js`).
- Change auto-refresh frequency: `setupAutoRefresh()` sets interval to 30 minutes (30 * 60 * 1000).
- Adjust UI or templates by editing the DOM fragments in `loadFeaturedNews`, `loadFullNewsPage`, and `loadSingleNews`.

## Tests, builds, and dev workflow (what works here)

- No build system or npm config in the repo — it's a file-based static site. To preview, use a simple static server (Live Server extension or):

  - From PowerShell (Windows):

    python -m http.server 8000

  - Or use VS Code Live Server to get correct file:// -> http:// serving (required for fetch/XHR).

- Manual test checklist an agent can use:
  - Open `index.html` -> ensure `#featured-news` shows real feed items when the proxy is running; otherwise a clear "no news available" message should appear.
  - Open `noticias.html` -> test pagination, category filter, search box, prev/next buttons.
  - Open `noticia.html?id=1` and `noticia.html?title=...` -> verify article renders in `#article-container`.

## Safety and security notes for real data integration

- When replacing simulated HTML with feed content, escape or sanitize all external strings before inserting into `innerHTML`.
- Avoid performing RSS fetches directly from the browser in production; use a backend endpoint that returns normalized JSON.

## Useful file references (quick jump targets)

- `js/content-loader.js` — core of all news loading logic (featured, full list, single article). Search for functions `loadFeaturedNews`, `loadFullNewsPage`, `loadSingleNews`, `fetchNews`, and `fetchRSSFeeds`.
- `index.html`, `noticias.html`, `noticia.html` — the pages wired to the JS loaders and expected DOM IDs.
- `css/styles.css` — UI classes used by templates: `.content-card`, `.news-card`, `.category-tag`, `.loading`, `.no-results`, `.news-image`, `.news-content`.

## Short contract for an AI agent working here

- Inputs: small changes to client JS, HTML templates, or wiring a server-side proxy for RSS.
- Outputs: updated JS/HTML/CSS, minimal server proxy example (optional) and manual test steps.
- Error modes: respect CORS limits; if fetch fails, UI shows error messages such as `No se pudieron cargar las noticias` or `Error al cargar las noticias` in `js/content-loader.js`.

---

If you'd like, I can: (a) add a tiny example server proxy (`express` or Python Flask) to demonstrate fetching RSS without CORS, or (b) expand the file with explicit code snippets to sanitize HTML templates. Which would you prefer? 
