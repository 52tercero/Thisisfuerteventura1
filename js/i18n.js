/* Cargador ligero de i18n
 * Carga archivos JSON de idiomas y reemplaza texto [data-i18n] en el DOM.
 * Uso:
 *   i18n.setLang('en');  // carga /i18n/en.json y lo aplica
 *   i18n.setLang('es');  // carga /i18n/es.json y lo aplica
 *
 * En HTML: <a href="index.html" data-i18n="nav.home">Inicio</a>
 * En JSON: { "nav": { "home": "Home" } }
 */

const i18n = (function() {
  let currentLang = 'es';
  let translations = {};

  function loadLang(lang) {
    return fetch(`/i18n/${lang}.json`)
      .then(res => res.json())
      .then(data => {
        translations = data;
        currentLang = lang;
        applyTranslations();
      })
      .catch(err => console.warn(`Error al cargar i18n/${lang}.json:`, err));
  }

  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = getNestedValue(translations, key);
      if (val) el.textContent = val;
    });
  }

  function getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }

  return {
    setLang: loadLang,
    getLang: () => currentLang,
    t: (key) => getNestedValue(translations, key) || key
  };
})();

// Auto-detectar idioma del navegador al cargar (opcional)
document.addEventListener('DOMContentLoaded', function() {
  const browserLang = navigator.language.split('-')[0]; // 'es', 'en', 'de'
  const supportedLangs = ['es', 'en', 'de'];
  const lang = supportedLangs.includes(browserLang) ? browserLang : 'es';
  // Descomentar para activar cambio automático:
  // i18n.setLang(lang);
});
