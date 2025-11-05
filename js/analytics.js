/* Emisor simple de eventos de analítica
 * Permite a plugins integrar GA4, Plausible, o cualquier tracker sin hardcodear IDs.
 * Uso:
 *   analytics.track('page_view', { page: '/noticias.html' });
 *   analytics.track('button_click', { button: 'leer_mas', article_id: 123 });
 *
 * Para integrar GA4: agregar un listener en main.js:
 *   analytics.on('*', (event, data) => {
 *     if (window.gtag) gtag('event', event, data);
 *   });
 *
 * Para integrar Plausible: agregar un listener:
 *   analytics.on('*', (event, data) => {
 *     if (window.plausible) window.plausible(event, { props: data });
 *   });
 */

const analytics = (function() {
  const listeners = [];

  return {
    on: function(eventName, handler) {
      listeners.push({ eventName, handler });
    },
    off: function(handler) {
      const idx = listeners.findIndex(l => l.handler === handler);
      if (idx >= 0) listeners.splice(idx, 1);
    },
    track: function(eventName, data = {}) {
      listeners.forEach(l => {
        if (l.eventName === '*' || l.eventName === eventName) {
          try {
            l.handler(eventName, data);
          } catch (e) {
            console.error('Analytics handler error:', e);
          }
        }
      });
    }
  };
})();

// Ejemplo: rastrear vistas de página en DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  analytics.track('page_view', {
    page: window.location.pathname,
    referrer: document.referrer
  });
});
