# ANÁLISIS DETALLADO DE SCRIPTS JAVASCRIPT

---

## 📊 INVENTARIO COMPLETO DE JS

### Total: 51 archivos, 359 KB

---

## ✅ SCRIPTS ACTIVOS Y USADOS

### Core Application (Cargados en múltiples páginas):

| Archivo | Tamaño | Cargado en | Función |
|---------|--------|-----------|---------|
| `main.js` | 23.34 KB | Todas las páginas | Menú móvil, formulario newsletter, smooth scroll |
| `cookies.js` | 8.51 KB | Múltiples | Gestión de consentimiento de cookies |
| `scroll-animations.js` | 0.10 KB | Múltiples | Animaciones en scroll |
| `ux.js` | 4.08 KB | Múltiples | Mejoras UX general |
| `sand-write.js` | 3.06 KB | Múltiples | ¿Escritura de arena? (necesita clarificación) |

### Content Loaders (RSS/Noticias):

| Archivo | Tamaño | Cargado en | Función |
|---------|--------|-----------|---------|
| `content-loader.js` | 21.28 KB | index, playas, turismo, alojamiento | Carga RSS feeds |
| `feed-utils.js` | 24.47 KB | index, playas, turismo, alojamiento | Utilidades para RSS |
| `article-loader.js` | 15.57 KB | noticia.html | Carga artículos individuales |
| `image-extractor.js` | 12.66 KB | index, playas, turismo, alojamiento | Extrae imágenes de feeds |

### Specific Features:

| Archivo | Tamaño | Cargado en | Función |
|---------|--------|-----------|---------|
| `news.js` | 16.11 KB | ❌ NINGUNA | ⚠️ **POTENCIALMENTE OBSOLETO** |
| `quiz.js` | 11.60 KB | quiz.html | Lógica de quiz |
| `blog.js` | 3.80 KB | blog.html, blog-post.html | Funcionalidad de blog |
| `senderos.js` | 3.79 KB | senderos.html | Gestión de senderos/rutas |
| `booking.js` | 2.92 KB | alojamiento.html | Sistema de reservas |
| `turismo-detalle.js` | 7.30 KB | turismo-detalle.html | Detalles de atracción turística |
| `facebook-feed.js` | 1.87 KB | blog.html | Feed de Facebook |

### Navigation & UI:

| Archivo | Tamaño | Cargado en | Función |
|--------|--------|-----------|---------|
| `proxy-discovery.js` | 2.90 KB | playas, turismo, alojamiento, index | Descubre proxy RSS |
| `hero-header.js` | 1.14 KB | index | Animación hero header |
| `parallax-scroll.js` | 2.78 KB | index | Efecto parallax |
| `swiper-init.js` | 1.73 KB | index | Inicializa Swiper carousel |
| `accessibility-toggle.js` | 0.61 KB | index | Toggle accesibilidad |

### Utilities & Features:

| Archivo | Tamaño | Cargado en | Función |
|--------|--------|-----------|---------|
| `fetch-with-retry.js` | 5.16 KB | playas | Fetch con reintentos |
| `form-validation.js` | 1.16 KB | contacto | Validación de formularios |
| `analytics.js` | 1.46 KB | ❓ Verificar | Analytics/tracking |
| `interactive-map.js` | 6.08 KB | ❓ Verificar | Mapa interactivo |
| `map.js` | 0.99 KB | turismo | Mapa turismo |
| `map-keyboard.js` | 5.84 KB | ❓ Verificar | Navegación mapa con teclado |
| `gamification.js` | 4.70 KB | ❓ Verificar | Sistema de gamificación |
| `playas-widgets.js` | 8.04 KB | playas | Widgets de playas |
| `performance.js` | 9.24 KB | optimization/ | Monitoreo rendimiento |
| `i18n.js` | 1.58 KB | ❌ NINGUNA | 🔴 **NO UTILIZADO** |
| `dark-mode.js` | 2.83 KB | ❌ NINGUNA | 🔴 **NO UTILIZADO** |
| `realtime.js` | 7.96 KB | ❓ Parcial | ⚠️ Verificar uso |
| `real-time-data.js` | 5.46 KB | ❓ Parcial | ⚠️ Verificar uso |

### Animations (GSAP-based):

| Archivo | Tamaño | Cargado en | Función |
|--------|--------|-----------|---------|
| `animations.js` | 4.06 KB | playas, turismo, alojamiento, index | Orquestador de animaciones |
| `animations/hero.js` | 2.42 KB | index | Animaciones hero |
| `animations/narrative.js` | 4.95 KB | ❓ Verificar | Narrativa visual |
| `animations/news.js` | 0.86 KB | ❓ Verificar | Animaciones de noticias |
| `animations/gsap.js` | 7.92 KB | ❓ Verificar | Base GSAP |
| `animations/orbital-camera.js` | 10.83 KB | ❓ Verificar | Cámara orbital 3D |

### Scene/3D Management:

| Archivo | Tamaño | Cargado en | Función |
|--------|--------|-----------|---------|
| `scenes/mapa.js` | 6.27 KB | ❓ Verificar | Escena de mapa |
| `scenes/playas.js` | 4.89 KB | ❓ Verificar | Escena de playas |
| `scenes/realistic.js` | 19.85 KB | ❓ Verificar | Escena realista 3D |
| `scenes/volcan.js` | 6.94 KB | ❓ Verificar | Escena volcán 3D |

### Components:

| Archivo | Tamaño | Cargado en | Función |
|--------|--------|-----------|---------|
| `components/Header.js` | 13.29 KB | playas, turismo, alojamiento, index | Componente header |

### Utilities:

| Archivo | Tamaño | Cargado en | Función |
|--------|--------|-----------|---------|
| `narrative-scroll.js` | 3.89 KB | alojamiento | Scroll narrativo |

---

## 🔴 ARCHIVOS DE TEST A ELIMINAR

| Archivo | Tamaño | Razón | Acción |
|---------|--------|-------|--------|
| `test-dedupe.js` | 4.43 KB | Test de deduplicación | **ELIMINAR** |
| `test-news-debug.js` | 5.67 KB | Debug de noticias | **ELIMINAR** |

---

## ⚠️ ARCHIVOS POTENCIALMENTE OBSOLETOS

### No encontrados en NINGÚN HTML:

```javascript
js/news.js (16.11 KB)
js/dark-mode.js (2.83 KB)
js/i18n.js (1.58 KB)
```

**Recomendación**: Revisar historial git, si no hay commits recientes = ELIMINAR

### Parcialmente usado (Verificar necesidad):

```javascript
js/realtime.js (7.96 KB) - ¿Real-time updates?
js/real-time-data.js (5.46 KB) - ¿Para realtime.js?
js/gamification.js (4.70 KB) - ¿Sistema de puntos/badges?
```

### Archivos de animaciones sin carga clara:

```javascript
animations/narrative.js (4.95 KB)
animations/orbital-camera.js (10.83 KB)
animations/gsap.js (7.92 KB)
scenes/realistic.js (19.85 KB)
scenes/volcan.js (6.94 KB)
scenes/mapa.js (6.27 KB)
scenes/playas.js (4.89 KB)
```

**Nota**: Estos podrían ser importados dinámicamente por `animations.js`

---

## 📊 ESTADÍSTICAS POR CATEGORÍA

```
Core/Essential:      104 KB (29%)
├─ main.js, cookies, scroll-animations, ux, sand-write

Content Loaders:     73 KB (20%)
├─ content-loader, feed-utils, article-loader, image-extractor

Page-Specific:       39 KB (11%)
├─ quiz, blog, senderos, booking, turismo-detalle, facebook-feed

Utilities:           42 KB (12%)
├─ fetch-with-retry, form-validation, analytics, maps, gamification, etc

Animations:          39 KB (11%)
├─ animations.js + subdirectorio

Components:          13 KB (4%)
├─ Header.js

Scenes/3D:           38 KB (11%)
├─ Todos los archivos en scenes/

Test (ELIMINAR):     10 KB (3%)
├─ test-dedupe.js, test-news-debug.js

Obsoletos (REVISAR): 26 KB (7%)
├─ news.js, dark-mode.js, i18n.js, realtime, real-time-data
```

---

## 🎯 RECOMENDACIONES POR SCRIPT

### Tier 1: Mantener (Críticos)
- ✅ main.js
- ✅ content-loader.js, feed-utils.js, article-loader.js, image-extractor.js
- ✅ cookies.js
- ✅ Todos los loaders específicos de página

### Tier 2: Revisar (Potencialmente Duplicados)
- ⚠️ realtime.js + real-time-data.js (¿mismo propósito?)
- ⚠️ Revisar si animations/* están siendo usado

### Tier 3: Eliminar (Sin uso)
- 🔴 js/test-dedupe.js (4.43 KB)
- 🔴 js/test-news-debug.js (5.67 KB)
- 🔴 js/news.js (16.11 KB) - si no se usa
- 🔴 js/dark-mode.js (2.83 KB) - si no se usa
- 🔴 js/i18n.js (1.58 KB) - si no se usa

---

## 💡 RECOMENDACIONES DE REFACTORIZACIÓN

### 1. Consolidar Loaders
```javascript
// Considerar fusionar:
- content-loader.js
- feed-utils.js
- image-extractor.js

// En un módulo contenedor:
- modules/rss-loader.js
```

### 2. Modularizar Animaciones
```javascript
// Las escenas podrían cargarse dinámicamente:
- animations.js como orquestador
- scenes/* cargados on-demand

// Beneficio: Ahorrar 40+ KB en carga inicial
```

### 3. Eliminar Duplicados
```javascript
// Si realtime.js y real-time-data.js hacen lo mismo:
- Mantener uno, eliminar otro
- Ahorro: ~13 KB
```

### 4. Tree-shake para Producción
```bash
# Usar bundler (Webpack/Rollup) con tree-shaking
# Beneficio: Eliminar automáticamente código no usado
```

---

## 📋 RESUMEN DE ACCIONES

| Acción | Archivos | Ahorro | Esfuerzo |
|--------|----------|--------|----------|
| Eliminar test files | 2 | 10 KB | 1 min |
| Auditar y eliminar obsoletos | 3-5 | 26 KB | 30 min |
| Revisar duplicados (realtime) | 2 | 13 KB | 15 min |
| Implementar tree-shaking | - | 40+ KB | 2 horas |
| Consolidar loaders | 3 | 8 KB | 1 hora |
| **TOTAL POTENCIAL** | **12-15** | **~97 KB** | **4.5 horas** |

---

## 🔍 COMANDOS ÚTILES

```bash
# Encontrar todos los scripts
find js/ -name "*.js" -type f | sort

# Ver líneas de código
wc -l js/*.js | tail -1

# Buscar imports/requires
grep -r "import\|require" js/ | grep -v node_modules

# Ver dependencias entre archivos
grep -r "fetch\|XMLHttpRequest" js/ | head -20

# Listar archivos sin referencias
for file in js/*.js; do
  if ! grep -r "$(basename $file)" *.html; then
    echo "NO USADO: $file"
  fi
done
```

---

**Generado**: 30 de Noviembre de 2025
