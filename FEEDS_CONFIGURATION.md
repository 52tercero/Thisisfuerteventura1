# CONFIGURACIÓN DE FEEDS RSS - RESUMEN

## Estructura Actual de Carga de Feeds

El proyecto Fuerteventura tiene dos puntos de carga de feeds RSS diferentes según la página:

---

## 1. PORTADA (index.html)

**Archivo**: `js/content-loader.js`  
**Función Principal**: `loadFeaturedNews()`  
**Variable Clave**: `HOMEPAGE_NEWS_SOURCES`

### URLs Configuradas

```javascript
const HOMEPAGE_NEWS_SOURCES = [
  'https://rss.app/feeds/jbwZ2Q9QAvgvI6G0.xml',
  'https://rss.app/feeds/8SmCQL7GDZyu2xB4.xml'
];
```

### Características

- **Múltiples fuentes**: 2 feeds RSS
- **Máximo de items mostrados**: 12 noticias destacadas (línea ~239)
- **Ordenamiento**: Descendente por fecha (más recientes primero)
- **Renderizado**: 
  - Primero intenta cargar snapshot estático desde `/data/feeds.json` (si `ENABLE_SNAPSHOT = true`)
  - Luego carga feeds vivos mediante `FeedUtils.fetchRSSFeeds()`
  - Fallback: proxy local en `http://localhost:3000/api/aggregate`
- **Proxy de imágenes**: Convierte URLs de imagen a través de proxy (Netlify Functions o local)
- **Caché**: No usa caché (`noCache: true`)

### Flujo de Carga

```
┌─ Detectar proxy (discoverRSSProxy)
│
├─ Intentar snapshot estático (/data/feeds.json)
│
├─ FeedUtils.fetchRSSFeeds(HOMEPAGE_NEWS_SOURCES)
│  └─ Con { noCache: true, progressive: true }
│
└─ Fallback: http://localhost:3000/api/aggregate
   └─ Con fuentes codificadas como query param
```

---

## 2. PÁGINA DE NOTICIAS (noticias.html)

**Archivo**: `js/news.js`  
**Función Principal**: `loadFullNewsPage()`  
**Variable Clave**: `NOTICIAS_NEWS_SOURCE`

### URLs Configuradas

```javascript
const NOTICIAS_NEWS_SOURCE = 'https://rss.app/feeds/jbwZ2Q9QAvgvI6G0.xml';
const activeNewsSources = [NOTICIAS_NEWS_SOURCE];
```

### Características

- **Única fuente**: 1 feed RSS (compartida con portada como base común)
- **Máximo por página**: 9 noticias (paginación)
- **Ordenamiento**: Descendente por fecha
- **Renderizado**: 
  - Intenta snapshot de `/data/feeds.json`
  - Luego carga mediante `FeedUtils.fetchRSSFeeds()`
  - Fallback: proxy local
- **Búsqueda**: Filtrado por título, resumen y tags
- **Caché**: Usa caché por defecto (`noCache: forceRefresh`)
- **Funcionalidades extras**:
  - Paginación (9 items por página)
  - Búsqueda/filtrado
  - Lectura de artículos completos

### Flujo de Carga

```
┌─ Detectar proxy (discoverRSSProxy)
│
├─ Intentar snapshot estático (/data/feeds.json)
│
├─ FeedUtils.fetchRSSFeeds(NOTICIAS_NEWS_SOURCE)
│  └─ Con { noCache: forceRefresh, progressive: true }
│
└─ Fallback: http://localhost:3000/api/aggregate
   └─ Con fuente única codificada
```

---

## Diferencias Clave

| Aspecto | Portada (index.html) | Noticias (noticias.html) |
|---------|----------------------|--------------------------|
| **URL Fuente** | 2 feeds | 1 feed |
| **Items Mostrados** | 12 (máximo) | 9 por página |
| **Paginación** | No | Sí |
| **Búsqueda** | No | Sí |
| **Snapshot Estático** | Desactivado (ENABLE_SNAPSHOT=false) | Sí (si existe /data/feeds.json) |
| **Caché** | Siempre sin caché (noCache:true) | Con caché (noCache:forceRefresh) |
| **Objetivo** | Mostrar destacados | Listar completo + interacción |

---

## URLs de Feeds RSS

### Feed 1: jbwZ2Q9QAvgvI6G0.xml
```
https://rss.app/feeds/jbwZ2Q9QAvgvI6G0.xml
```
**Usado en**: Portada + Noticias  
**Estado**: Verificado en smoke test  

### Feed 2: 8SmCQL7GDZyu2xB4.xml
```
https://rss.app/feeds/8SmCQL7GDZyu2xB4.xml
```
**Usado en**: Solo Portada  
**Estado**: Verificado en smoke test  

---

## Flujo de Fallback (Proxy)

Si `FeedUtils` no está disponible, ambas páginas intentan usar el proxy local:

**Portada**:
```
http://localhost:3000/api/aggregate?sources=jbwZ2Q9QAvgvI6G0.xml,8SmCQL7GDZyu2xB4.xml
```

**Noticias**:
```
http://localhost:3000/api/aggregate?sources=jbwZ2Q9QAvgvI6G0.xml
```

---

## Proxy Local (server/index.js)

El servidor Netlify en `server/` proporciona:

1. **Endpoint de Agregación**:
   ```
   GET /api/aggregate?sources=URL1,URL2,...
   ```
   - Parsea RSS/Atom feeds
   - Retorna JSON normalizado
   - Soporta múltiples fuentes

2. **Endpoint de Imagen**:
   ```
   GET /api/image?url=EXTERNAL_URL
   ```
   - Proxifica imágenes externas
   - Evita CORS issues

3. **Descubrimiento**:
   ```
   GET /health
   ```
   - Verifica disponibilidad del proxy
   - Detectado por `discoverRSSProxy()`

---

## Actualizar URLs de Feeds

### Para cambiar feed de Portada

Editar `js/content-loader.js`:

```javascript
const HOMEPAGE_NEWS_SOURCES = [
  'https://rss.app/feeds/NEW_ID_1.xml',
  'https://rss.app/feeds/NEW_ID_2.xml'  // Agregar/modificar segundo feed
];
```

### Para cambiar feed de Noticias

Editar `js/news.js`:

```javascript
const NOTICIAS_NEWS_SOURCE = 'https://rss.app/feeds/NEW_ID.xml';
```

---

## Testing de Feeds

### Smoke Test Incluido

```bash
pwsh -NoProfile -NonInteractive -File tools/smoke-aggregate.ps1
```

Valida que ambas URLs responden correctamente.

### Prueba Manual

```javascript
// En browser console

// Cargar portada
const items = await FeedUtils.fetchRSSFeeds([
  'https://rss.app/feeds/jbwZ2Q9QAvgvI6G0.xml',
  'https://rss.app/feeds/8SmCQL7GDZyu2xB4.xml'
]);

// Cargar noticias
const items2 = await FeedUtils.fetchRSSFeeds([
  'https://rss.app/feeds/jbwZ2Q9QAvgvI6G0.xml'
]);
```

---

## Nota Importante

**Ambas URLs son de rss.app**, un servicio que genera feeds RSS desde varios orígenes. El ID único en cada URL especifica la fuente:

- `jbwZ2Q9QAvgvI6G0` = Feed configurado 1
- `8SmCQL7GDZyu2xB4` = Feed configurado 2

Puedes verificar o modificar estas fuentes en https://rss.app/

---

## Síntesis

| Página | Variable | URLs | Items | Función |
|--------|----------|------|-------|---------|
| **index.html** | `HOMEPAGE_NEWS_SOURCES` | 2 URLs | 12 | Portada destacados |
| **noticias.html** | `NOTICIAS_NEWS_SOURCE` | 1 URL | 9/página | Listado completo |

✅ Ambas páginas tienen configuración claramente separada y documentada.
