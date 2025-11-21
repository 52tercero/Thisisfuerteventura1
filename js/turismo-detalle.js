(function(){
  'use strict';

  function escapeHTML(str){
    try {
      return String(str)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#39;');
    } catch(_) { return ''; }
  }

  function getParam(name){
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function gmDirectionsLink(place){
    if (!place) return '#';
    const q = encodeURIComponent(place);
    return `https://www.google.com/maps/dir/?api=1&destination=${q}`;
  }

  function renderPlace(place){
        // Información útil (bullets) si existe
        const info = place.info || null;
        const infoBlock = info ? `
          <section class="reveal" aria-label="Información útil">
            <h3>Información útil</h3>
            <ul class="info-list" style="list-style:none;padding:0;margin:0;display:grid;gap:8px">
              ${info.bestTime ? `<li><i class="fas fa-calendar-day"></i> <strong>Mejor época:</strong> ${escapeHTML(info.bestTime)}</li>` : ''}
              ${info.parking ? `<li><i class="fas fa-square-parking"></i> <strong>Aparcamiento:</strong> ${escapeHTML(info.parking)}</li>` : ''}
              ${info.accessibility ? `<li><i class="fas fa-universal-access"></i> <strong>Accesibilidad:</strong> ${escapeHTML(info.accessibility)}</li>` : ''}
              ${info.services ? `<li><i class="fas fa-store"></i> <strong>Servicios:</strong> ${escapeHTML(info.services)}</li>` : ''}
              ${info.duration ? `<li><i class="fas fa-clock"></i> <strong>Tiempo recomendado:</strong> ${escapeHTML(info.duration)}</li>` : ''}
              ${info.difficulty ? `<li><i class="fas fa-person-hiking"></i> <strong>Dificultad:</strong> ${escapeHTML(info.difficulty)}</li>` : ''}
              ${info.tips ? `<li><i class="fas fa-lightbulb"></i> <strong>Consejos:</strong> ${escapeHTML(info.tips)}</li>` : ''}
            </ul>
          </section>` : '';

    const container = document.getElementById('place-container');
    if (!container){ return; }

    const galleryHtml = (place.gallery||[]).map(src => `
      <figure>
        <img src="${escapeHTML(src)}" alt="${escapeHTML(place.title)}" loading="lazy">
      </figure>
    `).join('');

    const featuresHtml = (place.features||[]).map(f => `<span class="category-tag">${escapeHTML(f)}</span>`).join('');

    const directionsUrl = place.lat && place.lng
      ? `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`
      : gmDirectionsLink(place.placeQuery || place.title);

    const historyBlock = place.history ? `
      <section class="reveal" aria-label="Historia del lugar">
        <h3>Historia</h3>
        <div class="article-content">
          <p>${escapeHTML(place.history)}</p>
        </div>
      </section>` : '';

    const longDescBlock = place.longDescription ? `
      <section class="reveal" aria-label="Descripción completa">
        <h3>Descripción</h3>
        <div class="article-content">
          <p>${escapeHTML(place.longDescription)}</p>
        </div>
      </section>` : '';

    container.innerHTML = `
      <header class="article-header">
        ${featuresHtml}
        <h2>${escapeHTML(place.title)}</h2>
        <p class="article-summary">${escapeHTML(place.summary||'')}</p>
      </header>
      <div class="article-featured-image">
        <img src="${escapeHTML(place.heroImage)}" alt="${escapeHTML(place.title)}" loading="lazy">
      </div>
      <div class="article-content">
        <p>${escapeHTML(place.description||'')}</p>
        ${galleryHtml ? `<div class="gallery-grid">${galleryHtml}</div>` : ''}
      </div>
      ${historyBlock}
      ${longDescBlock}
      ${infoBlock}
      <section class="reveal" aria-label="Mapa y cómo llegar">
        <h3>Ubicación y cómo llegar</h3>
        <div id="place-map" style="width:100%;height:360px;border-radius:12px;overflow:hidden;background:#eef"></div>
        <div style="margin-top:12px">
          <a class="btn" href="${directionsUrl}" target="_blank" rel="noopener">Abrir en Google Maps</a>
          <a class="btn" href="turismo.html">Volver a Turismo</a>
        </div>
      </section>
    `;

    // Inicializar mapa si existen coordenadas
    if (typeof L !== 'undefined' && place.lat && place.lng){
      const map = L.map('place-map', { scrollWheelZoom: false });
      map.setView([place.lat, place.lng], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);
      L.marker([place.lat, place.lng]).addTo(map).bindPopup(escapeHTML(place.title));
    } else {
      // Sin coordenadas: mostrar un mensaje sutil y mantener el enlace de direcciones
      const el = document.getElementById('place-map');
      if (el) el.innerHTML = '<div class="no-results" style="padding:16px">Mapa no disponible. Usa el botón "Abrir en Google Maps" para ver la ubicación.</div>';
    }

    updateMeta(place);
  }

  function updateMeta(place){
    document.title = `${place.title} - This is Fuerteventura`;
    setMeta('og:title', place.title);
    setMeta('og:description', place.summary || place.longDescription || place.description || 'Lugar de interés en Fuerteventura');
    setMeta('og:image', place.heroImage || '/images/logo.jpg');
    setMeta('og:type', 'article');
    setMeta('og:url', window.location.href);
    setMeta('twitter:title', place.title);
    setMeta('twitter:description', place.summary || place.longDescription || place.description || 'Lugar de interés en Fuerteventura');
    setMeta('twitter:image', place.heroImage || '/images/logo.jpg');
    const desc = document.querySelector('meta[name="description"]');
    if (desc){
      const d = (place.summary || place.longDescription || place.description || '').slice(0,155);
      desc.setAttribute('content', d);
    }
  }

  function setMeta(name, content){
    let el = document.querySelector(`meta[property="${name}"]`) || document.querySelector(`meta[name="${name}"]`);
    if (!el){
      const isOG = name.startsWith('og:');
      el = document.createElement('meta');
      if (isOG) el.setAttribute('property', name); else el.setAttribute('name', name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  async function load(){
    const id = getParam('id');
    const container = document.getElementById('place-container');
    if (!id || !container){
      container.innerHTML = `<div class="error"><h2>Elemento no encontrado</h2><p>Vuelve a <a href="turismo.html">Turismo</a> y elige un lugar.</p></div>`;
      return;
    }

    try {
      const res = await fetch('data/turismo.json', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('No se pudo cargar el catálogo');
      const items = await res.json();
      const place = items.find(x => x.id === id);
      if (!place){
        container.innerHTML = `<div class="error"><h2>Elemento no encontrado</h2><p>Vuelve a <a href=\"turismo.html\">Turismo</a> y elige un lugar.</p></div>`;
        return;
      }
      renderPlace(place);
    } catch (e){
      console.error(e);
      container.innerHTML = `<div class="error"><h2>Error al cargar</h2><p>No se pudo cargar la información. Intenta más tarde.</p></div>`;
    }
  }

  document.addEventListener('DOMContentLoaded', load);
})();
