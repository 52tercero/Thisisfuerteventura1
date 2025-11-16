// Interactive hotspot map without external tile servers (CSP-friendly)
(() => {
  if (typeof window === 'undefined') return;
  const container = document.getElementById('interactive-map');
  if (!container) return;

  container.style.position = 'relative';
  container.style.backgroundImage = "url('images/Fuerteventura.jpeg')";
  container.style.backgroundSize = 'cover';
  container.style.backgroundPosition = 'center';

  const hotspots = [
    {
      id: 'corralejo',
      name: 'Corralejo',
      desc: 'Dunas y Grandes Playas, norte de la isla.',
      img: 'images/turismo/dunas-mar.jpg',
      top: 18, left: 72,
    },
    {
      id: 'el-cotillo',
      name: 'El Cotillo',
      desc: 'Pueblo pesquero y lagunas cristalinas.',
      img: 'images/turismo/el-cotillo.avif',
      top: 22, left: 58,
    },
    {
      id: 'betancuria',
      name: 'Betancuria',
      desc: 'Antigua capital, patrimonio e historia.',
      img: 'images/turismo/betancuria.jpg?v=2',
      top: 40, left: 44,
    },
    {
      id: 'morro-jable',
      name: 'Morro Jable / Jandía',
      desc: 'Playas infinitas y Faro de Jandía.',
      img: 'images/turismo/faro-morro-jable.jpg?v=2',
      top: 78, left: 62,
    },
  ];

  // Accessible popup
  const popup = document.createElement('div');
  popup.className = 'custom-popup';
  Object.assign(popup.style, {
    position: 'absolute',
    zIndex: '10',
    left: '0',
    top: '0',
    transform: 'translate(-50%, -110%)',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    padding: '10px',
    width: 'min(260px, 80vw)'
  });
  popup.setAttribute('role', 'dialog');
  popup.setAttribute('aria-modal', 'false');
  popup.hidden = true;
  container.appendChild(popup);

  const renderPopup = (spot, x, y) => {
    popup.innerHTML = '';
    const inner = document.createElement('div');
    inner.className = 'popup-inner';
    inner.innerHTML = `
      <img class="popup-img" src="${spot.img}" alt="${spot.name}">
      <h4 class="popup-title">${spot.name}</h4>
      <p class="popup-desc">${spot.desc}</p>
    `;
    popup.appendChild(inner);
    popup.style.left = `${x}%`;
    popup.style.top = `${y}%`;
    popup.hidden = false;
  };

  const closePopup = () => { popup.hidden = true; };
  container.addEventListener('click', (e) => {
    if (e.target && e.target.closest('.hotspot')) return;
    closePopup();
  });

  hotspots.forEach((h) => {
    const btn = document.createElement('button');
    btn.className = 'hotspot';
    btn.type = 'button';
    btn.setAttribute('aria-label', h.name);
    Object.assign(btn.style, {
      position: 'absolute',
      top: `${h.top}%`,
      left: `${h.left}%`,
      transform: 'translate(-50%, -50%)',
      width: '16px',
      height: '16px',
      borderRadius: '50%',
      background: '#0f4c81',
      boxShadow: '0 0 0 4px rgba(15,76,129,0.25), 0 6px 12px rgba(0,0,0,0.2)',
      border: '2px solid #fff',
      cursor: 'pointer'
    });

    // Pulse animation (CSS via inline keyframes avoided for CSP)
    btn.addEventListener('mouseenter', () => { btn.style.transform = 'translate(-50%, -50%) scale(1.15)'; });
    btn.addEventListener('mouseleave', () => { btn.style.transform = 'translate(-50%, -50%) scale(1)'; });

    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      renderPopup(h, h.left, h.top);
    });
    container.appendChild(btn);
  });
})();
/* interactive-map.js - Mapa interactivo con Leaflet */

// Inicializar mapa solo si existe el contenedor
const mapContainer = document.getElementById('interactive-map');

if (mapContainer) {
    // Coordenadas centro de Fuerteventura
    const fuerteventuraCenter = [28.3587, -14.0537];
    
    // Crear mapa
    const map = L.map('interactive-map').setView(fuerteventuraCenter, 10);
    
    // Añadir capa de tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
    }).addTo(map);
    
    // Hotspots de interés
    const hotspots = [
        {
            coords: [28.7319, -13.8697],
            title: 'Corralejo',
            description: 'Dunas espectaculares y playas de arena blanca',
            image: 'images/playas/corralejo.jpeg',
            category: 'playa'
        },
        {
            coords: [28.0515, -14.5120],
            title: 'Playa de Cofete',
            description: 'Playa virgen y salvaje con vistas impresionantes',
            image: 'images/playas/cofete.jpeg',
            category: 'playa'
        },
        {
            coords: [28.6937, -14.0120],
            title: 'El Cotillo',
            description: 'Pueblo pesquero con lagunas de aguas cristalinas',
            image: 'images/Fuerteventura.jpeg',
            category: 'pueblo'
        },
        {
            coords: [28.4213, -14.0507],
            title: 'Betancuria',
            description: 'Antigua capital con patrimonio histórico',
            image: 'images/turismo/betancuria.jpeg',
            category: 'cultura'
        },
        {
            coords: [28.1631, -14.2272],
            title: 'Sotavento',
            description: 'Paraíso del windsurf y kitesurf',
            image: 'images/playas/sotavento.jpeg',
            category: 'deporte'
        }
    ];
    
    // Iconos personalizados por categoría
    const icons = {
        playa: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        }),
        pueblo: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        }),
        cultura: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        }),
        deporte: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        })
    };
    
    // Añadir markers con popups
    hotspots.forEach(spot => {
        const marker = L.marker(spot.coords, {
            icon: icons[spot.category] || icons.playa
        }).addTo(map);
        
        const popupContent = `
            <div class="popup-inner">
                <img src="${spot.image}" alt="${spot.title}" class="popup-img">
                <h3 class="popup-title">${spot.title}</h3>
                <p class="popup-desc">${spot.description}</p>
            </div>
        `;
        
        marker.bindPopup(popupContent, {
            maxWidth: 250,
            className: 'custom-popup'
        });
    });
}
