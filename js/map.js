/* map.js: Leaflet interactive map with hotspots */
(function(){
  const el = document.getElementById('map');
  if(!el) return;
  if(typeof L === 'undefined') return;
  const center = [28.3587,-14.0537]; // approx island center
  const map = L.map('map', { zoomControl: true }).setView(center, 9);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18, attribution: '&copy; OpenStreetMap'
  }).addTo(map);
  const spots = [
    {name:'Corralejo', coord:[28.7319,-13.8697], desc:'Dunas y Grandes Playas'},
    {name:'Cofete', coord:[28.0515,-14.5120], desc:'Playa salvaje y montañas'},
    {name:'El Cotillo', coord:[28.6937,-14.0120], desc:'Lagunas de aguas cristalinas'},
    {name:'Sotavento', coord:[28.1631,-14.2272], desc:'Paraíso del windsurf'},
    {name:'Betancuria', coord:[28.4213,-14.0507], desc:'Historia y valle interior'},
  ];
  spots.forEach(s=>{
    L.marker(s.coord).addTo(map).bindPopup(`<b>${s.name}</b><br>${s.desc}`);
  });
})();
