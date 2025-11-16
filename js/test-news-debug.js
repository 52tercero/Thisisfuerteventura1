(function(){
  'use strict';

  function $(id){ return document.getElementById(id); }

  // Console log capture
  const logsDiv = $('console-logs');
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  function addLog(type, ...args) {
    const timestamp = new Date().toLocaleTimeString();
    const msg = args.map(a => {
      try { return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a); }
      catch(_) { return String(a); }
    }).join(' ');
    logsDiv.textContent += `[${timestamp}] [${type}] ${msg}\n`;
    logsDiv.scrollTop = logsDiv.scrollHeight;
  }

  console.log = (...args) => { originalLog(...args); addLog('LOG', ...args); };
  console.error = (...args) => { originalError(...args); addLog('ERROR', ...args); };
  console.warn = (...args) => { originalWarn(...args); addLog('WARN', ...args); };

  function clearLogs(){ logsDiv.textContent = 'Logs limpiados...\n'; }

  // Viewport info
  function updateViewportInfo() {
    $('vw-width').textContent = window.innerWidth;
    $('vw-height').textContent = window.innerHeight;
    $('vw-ratio').textContent = (window.devicePixelRatio || 1).toFixed(2);

    const width = window.innerWidth;
    let type = 'Desktop';
    if (width <= 600) type = 'Mobile (≤600px)';
    else if (width <= 768) type = 'Tablet pequeña (≤768px)';
    else if (width <= 992) type = 'Tablet (≤992px)';
    $('vw-type').textContent = type;
  }

  window.addEventListener('resize', updateViewportInfo);
  document.addEventListener('DOMContentLoaded', () => {
    updateViewportInfo();

    // Wire buttons
    const btnProxy = $('btn-proxy');
    const btnNews = $('btn-news');
    const btnLoader = $('btn-loader');
    const btnClear = $('btn-clear-logs');

    if (btnProxy) btnProxy.addEventListener('click', testProxyDetection);
    if (btnNews) btnNews.addEventListener('click', testNewsLoad);
    if (btnLoader) btnLoader.addEventListener('click', testContentLoader);
    if (btnClear) btnClear.addEventListener('click', clearLogs);

    console.log('Debug page loaded');
  });

  // Tests
  async function testProxyDetection() {
    const result = $('proxy-result');
    result.textContent = 'Probando detección de proxy...\n';

    try {
      const isLocal = /^(localhost|127\.0\.0\.1)/.test(location.hostname);
      result.textContent += `Hostname: ${location.hostname}\n`;
      result.textContent += `Es local: ${isLocal}\n\n`;

      if (!isLocal) {
        result.textContent += 'Probando Netlify Functions...\n';
        const testUrl = '/.netlify/functions/aggregate?sources=' + encodeURIComponent('https://www.canarias7.es/canarias/fuerteventura/');
        try {
          const test = await fetch(testUrl, { cache: 'no-store' });
          result.textContent += `Status: ${test.status}\n`;
          if (test.ok) {
            result.textContent += '✓ Netlify Functions detectadas\n';
            const data = await test.json();
            result.textContent += `Items: ${(data && data.items && data.items.length) || 0}\n`;
          }
        } catch (e) {
          result.textContent += `✗ Error: ${e.message}\n`;
        }
      } else {
        result.textContent += 'Probando puertos locales...\n';
        const ports = [3000, 3001, 3002];
        for (const port of ports) {
          try {
            const r = await fetch(`http://localhost:${port}/health`, { cache: 'no-store' });
            if (r.ok) {
              result.textContent += `✓ Servidor encontrado en puerto ${port}\n`;
              break;
            }
          } catch (e) {
            result.textContent += `✗ Puerto ${port}: ${e.message}\n`;
          }
        }
      }
    } catch (e) {
      result.textContent += `\nError general: ${e.message}\n${e.stack}`;
    }
  }

  async function testNewsLoad() {
    const result = $('news-result');
    result.textContent = 'Intentando cargar noticias...\n';

    try {
      if (typeof window.fetchRSSFeeds !== 'function') {
        result.textContent += 'Cargando content-loader.js...\n';
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'js/content-loader.js?v=2025111508';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      result.textContent += 'Esperando carga de proxy...\n';
      await new Promise(r => setTimeout(r, 2000));

      if (typeof window.fetchRSSFeeds === 'function') {
        result.textContent += 'Función fetchRSSFeeds disponible, llamando...\n';
        const items = await window.fetchRSSFeeds();
        result.textContent += `\n✓ Noticias cargadas: ${items.length}\n\n`;
        if (items.length > 0) {
          try { result.textContent += `Primera noticia:\n${JSON.stringify(items[0], null, 2)}`; }
          catch(_) { result.textContent += `Primera noticia (no serializable)\n`; }
        }
      } else {
        result.textContent += '✗ fetchRSSFeeds no está definida\n';
      }
    } catch (e) {
      result.textContent += `\n✗ Error: ${e.message}\n${e.stack}`;
    }
  }

  function testContentLoader() {
    const result = $('loader-result');
    result.textContent = 'Verificando content-loader.js...\n\n';

    result.textContent += `fetchRSSFeeds: ${typeof window.fetchRSSFeeds}\n`;
    result.textContent += `loadFeaturedNews: ${typeof window.loadFeaturedNews}\n`;
    result.textContent += `__RSS_PROXY_URL: ${window.__RSS_PROXY_URL || 'undefined'}\n`;
    result.textContent += `DOMContentLoaded fired: ${document.readyState}\n\n`;

    const scripts = Array.from(document.scripts).map(s => s.src).filter(Boolean);
    result.textContent += `Scripts cargados:\n${scripts.join('\n')}`;
  }
})();
