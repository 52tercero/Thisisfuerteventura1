# Despliegue en Netlify (This is Fuerteventura)

Este documento resume cómo desplegar el sitio estático en Netlify y habilitar Functions como proxy para las noticias (RSS y newsdata.io), evitando problemas de CORS.

## Resumen

- El sitio es 100% estático (HTML/CSS/JS). Se puede servir tal cual.
- Las noticias (RSS) requieren un proxy. Aquí usamos Netlify Functions:
  - Endpoints expuestos bajo `/.netlify/functions/api/*`:
    - `GET /.netlify/functions/api/health`
    - `GET /.netlify/functions/api/rss?url=<feed_url_codificado>`
    - `GET /.netlify/functions/api/aggregate?sources=url1,url2&dedupe=1&noCache=1`
    - `GET /.netlify/functions/api/newsdata?q=fuerteventura&country=es&language=es`
- El frontend detecta automáticamente las Functions y usa `window.__RSS_PROXY_URL = origin + '/.netlify/functions'`.

## Estructura relevante

- `netlify/functions/api.js`: implementación del proxy (Node 18+, `fetch` nativo y `xml2js`).
- `netlify.toml`: configuración de Netlify (publish `.` y functions `netlify/functions`).
- `index.html` y `noticias.html`: snippet que detecta `/.netlify/functions/api/health` y activa el proxy.

## Pasos para desplegar

1) Conectar el repo en Netlify
- Netlify > Add new site > Import an existing project > GitHub > selecciona el repo.
- Branch: `main` (tras hacer merge del PR).

2) Configurar build
- Build command: vacío (sitio estático).
- Publish directory: `.` (raíz del repo).
- Functions directory: `netlify/functions` (Netlify lo detecta también desde `netlify.toml`).
- Node version: 18 (se establece en `netlify.toml`).

3) Variables de entorno (Settings > Environment)
- `ALLOWED_SOURCES` (opcional, recomendado): lista separada por comas con prefijos de URLs de feeds permitidos (además de los que ya vienen por defecto).
- `NEWSDATA_API_KEY` (opcional): para habilitar el endpoint de `newsdata.io`.
- `ALLOW_ALL` (NO recomendado en prod): si se establece a `1`, el proxy acepta cualquier URL (solo para pruebas).
- `CACHE_TTL_MS` (opcional): TTL del caché en memoria de la Function (por defecto ~15 min).

4) Deploy
- Haz Deploy desde Netlify.
- Abre la URL pública. El frontend probará `/.netlify/functions/api/health`; si responde OK, usará el proxy automáticamente.

## Verificación rápida

- Portada (`index.html`): la sección "Destacados" debería mostrar artículos reales.
- `noticias.html`: debería listar noticias con paginación y filtros.
- Si ves "No se pudieron cargar las noticias":
  - Abre la consola del navegador y comprueba que `window.__RSS_PROXY_URL` apunta a `/.netlify/functions`.
  - Asegúrate de que la fuente del feed esté en `ALLOWED_SOURCES` o activa temporalmente `ALLOW_ALL` para probar.
  - Revisa los logs de Functions en Netlify (Deploy > Functions > Logs).

## Desarrollo local (opcional)

Con Netlify CLI puedes probar sitio + Functions en local:

```powershell
npm install
npm install -g netlify-cli
netlify dev
```

- La CLI expondrá `/` para el sitio y `/.netlify/functions/api/*` para las Functions.
- El snippet en HTML detectará `/.netlify/functions/api/health` local y usará el proxy.

## Seguridad y buenas prácticas

- Mantén `ALLOWED_SOURCES` reducido a dominios conocidos. Evita `ALLOW_ALL` en producción.
- Los contenidos externos se insertan sanitizados (DOMPurify en el cliente). Aun así, valida si introduces nuevas fuentes.
- El caché en memoria de la Function es volátil (depende de instancias "calientes"). No garantiza persistencia.

## Personalización

- Añadir fuentes: agrega prefijos a `ALLOWED_SOURCES` en Netlify.
- Ajustar caché: cambia `CACHE_TTL_MS` en env vars.
- Cambiar orden o cantidad de items en portada/listado: editar plantillas en `js/content-loader.js`.

## Dominio propio

- Netlify > Domain management > Add custom domain.
- Actualiza DNS según las indicaciones.
- HTTPS automático incluido.
- Recuerda ajustar `sitemap.xml` y `robots.txt` si cambias la URL canónica.

---

Cualquier duda, abre un issue en el repo o revisa los logs de Netlify Functions para diagnósticos de feeds.
