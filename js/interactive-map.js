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
