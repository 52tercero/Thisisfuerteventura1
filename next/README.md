# This is Fuerteventura (Next.js)

Dev quickstart:

```powershell
pwsh -NoProfile -NoLogo
Push-Location "C:\Users\bruno\OneDrive\Documentos\Thisisfuerteventura\next"
npm install
$env:NODE_OPTIONS="--no-deprecation"
$env:PORT=3001
npm run dev
Start-Process http://127.0.0.1:3001
```

Planned structure:
- Home with hero video, featured news timeline (Swiper).
- /noticias SSR list (pagination, filters, search).
- /noticia/[slug] SSR article.
- /turismo, /senderos, /playas, /alojamiento from JSON.
- i18n via next-intl using existing i18n/*.json.
- RSS aggregate via server route consuming existing proxy.

Netlify headers are defined in repo root `netlify.toml`.
Tailwind is configured (`tailwind.config.ts`, `postcss.config.js`) and loaded via `src/app/globals.css`.
