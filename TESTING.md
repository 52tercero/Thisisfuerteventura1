# Testing Guide — This is Fuerteventura

## E2E Smoke Tests

### ¿Qué son?
Suite de 18 pruebas interactivas que validan los flujos críticos del sitio:
- Accesibilidad de páginas
- Navegación del mapa por teclado
- Seguridad de reinicio del quiz
- Confiabilidad de FetchWithRetry
- Performance y assets (WEBP, picture elements)

### Cómo ejecutar

**Opción 1: En desarrollo local**
```bash
npm start  # Inicia servidor en http://localhost:8000
# Abre navegador y accede a: http://localhost:8000/test-e2e-smoke.html
```

**Opción 2: Directamente en el editor**
- Abre `test-e2e-smoke.html` en VS Code
- Haz clic en "Go Live" (Live Server extension)
- Se abrirá en http://localhost:5500/test-e2e-smoke.html

**Opción 3: Production deployment**
- El archivo será servido automáticamente en producción
- URL: `https://thisisfuerteventura.es/test-e2e-smoke.html`

### Resultados esperados

**Status: LISTO PARA PRODUCCIÓN** ✓
- Todos los 18 tests deberían pasar (100%)
- Si algún test falla, revisar los detalles en rojo

### Tests incluidos

#### Suite 1: Navigation & Consent Flow (5 tests)
- ✓ index.html accesible
- ✓ noticias.html accesible
- ✓ turismo.html accesible
- ✓ quiz.html accesible
- ✓ Cookie banner script (js/cookies.js) cargado

#### Suite 2: Interactive Map Keyboard Navigation (4 tests)
- ✓ MapKeyboard módulo existe
- ✓ MapKeyboard exportado a window
- ✓ aria-live region en index.html
- ✓ Leaflet CSS cargado

#### Suite 3: Quiz Restart Safety & Score Persistence (4 tests)
- ✓ quiz.js carga correctamente con cleanup()
- ✓ Score persistence (loadScore, SCORE_KEY)
- ✓ Event listener tracking y handler reuse
- ✓ Estructura HTML del quiz

#### Suite 4: FetchWithRetry Reliability (5 tests)
- ✓ FetchWithRetry módulo existe
- ✓ FetchWithRetry exportado a window
- ✓ Config de retry (maxRetries, backoff)
- ✓ widget-error CSS styling
- ✓ Integración en real-time-data.js

#### Suite 5: Performance & Assets (6 tests)
- ✓ WEBP images (logo.webp, Fuerteventura.webp)
- ✓ Picture elements en index.html
- ✓ Width/height atributos para CLS
- ✓ ESLint config (.eslintrc.json)
- ✓ Prettier config (.prettierrc.json)

### Interpretación de resultados

**Todos verdes (100%)**: 🟢 Listo para producción  
**Algunos amarillos**: 🟡 Revisar details; puede ser esperado en ciertos ambientes  
**Alguno rojo**: 🔴 Investigar fallo antes de deploy  

### Notas técnicas

- Tests se ejecutan en el navegador (cliente)
- Usan Fetch API con modo `no-cors` donde es necesario
- No requieren servidor backend (puramente estático)
- Compatible con todos los navegadores modernos (ES2021)

### Para debuggear

1. Abre DevTools (F12)
2. Ve a la pestaña "Console"
3. Verás logs de cada test durante ejecución
4. Haz clic en tests específicos para ver detalles

### CI/CD Integration

Para integrar en pipeline (Netlify, GitHub Actions, etc.):

```bash
# Ejecutar tests via CLI (requiere Playwright/Puppeteer)
npx playwright test test-e2e-smoke.html
# O
npx puppeteer-cli http://localhost:8000/test-e2e-smoke.html
```

---

## Unit Tests (Futuro)

Próximamente:
- Tests para `js/fetch-with-retry.js`
- Tests para `js/map-keyboard.js`
- Tests para `js/quiz.js` (state machine)
- Tests para `js/cookies.js`

Stack propuesto: Jest + @testing-library

