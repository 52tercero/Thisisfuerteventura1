# 🔧 Guía de Resolución de Problemas con Imágenes

## Problema
Las imágenes de algunos feeds no se están mostrando correctamente.

## Solución Implementada

### 1. Página de Debug (`test-images.html`)
Creé una herramienta de diagnóstico completa para identificar problemas:

- **Ubicación**: `test-images.html` (en la raíz del proyecto)
- **Cómo usarla**:
  1. Asegúrate de que el servidor esté corriendo (`cd server && npm start`)
  2. Abre `http://localhost:8000/test-images.html` con Live Server
  3. Verás TODOS los artículos con análisis detallado de imágenes

**Características**:
- ✅ Muestra cada artículo con su fuente
- ✅ Indica si se encontró imagen o se usa fallback
- ✅ Previsualización de la imagen extraída
- ✅ Análisis completo de todos los campos de imagen
- ✅ Botones para recargar y limpiar caché
- ✅ Estadísticas de extracción

### 2. Mejoras en el Servidor (`server/index.js`)

**FeedParser (para RSS modernos)**:
```javascript
// Ahora extrae:
- it.image?.url
- it.enclosures?.[0]?.url
- media:content, media:thumbnail, media:group
```

**XML2JS (para RSS antiguos)**:
```javascript
// Ahora busca en orden:
1. it.image (string o object.url)
2. it.enclosure.url
3. it['media:content'].url
4. it['media:thumbnail'].url
```

### 3. Logging Detallado (`js/image-extractor.js`)

Cada intento de extracción ahora registra:
```javascript
{
  source: 'https://example.com/article',
  candidates: [
    { source: 'item.image', url: 'https://...' },
    { source: 'raw.enclosure.url', url: 'https://...' },
    // ... etc
  ]
}
```

## Cómo Diagnosticar

### Paso 1: Usar la Página de Debug
```bash
# Terminal 1: Servidor
cd server
npm start

# Terminal 2: Cliente
python -m http.server 8000

# Navegador
http://localhost:8000/test-images.html
```

### Paso 2: Ver la Consola del Navegador
Abre DevTools (F12) y busca:
- `[IMAGE] Success:` - Extracciones exitosas
- `[IMAGE] No candidates found:` - Items sin imágenes

### Paso 3: Analizar Fuentes Problemáticas
En `test-images.html`, expande "Ver análisis completo" para cada artículo que no muestre imagen. Verás:
```json
{
  "direct_image": null,
  "raw_image_url": null,
  "enclosure": null,
  "media_content": null,
  "media_thumbnail": null,
  "description_has_img": "Yes/No",
  "extracted": "url o fallback"
}
```

## Problemas Comunes y Soluciones

### ❌ Problema: "No se pudieron cargar artículos de newsdata.io"
**Causa**: Falta `NEWSDATA_API_KEY` en variables de entorno

**Solución**:
```powershell
# PowerShell
$env:NEWSDATA_API_KEY="tu_api_key_aqui"
cd server
npm start
```

### ❌ Problema: Algunas fuentes RSS no tienen imágenes
**Causa**: El feed no incluye etiquetas de imagen (enclosure, media:content, etc.)

**Verificación**:
1. Abre `test-images.html`
2. Busca artículos de esa fuente
3. Expande "Raw item completo"
4. Verifica si existe algún campo con URL de imagen

**Soluciones**:
- Si `description_has_img: "Yes"` → El extractor debería encontrarla en HTML
- Si no hay imágenes en raw → Usar logo de fallback del dominio
- Agregar logos en `images/logos/` según `DOMAIN_FALLBACKS`

### ❌ Problema: Imágenes rotas (error 404/403)
**Causa**: URLs inválidas o recursos protegidos

**Solución**: Las imágenes tienen `onerror` que carga fallback automáticamente:
```html
<img src="..." onerror="this.src='images/Fuerteventura.jpeg'">
```

### ❌ Problema: Caché antigua
**Solución**: En `test-images.html`, click en "🗑️ Limpiar Caché"

## Ver Estadísticas en Tiempo Real

En cualquier página (index.html, noticias.html):
```javascript
// Consola del navegador
window.ImageExtractor.getImageStats()

// Output:
{
  totalAttempts: 150,
  successfulExtractions: 142,
  failedExtractions: 8,
  successRate: "94.67%",
  errorsByDomain: { ... },
  errorsByType: { ... }
}
```

## Agregar Logos de Fallback

1. Crear imágenes 1200x630px para cada dominio
2. Guardar en `images/logos/`:
   - `canarias7.png`
   - `laprovincia.png`
   - `cabildo.png`
   - `radioinsular.png`
   - `fvdigital.png`
   - `ondafv.png`
   - `newsdata.png`

3. Ya están configurados en `js/image-extractor.js`:
```javascript
const DOMAIN_FALLBACKS = {
    'canarias7.es': 'images/logos/canarias7.png',
    // ... etc
};
```

## Comandos Rápidos

```powershell
# Reiniciar servidor con logs frescos
cd server
npm start

# Limpiar caché del navegador
Ctrl + Shift + Delete → Limpiar todo

# Ver logs del servidor en tiempo real
# (ya están en la terminal donde ejecutaste npm start)

# Probar un feed específico
Invoke-RestMethod -Uri "http://localhost:3000/api/rss?url=https://www.canarias7.es/canarias/fuerteventura/&noCache=1"
```

## Próximos Pasos si Persiste el Problema

1. Captura pantalla de `test-images.html` mostrando artículos sin imagen
2. Copia el "Raw item completo" de un artículo problemático
3. Copia la salida de `window.ImageExtractor.getImageStats()`
4. Comparte esa información para análisis más profundo

## Verificación Final

✅ Servidor corriendo en puerto 3000 o 3001  
✅ `test-images.html` carga y muestra artículos  
✅ Consola muestra `[IMAGE] Success` para la mayoría  
✅ `getImageStats()` muestra >90% success rate  
✅ Fallbacks funcionan para dominios sin imagen  
