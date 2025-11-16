(function(){
  'use strict';

  function $(id){ return document.getElementById(id); }

  // Hook console to UI log
  const logContainer = $('log');
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  function addLog(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  console.log = function(...args) { originalLog.apply(console, args); addLog(args.join(' '), 'info'); };
  console.warn = function(...args) { originalWarn.apply(console, args); addLog(args.join(' '), 'warn'); };
  console.error = function(...args) { originalError.apply(console, args); addLog(args.join(' '), 'error'); };

  function clearLogs(){ logContainer.innerHTML = ''; }

  function clearCache(){
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('rss_cache') || key.includes('article_')) {
        localStorage.removeItem(key);
        console.log('Eliminado: ' + key);
      }
    });
    $('stats').innerHTML = '<strong>Cache limpiado!</strong> Ahora puedes probar feeds frescos.';
  }

  async function testFeeds(){
    $('stats').innerHTML = '<strong>Estado:</strong> Cargando feeds...';
    $('items').innerHTML = '';

    try {
      if (!window.FeedUtils) throw new Error('FeedUtils no está cargado');

      const sources = [
        'https://rss.app/feeds/jbwZ2Q9QAvgvI6G0.xml',
        'https://rss.app/feeds/8SmCQL7GDZyu2xB4.xml',
        'https://rss.app/feeds/IchTPp234IVDaH7V.xml',
        'https://rss.app/feeds/cNktFJXkoIBwqQSS.xml',
        'https://rss.app/feeds/pGaOMTfcwV2mzdy7.xml'
      ];

      console.log('========================================');
      console.log('Iniciando prueba de feeds...');
      console.log('Fuentes:', sources.length);

      const items = await FeedUtils.fetchRSSFeeds(sources);

      console.log('========================================');
      console.log('✓ Feeds obtenidos correctamente');

      $('stats').innerHTML = `
        <strong>✓ Completado</strong><br>
        Total de items: ${items.length}<br>
        Fuentes: ${sources.length}<br>
        Promedio por fuente: ${(items.length / sources.length).toFixed(1)}
      `;

      const itemsContainer = $('items');
      items.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'item';
        const safeTitle = (window.FeedUtils && FeedUtils.escapeHTML) ? FeedUtils.escapeHTML(item.title || '') : String(item.title || '');
        const safeSource = (window.FeedUtils && FeedUtils.escapeHTML) ? FeedUtils.escapeHTML(item.source || '') : String(item.source || '');
        const safeDate = (window.FeedUtils && FeedUtils.escapeHTML) ? FeedUtils.escapeHTML(item.date || '') : String(item.date || '');
        div.innerHTML = `
          <strong>${idx + 1}.</strong> ${safeTitle}<br>
          <small class="muted">Fuente: ${safeSource} | Fecha: ${safeDate}</small>
        `;
        itemsContainer.appendChild(div);
      });

      const titleMap = new Map();
      items.forEach((item, idx) => {
        const title = item.title || '';
        if (!titleMap.has(title)) titleMap.set(title, []);
        titleMap.get(title).push(idx + 1);
      });

      const duplicates = Array.from(titleMap.entries()).filter(([_, indices]) => indices.length > 1);
      if (duplicates.length > 0) {
        console.warn('⚠️ DUPLICADOS ENCONTRADOS:', duplicates.length, 'títulos repetidos');
        duplicates.forEach(([title, indices]) => {
          console.warn(`  "${title}" en posiciones: ${indices.join(', ')}`);
        });
      } else {
        console.log('✓ No se encontraron duplicados por título');
      }

    } catch (error) {
      console.error('Error en la prueba:', error.message);
      $('stats').innerHTML = `<strong>❌ Error:</strong> ${error.message}`;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const btnClearCache = $('btn-clear-cache');
    const btnTestFeeds = $('btn-test-feeds');
    const btnClearLogs  = $('btn-clear-logs');

    if (btnClearCache) btnClearCache.addEventListener('click', clearCache);
    if (btnTestFeeds) btnTestFeeds.addEventListener('click', testFeeds);
    if (btnClearLogs) btnClearLogs.addEventListener('click', clearLogs);
  });
})();
