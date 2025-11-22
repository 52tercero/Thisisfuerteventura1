// Renderiza publicaciones de Facebook usando la función Netlify
(function(){
  const FEED_ENDPOINT = '/.netlify/functions/facebook?limit=5';

  function esc(str){
    return (str || '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }
  function fmtDate(iso){
    try { return new Date(iso).toLocaleDateString('es-ES', { dateStyle: 'medium' }); } catch (_) { return ''; }
  }
  function cardHtml(item){
    const img = item.image ? `<img class="news-image" src="${esc(item.image)}" alt="Imagen de la publicación" loading="lazy">` : '';
    const text = item.message ? `<p>${esc(item.message)}</p>` : '';
    const date = item.created_time ? `<p class="meta">${fmtDate(item.created_time)}</p>` : '';
    const link = item.permalink ? `<a class="btn" href="${esc(item.permalink)}" target="_blank" rel="noopener noreferrer"><i class="fab fa-facebook"></i> Ver en Facebook</a>` : '';
    return `<article class="content-card news-card">${img}<div class="news-content">${date}${text}${link}</div></article>`;
  }

  async function load(){
    const root = document.getElementById('fb-feed');
    if(!root) return;
    try {
      const r = await fetch(FEED_ENDPOINT, { headers: { 'Accept': 'application/json' } });
      if(!r.ok) throw new Error('HTTP ' + r.status);
      const data = await r.json();
      const items = (data.items || []);
      if(!items.length){
        root.innerHTML = '<div class="no-results">No hay publicaciones disponibles ahora.</div>';
        return;
      }
      root.innerHTML = items.map(cardHtml).join('');
    } catch (e) {
      root.innerHTML = `<div class="no-results">No se pudieron cargar las publicaciones (Graph). ${esc(String(e.message||e))}</div>`;
    }
  }

  document.addEventListener('DOMContentLoaded', load);
})();
