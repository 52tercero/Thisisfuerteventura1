// Interactive map with Leaflet (preferred). Falls back to hotspot overlay if Leaflet is unavailable.
(() => {
  if (typeof window === 'undefined') return;
  const container = document.getElementById('interactive-map');
  if (!container) return;

  // Marker dataset unified from playas, alojamiento, gastronomía y turismo
  const points = [
    // Playas
    { slug: 'corralejo', lat: 28.7319, lon: -13.8697, title: 'Corralejo', desc: 'Dunas y Grandes Playas (norte).', img: 'images/vistalobos.jpg', url: 'playas.html' },
    { slug: 'cofete', lat: 28.0515, lon: -14.5120, title: 'Cofete', desc: 'Playa virgen en Jandía, paisaje salvaje.', img: 'images/Fuerteventura.jpeg', url: 'playas.html' },
    { slug: 'el-cotillo', lat: 28.6937, lon: -14.0120, title: 'El Cotillo', desc: 'Lagos y calas de aguas cristalinas.', img: 'images/playa-del-cotillo.jpg', url: 'playas.html' },
    { slug: 'sotavento', lat: 28.1631, lon: -14.2272, title: 'Sotavento', desc: 'Laguna y vientos para wind/kite.', img: 'images/Fuerteventura.jpeg', url: 'playas.html' },
    { slug: 'ajuy', lat: 28.4020, lon: -14.1605, title: 'Ajuy', desc: 'Playa de arena negra y cuevas.', img: 'images/Fuerteventura.jpeg', url: 'playas.html' },
    { slug: 'morro-jable', lat: 28.0526, lon: -14.3501, title: 'Morro Jable', desc: 'Playa urbana y faro.', img: 'images/Fuerteventura.jpeg', url: 'playas.html' },
    { slug: 'costa-calma', lat: 28.1600, lon: -14.2260, title: 'Costa Calma', desc: 'Playas extensas y ambiente relajado.', img: 'images/Fuerteventura.jpeg', url: 'playas.html' },
    { slug: 'la-pared', lat: 28.2420, lon: -14.2590, title: 'La Pared', desc: 'Costa salvaje ideal para atardeceres.', img: 'images/Fuerteventura.jpeg', url: 'playas.html' },
    { slug: 'esquinzo', lat: 28.0640, lon: -14.3540, title: 'Esquinzo', desc: 'Calas tranquilas al sur de Jandía.', img: 'images/Fuerteventura.jpeg', url: 'playas.html' },
    // Turismo
    { slug: 'betancuria', lat: 28.4213, lon: -14.0507, title: 'Betancuria', desc: 'Antigua capital, patrimonio e historia.', img: 'images/betancuria.webp', url: 'turismo.html' },
    { slug: 'puerto-rosario', lat: 28.5000, lon: -13.8620, title: 'Puerto del Rosario', desc: 'Capital y servicios principales.', img: 'images/Fuerteventura.jpeg', url: 'turismo.html' },
    { slug: 'gran-tarajal', lat: 28.2120, lon: -14.0200, title: 'Gran Tarajal', desc: 'Pueblo costero con paseo marítimo.', img: 'images/Fuerteventura.jpeg', url: 'turismo.html' },
    { slug: 'jandia', lat: 28.0460, lon: -14.3630, title: 'Jandía', desc: 'Parque Natural y playas infinitas.', img: 'images/Fuerteventura.jpeg', url: 'turismo.html' },
    { slug: 'lobos', lat: 28.7420, lon: -13.8220, title: 'Isla de Lobos', desc: 'Reserva natural frente a Corralejo.', img: 'images/vistalobos.jpg', url: 'turismo.html' },
    { slug: 'pozo-negro', lat: 28.2760, lon: -13.8770, title: 'Pozo Negro', desc: 'Pequeña cala de piedra volcánica.', img: 'images/Fuerteventura.jpeg', url: 'turismo.html' },
    { slug: 'tindaya', lat: 28.5750, lon: -14.0190, title: 'Tindaya', desc: 'Montaña sagrada y paisaje volcánico.', img: 'images/Fuerteventura.jpeg', url: 'turismo.html' },
    { slug: 'pajara', lat: 28.3500, lon: -14.1080, title: 'Pájara', desc: 'Municipio con iglesia emblemática.', img: 'images/Fuerteventura.jpeg', url: 'turismo.html' },
    { slug: 'antigua', lat: 28.4220, lon: -13.9270, title: 'Antigua', desc: 'Molinos y tradición majorera.', img: 'images/Fuerteventura.jpeg', url: 'turismo.html' },
    // Alojamiento (zonas)
    { slug: 'caleta', lat: 28.3920, lon: -13.8600, title: 'Caleta de Fuste', desc: 'Zona céntrica con resorts y golf.', img: 'images/playa_del_castillo_caleta_de_fuste.webp', url: 'alojamiento.html' },
    // Gastronomía
    { slug: 'la-oliva', lat: 28.6100, lon: -13.9260, title: 'La Oliva', desc: 'Cocina local y productos de km 0.', img: 'images/turismo/la-oliva.avif', url: 'gastronomia.html' },
  ];

  function buildLeaflet() {
    const center = [28.3587, -14.0537];
    const map = L.map('interactive-map', { zoomControl: true }).setView(center, 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map);

    points.forEach(p => {
      const m = L.marker([p.lat, p.lon]);
      const link = p.url ? `<p class="mt-10"><a class="btn btn-small" href="${p.url}">Ver más</a></p>` : '';
      const html = `
        <div class="popup-inner">
          <img src="${p.img}" alt="${p.title}" class="popup-img">
          <h3 class="popup-title">${p.title}</h3>
          <p class="popup-desc">${p.desc}</p>
          ${link}
        </div>`;
      m.addTo(map).bindPopup(html, { maxWidth: 260, className: 'custom-popup' });
    });
  }

  function buildOverlay() {
    // Fallback overlay when Leaflet is not available
    const popup = document.createElement('div');
    popup.className = 'custom-popup';
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-modal', 'false');
    popup.hidden = true;
    container.appendChild(popup);

    const renderPopup = (spotId, p) => {
      const link = p.url ? `<p class=\"mt-10\"><a class=\"btn btn-small\" href=\"${p.url}\">Ver más</a></p>` : '';
      popup.innerHTML = `
        <div class="popup-inner">
          <img class="popup-img" src="${p.img}" alt="${p.title}">
          <h4 class="popup-title">${p.title}</h4>
          <p class="popup-desc">${p.desc}</p>
          ${link}
        </div>`;
      popup.className = `custom-popup popup--${spotId}`;
      popup.hidden = false;
    };

    container.addEventListener('click', (e) => {
      if (e.target && e.target.closest('.hotspot')) return; popup.hidden = true;
    });

    points.forEach((p) => {
      const id = p.slug;
      const btn = document.createElement('button');
      btn.className = `hotspot hotspot--${id}`;
      btn.type = 'button';
      btn.setAttribute('aria-label', p.title);
      btn.addEventListener('click', (ev) => { ev.stopPropagation(); renderPopup(id, p); });
      container.appendChild(btn);
    });
  }

  if (window.L && typeof L.map === 'function') {
    buildLeaflet();
  } else {
    buildOverlay();
  }
})();
