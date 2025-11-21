(function(){
  const DATA_URL = 'data/senderos.json';
  const container = document.getElementById('trails-container');
  const difficultyEl = document.getElementById('difficulty-filter');
  const durationEl = document.getElementById('duration-filter');
  const searchEl = document.getElementById('trail-search');
  const applyBtn = document.getElementById('apply-trail-filters');

  /**
   * durationBucket: 'todos' | '0-120' | '121-240' | '241+' (rangos de duración en minutos)
   */
  function matchDuration(mins, bucket){
    if(!bucket || bucket==='todos') return true;
    if(bucket==='0-120') return mins <= 120;
    if(bucket==='121-240') return mins > 120 && mins <= 240;
    if(bucket==='241+') return mins > 240;
    return true;
  }

  function minutesToHHMM(mins){
    const h = Math.floor(mins/60);
    const m = mins % 60;
    if(h===0) return `${m} min`;
    if(m===0) return `${h} h`;
    return `${h} h ${m} min`;
  }

  function feature(icon, text){
    return `<span><i class="fas ${icon}"></i> ${text}</span>`;
  }

  function render(trails){
    if(!container) return;
    if(!trails || trails.length===0){
      container.innerHTML = '<div class="no-results">No hay rutas con esos criterios.</div>';
      return;
    }
    const cards = trails.map(t => {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t.mapsQuery || t.name)}`;
      return `
      <article class="tourism-card">
        <img src="images/turismo/la-oliva.avif" alt="${t.name}" loading="lazy">
        <div class="tourism-info">
          <h3>${t.name}</h3>
          <p>${t.summary}</p>
          <div class="features">
            ${feature('fa-route', `${t.distanceKm} km`)}
            ${feature('fa-mountain', `+${t.ascentM} m`)}
            ${feature('fa-clock', minutesToHHMM(t.durationMin))}
            ${feature('fa-signal', t.difficulty.charAt(0).toUpperCase()+t.difficulty.slice(1))}
          </div>
          <div class="btn-row">
            <a class="btn" href="sendero.html?slug=${encodeURIComponent(t.slug)}">Ver detalle</a>
            <a class="btn" target="_blank" rel="noopener" href="${mapsUrl}"><i class="fas fa-map-location-dot"></i> Cómo llegar</a>
          </div>
        </div>
      </article>`;
    }).join('');
    container.innerHTML = cards;
  }

  function applyFilters(all){
    const diff = (difficultyEl && difficultyEl.value) || 'todas';
    const dur = (durationEl && durationEl.value) || 'todos';
    const q = (searchEl && searchEl.value || '').trim().toLowerCase();
    const filtered = all.filter(t => {
      const okDiff = diff==='todas' ? true : t.difficulty === diff;
      const okDur = matchDuration(t.durationMin, dur);
      const okText = !q || t.name.toLowerCase().includes(q) || (t.summary||'').toLowerCase().includes(q);
      return okDiff && okDur && okText;
    });
    render(filtered);
  }

  async function init(){
    if(!container) return;
    container.innerHTML = '<div class="loading">Cargando rutas...</div>';
    try{
      const res = await fetch(DATA_URL, { cache: 'no-store' });
      const all = await res.json();
      // Ordenar por duración ascendente por defecto
      all.sort((a,b) => a.durationMin - b.durationMin);
      render(all);
      const handler = () => applyFilters(all);
      if(applyBtn) applyBtn.addEventListener('click', handler);
      if(difficultyEl) difficultyEl.addEventListener('change', handler);
      if(durationEl) durationEl.addEventListener('change', handler);
      if(searchEl) searchEl.addEventListener('input', handler);
    }catch(e){
      console.error('[SENDEROS] Error cargando rutas', e);
      container.innerHTML = '<div class="no-results">No se pudieron cargar las rutas.</div>';
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
