# GUÍA DE REORGANIZACIÓN DE CARPETAS

---

## ESTRUCTURA ACTUAL vs RECOMENDADA

### ACTUAL (Con Problemas):
```
Thisisfuerteventura/
├── 🔴 images/
│   ├── VideoHeader.mp4 (7.1 MB - SIN USAR)
│   ├── header_image.png (2.45 MB - GRANDE, SIN OPTIMIZAR)
│   ├── Fuerteventura.jpeg + Fuerteventura.webp (DUPLICADO)
│   ├── vistalobos.jpg + vistalobos.webp (DUPLICADO)
│   ├── logo.jpg + logo.webp (DUPLICADO)
│   ├── senderos/
│   │   ├── lobos.jpeg (ORIGINAL)
│   │   ├── 🔴 lobos copy.jpeg (DUPLICADO - ELIMINAR)
│   │   └── ... imágenes
│   └── turismo/
│       ├── betancuria.jpg (1.69 MB - VIEJO)
│       ├── betancuria.webp (0.31 MB - NUEVO)
│       ├── 🔴 tindaya-reoptimized.webp (VERSIÓN ANTERIOR)
│       ├── ... más duplicados JPG/WEBP
│       └── (Mucha redundancia)
│
├── 🔴 js/
│   ├── 🔴 test-dedupe.js (ELIMINAR)
│   ├── 🔴 test-news-debug.js (ELIMINAR)
│   ├── 🔴 news.js (SIN USAR)
│   ├── 🔴 dark-mode.js (SIN USAR)
│   ├── 🔴 i18n.js (SIN USAR)
│   ├── (51 archivos totales)
│   └── ... resto bien organizado
│
├── css/
│   ├── 🔴 test.css (ELIMINAR)
│   ├── styles.css (114 KB - SIN MINIFICAR)
│   └── header.css
│
├── data/
│   └── ✅ Bien organizado
│
├── server/
│   ├── 🔴 test-dedupe.js (ELIMINAR)
│   ├── 🔴 test-response.json (232 KB - ELIMINAR)
│   └── ✅ Resto OK
│
└── ✅ Otros directorios OK
```

---

### RECOMENDADA (Optimizada):

```
Thisisfuerteventura/
├── 📄 HTML (14 archivos)
│   ├── index.html
│   ├── noticias.html
│   └── ... (resto igual)
│
├── 🎨 css/
│   ├── styles.css (minificado)
│   ├── header.css
│   └── [ELIMINADO: test.css]
│
├── 🔧 js/ (46 archivos después de limpiar)
│   ├── main.js
│   ├── content-loader.js
│   ├── ... (solo archivos útiles)
│   │
│   ├── 📁 animations/
│   │   ├── hero.js
│   │   ├── narrative.js
│   │   ├── news.js
│   │   ├── gsap.js
│   │   └── orbital-camera.js
│   │
│   ├── 📁 scenes/
│   │   ├── mapa.js
│   │   ├── playas.js
│   │   ├── realistic.js
│   │   └── volcan.js
│   │
│   ├── 📁 components/
│   │   └── Header.js
│   │
│   ├── 📁 optimization/
│   │   └── performance.js
│   │
│   └── [ELIMINADOS: test-*.js, news.js, dark-mode.js, i18n.js]
│
├── 📸 images/ (Reorganizada, sin duplicados)
│   ├── 🎬 media/
│   │   ├── header-image.webp (convertida de PNG)
│   │   └── logo.webp (preferida)
│   │
│   ├── 🏨 turismo/ (20 imágenes, WEBP sólo)
│   │   ├── betancuria.webp (mantener)
│   │   ├── caleta-de-fuste.webp
│   │   └── ... (NO JPGs viejos)
│   │   [ELIMINADOS: JPGs duplicados = -2.5 MB]
│   │   [ELIMINADO: tindaya-reoptimized.webp = -147 KB]
│   │
│   ├── 🏖️ playas/ (imágenes optimizadas)
│   │   └── ... 
│   │   [ELIMINADO: esquinzo.jpeg - revisar uso]
│   │
│   ├── 🥾 senderos/ (imágenes trail)
│   │   ├── lobos.jpeg
│   │   ├── ... resto
│   │   [ELIMINADO: lobos copy.jpeg = -13 KB]
│   │
│   ├── 🏨 alojamiento/
│   ├── 🍽️ gastronomia/
│   ├── 🏪 restaurantes/
│   └── 🎯 logos/
│   
│   [ELIMINADO: VideoHeader.mp4 - no usado = -7.1 MB]
│
├── 📊 data/
│   ├── feeds.json
│   ├── turismo.json
│   ├── blog.json
│   ├── senderos.json
│   ├── 🔗 structured/ (JSON-LD SEO)
│   └── 🗺️ gpx/
│
├── 🌐 netlify/
│   └── functions/ (RSS proxy, image, etc)
│
├── 🔌 server/
│   ├── index.js
│   ├── package.json
│   ├── package-lock.json
│   ├── jest.config.js
│   └── tests/
│   [ELIMINADOS: test-dedupe.js, test-response.json]
│
├── ⚙️ .vscode/
├── 📋 Config files (netlify.toml, robots.txt, etc)
└── 📖 Documentación (README.md, AUDIT.md, etc)
```

---

## 🗑️ ELIMINACIONES ESPECÍFICAS

### Por Carpeta:

#### `images/`:
```bash
# ELIMINAR estos archivos duplicados/innecesarios:
rm images/senderos/lobos\ copy.jpeg
rm images/turismo/tindaya-reoptimized.webp
rm images/VideoHeader.mp4

# CONSIDERAR ELIMINAR (revisar uso primero):
# Todos los *.jpg en turismo/ si existe *.webp equivalente
# - images/turismo/betancuria.jpg (VIEJO, mantener WEBP)
# - images/turismo/caleta-de-Fuste.jpg (VIEJO)
# - images/turismo/isla-de-lobos.jpg (VIEJO)
# ... etc
```

#### `css/`:
```bash
# ELIMINAR archivo test
rm css/test.css

# OPTIMIZAR
# minify css/styles.css (usar cssnano, clean-css, etc)
```

#### `js/`:
```bash
# ELIMINAR archivos de test/debug
rm js/test-dedupe.js
rm js/test-news-debug.js

# AUDITAR (antes de eliminar, revisar dependencias):
# js/news.js (16 KB) - ¿se usa?
# js/dark-mode.js (2.8 KB) - ¿se usa?
# js/i18n.js (1.6 KB) - ¿se usa?
```

#### `server/`:
```bash
# ELIMINAR archivos test/mock
rm server/test-dedupe.js
rm server/test-response.json
```

---

## 📐 REORGANIZACIÓN DE IMÁGENES

### Patrón de Nombrado Recomendado:
```
images/
├── media/
│   ├── logo.webp (o .svg para mejor escalado)
│   ├── header-image.webp
│   └── favicon.* (ya existe)
│
├── turismo/
│   ├── el-cotillo/
│   │   └── el-cotillo.webp
│   ├── betancuria/
│   │   └── betancuria.webp
│   └── [EVITAR: duplicados por formato]
│
├── playas/
│   ├── ajuy.webp
│   ├── cofete.webp
│   └── ...
│
├── senderos/
│   ├── calderon-hondo.webp (o .jpg si es necesario)
│   ├── lobos.webp
│   └── ...
```

### Beneficios de la Reorganización:
- ✅ Estructura clara y consistente
- ✅ Fácil de mantener
- ✅ Reduce duplicados
- ✅ Mejora carga de imágenes
- ✅ Mejor caché del navegador

---

## 💾 OPTIMIZACIÓN DE FORMATOS

### Conversión Recomendada:

| Archivo Actual | Formato Actual | Recomendado | Herramienta | Ahorro |
|---|---|---|---|---|
| `header_image.png` | PNG | WEBP | cwebp | ~60% |
| `turismo/*.jpg` | JPG | WEBP | cwebp | ~50% |
| `playas/*.jpeg` | JPEG | WEBP | cwebp | ~50% |
| `senderos/*.jpeg` | JPEG | WEBP | cwebp | ~50% |

### Script de Conversión:
```bash
# Convertir PNG a WEBP
cwebp images/header_image.png -o images/media/header_image.webp -q 80

# Convertir JPG a WEBP (lote)
for file in images/turismo/*.jpg; do
  cwebp "$file" -o "${file%.jpg}.webp" -q 80
done

# Verificar calidad/tamaño
ls -lh images/turismo/*.webp | head
```

---

## 📦 CONSOLIDACIÓN DE MÓDULOS

### Antes:
```javascript
// 3 archivos separados, 73 KB total
js/content-loader.js (21 KB)
js/feed-utils.js (24 KB)
js/image-extractor.js (13 KB)
```

### Después (Opcional):
```javascript
// 1 módulo consolidado, ~65 KB con optimizaciones
js/modules/rss-loader/
  ├── index.js (orquestador)
  ├── content-loader.js
  ├── feed-utils.js
  ├── image-extractor.js
  └── package.json (dependencias locales)
```

### Beneficios:
- Mejor modularización
- Caché compartida
- Fácil de actualizar
- Ahorro de carga: ~8 KB

---

## 🎯 PLAN DE IMPLEMENTACIÓN

### Fase 1 (Limpieza - 5 min):
```bash
rm images/senderos/lobos\ copy.jpeg          # 13 KB
rm css/test.css                              # 1.78 KB
rm js/test-dedupe.js                         # 4.43 KB
rm js/test-news-debug.js                     # 5.67 KB
rm server/test-dedupe.js                     # 2.54 KB
rm server/test-response.json                 # 231 KB
rm images/turismo/tindaya-reoptimized.webp   # 147 KB
```
**Resultado**: -406 KB

### Fase 2 (Optimización de Imágenes - 1 hora):
```bash
# Convertir PNG a WEBP
cwebp images/header_image.png -o images/media/header_image.webp -q 80
# Resultado: -1.5 MB

# Eliminar JPGs viejos (si existe WEBP equivalente)
# Resultado: -2.5 MB
```
**Resultado**: -4 MB total

### Fase 3 (Minificación CSS - 15 min):
```bash
# Minificar CSS
node -e "require('cssnano')..." css/styles.css > css/styles.min.css
# Resultado: -30 KB
```

### Fase 4 (Auditoría JS - 1 hora):
```bash
# Verificar scripts sin referencias
grep -r "news.js\|dark-mode.js\|i18n.js" *.html
# Si no hay referencias: eliminar
```
**Resultado**: -20 KB

### Fase 5 (Reorganización Final - 30 min):
```bash
# Reorganizar images/ según estructura recomendada
# Actualizar referencias en CSS/HTML si es necesario
```

---

## ✅ VERIFICACIÓN POST-LIMPIEZA

### Checklist:
- [ ] Los 7 test files han sido eliminados
- [ ] Ningún HTML está roto (probar con Live Server)
- [ ] Las imágenes todavía se cargan correctamente
- [ ] CSS/JS todavía funcionan
- [ ] Tamaño total reducido a ~11-12 MB (desde 19.6 MB)

### Comandos de Verificación:
```bash
# Verificar tamaño nuevo
du -sh .                          # Total
du -sh images/ js/ css/ data/     # Por carpeta

# Verificar que no hay referencias rotas
grep -r "test-dedupe\|test-news\|lobos copy\|tindaya-reoptimized" *.html

# Buscar console errors
# Abrir en navegador y revisar console
```

---

## 📊 COMPARATIVA ANTES/DESPUÉS

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Tamaño Total | 19.6 MB | ~8-9 MB | **55% ↓** |
| Imágenes | 14.9 MB | ~8-9 MB | **40% ↓** |
| JavaScript | 359 KB | 330 KB | **8% ↓** |
| CSS | 123 KB | ~90 KB | **27% ↓** |
| Test Files | 406 KB | 0 KB | **100% ↓** |

---

**Generado**: 30 de Noviembre de 2025
