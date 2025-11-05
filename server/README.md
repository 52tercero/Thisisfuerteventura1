# Fuerteventura News - RSS Proxy (dev)

Tiny Express proxy used for local development to fetch RSS feeds and return JSON, avoiding CORS issues when the client runs in the browser.

Requirements
- Node 18+ (uses global fetch)

Install & run (PowerShell)

```powershell
cd server
npm install
npm start
```

Usage
- Endpoint: `GET /api/rss?url=<encoded_feed_url>`
- Example: `http://localhost:3000/api/rss?url=https%3A%2F%2Fwww.canarias7.es%2Frss%2F2.0%2Fportada`

Security
- The proxy restricts allowed sources to a short allowlist (see `index.js`). Update `ALLOWED_SOURCES` to add new feeds.
- This server is intended for local development only. Do not deploy an open proxy to production.

Quick local smoke test (PowerShell)

From the project root (where index.html lives) run a simple static server and the proxy in parallel in two terminals:

```powershell
# Terminal 1: start the proxy
cd server
npm install
npm start

# Terminal 2: serve the static files (from project root)
cd ..\
python -m http.server 8000
```

Then open http://localhost:8000 in your browser. If the proxy is running and the feed URL is allowed, the client will fetch real feed items; otherwise the UI will show a 'No se pudieron cargar las noticias' or similar message indicating feeds are unavailable.

Port notes
- The proxy defaults to port 3000 (use `PORT` environment variable to override).
- If port 3000 is already in use, the server will try successive ports (3001, 3002, ...) up to 10 attempts and log which port it binds to.

If you prefer a fixed port, start with:

```powershell
# start on a specific port
$env:PORT = 3010
npm start
```

Allowlist and development options
- You can extend the allowed feed list via the `ALLOWED_SOURCES` environment variable (comma-separated URLs). Example:

```powershell
$env:ALLOWED_SOURCES = 'https://example.com/rss.xml,https://other.example/atom.xml'
npm start
```

- For quick local development only, you can enable `ALLOW_ALL` to accept any feed URL (NOT recommended for production):

```powershell
$env:ALLOW_ALL = '1'
npm start
```
