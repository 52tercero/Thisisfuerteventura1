# This is Fuerteventura

Small static site (HTML/CSS/JS) that aggregates news and presents content about Fuerteventura: tourism, beaches, accommodation, gastronomy, and more.

## Quick start (local dev)

Two terminals (PowerShell):

```powershell
# Terminal 1: start the RSS proxy (avoids CORS when fetching feeds)
cd server
npm install
npm start

# Terminal 2: serve the static site from the repo root
cd ..\
python -m http.server 8000
```

Open http://localhost:8000 in your browser.

Notes:
- The client auto-discovers the proxy on ports 3000..3010 via `js/proxy-discovery.js` using `/health`.
- If feeds are blocked by the proxy allowlist or the proxy is down, the UI shows friendly messages and still renders the controls.

## Pages
- `index.html` – hero + featured news
- `noticias.html` – full news list with filters, search, and pagination (top & bottom toolbars)
- `noticia.html` – single article view (requires `?id=` or `?title=`)
- `turismo.html`, `alojamiento.html`, `playas.html`, `gastronomia.html`, `contacto.html` – informational pages

## RSS proxy (server)
Located in `/server`. Requires Node 18+.

- Default port: 3000 (auto-increments to next ports if busy)
- Health: `GET /health`
- Feed proxy: `GET /api/rss?url=<encoded_feed_url>`
- Allowed sources: small allowlist by default; extend with env vars:

```powershell
# Allow all (dev only!)
$env:ALLOW_ALL = '1'
npm start

# Or extend allowlist for specific feeds
$env:ALLOWED_SOURCES = 'https://www.radioinsular.es/feed/,https://www.fuerteventuradigital.com/rss/'
npm start
```

## Troubleshooting
- Navigation disappears on desktop: fixed by applying collapse logic only on mobile widths (see `js/main.js`). Hard refresh with Ctrl+F5 if needed.
- News buttons not visible: CSS adds styles for `.news-filters` and `.pagination`. Pagination appears above and below the grid.
- Feeds not loading: start the proxy, or enable `ALLOW_ALL` for dev; check console for blocked sources.

## Security & data hygiene
- External feed content is sanitized (DOMPurify is used when available; fallback sanitizer is in JS).
- Do not deploy the proxy with `ALLOW_ALL` in production.

