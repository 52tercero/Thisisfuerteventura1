export interface AlojamientoFeature {
  icon?: string; // font-awesome key (optional)
  label: string; // display text already in locale (ES for now)
}

export interface Alojamiento {
  id: string;
  name: string;
  summary: string;
  category: string; // hotel | apartamento | villa | rural | resort
  zone: string; // Corralejo | Caleta de Fuste | Costa Calma | Jandía | El Cotillo | Betancuria ...
  heroImage?: string;
  features?: AlojamientoFeature[];
  mapQuery?: string;
  adultsOnly?: boolean;
  stars?: number; // 3 4 5
}

// Minimal enriched migration subset extracted from static alojamiento.html
export const ALOJAMIENTO: Alojamiento[] = [
  {
    id: 'riu-palace-tres-islas',
    name: 'Riu Palace Tres Islas',
    summary: 'Resort Todo Incluido 5* frente a Grandes Playas con spa y varias piscinas.',
    category: 'resort',
    zone: 'Corralejo',
    stars: 5,
    heroImage: '/images/alojamiento/hotel-corralejo.jpg',
    mapQuery: 'Riu Palace Tres Islas Corralejo Fuerteventura',
    features: [
      { icon: 'fa-swimming-pool', label: '4 Piscinas' },
      { icon: 'fa-spa', label: 'Spa' },
      { icon: 'fa-utensils', label: '4 Restaurantes' },
      { icon: 'fa-wifi', label: 'WiFi gratis' }
    ]
  },
  {
    id: 'miraflor-suites',
    name: 'Miraflor Suites',
    summary: 'Aparthotel moderno céntrico con piscina climatizada cerca del puerto.',
    category: 'apartamento',
    zone: 'Corralejo',
    heroImage: '/images/alojamiento/apartamentos-caleta.jpg',
    mapQuery: 'Miraflor Suites Corralejo Fuerteventura',
    features: [
      { icon: 'fa-swimming-pool', label: 'Piscina climatizada' },
      { icon: 'fa-utensils', label: 'Cocina' },
      { icon: 'fa-parking', label: 'Parking' },
      { icon: 'fa-umbrella-beach', label: '300m playa' }
    ]
  },
  {
    id: 'corralejo-beach-resort',
    name: 'Corralejo Beach Resort',
    summary: 'Hotel familiar frente al mar con vistas al parque de dunas.',
    category: 'hotel',
    zone: 'Corralejo',
    heroImage: '/images/alojamiento/hotel-corralejo.jpg',
    mapQuery: 'Corralejo Beach Resort Fuerteventura',
    features: [
      { icon: 'fa-umbrella-beach', label: 'Primera línea' },
      { icon: 'fa-child', label: 'Kids club' },
      { icon: 'fa-dumbbell', label: 'Gimnasio' },
      { icon: 'fa-cocktail', label: 'Bar piscina' }
    ]
  },
  {
    id: 'bahia-de-lobos',
    name: 'Bahía de Lobos Apartamentos',
    summary: 'Apartamentos económicos a 5 min del centro y la playa.',
    category: 'apartamento',
    zone: 'Corralejo',
    heroImage: '/images/alojamiento/apartamentos-caleta.jpg',
    mapQuery: 'Bahia de Lobos Apartamentos Corralejo',
    features: [
      { icon: 'fa-euro-sign', label: 'Económico' },
      { icon: 'fa-utensils', label: 'Cocina' },
      { icon: 'fa-wifi', label: 'WiFi' },
      { icon: 'fa-person-walking', label: 'Centro 5 min' }
    ]
  },
  {
    id: 'h10-ocean-dreams',
    name: 'H10 Ocean Dreams',
    summary: 'Hotel boutique solo adultos con piscina infinity y rooftop bar.',
    category: 'hotel',
    zone: 'Corralejo',
    adultsOnly: true,
    heroImage: '/images/alojamiento/hotel-corralejo.jpg',
    mapQuery: 'H10 Ocean Dreams Corralejo',
    features: [
      { icon: 'fa-user-plus', label: 'Solo adultos' },
      { icon: 'fa-infinity', label: 'Piscina infinity' },
      { icon: 'fa-cocktail', label: 'Rooftop bar' },
      { icon: 'fa-utensils', label: 'Gourmet' }
    ]
  },
  {
    id: 'villas-oasis-papagayo',
    name: 'Villas Oasis Papagayo',
    summary: 'Complejo de villas independientes con piscina privada y jardín.',
    category: 'villa',
    zone: 'Corralejo',
    heroImage: '/images/alojamiento/apartamentos-caleta.jpg',
    mapQuery: 'Villas Oasis Papagayo Corralejo',
    features: [
      { icon: 'fa-home', label: 'Villas privadas' },
      { icon: 'fa-swimming-pool', label: 'Piscina privada' },
      { icon: 'fa-tree', label: 'Jardín tropical' },
      { icon: 'fa-mountain', label: 'Junto a dunas' }
    ]
  },
  // Caleta de Fuste subset
  {
    id: 'sheraton-fuerteventura',
    name: 'Sheraton Fuerteventura Golf & Spa Resort',
    summary: 'Resort 5* con golf de 18 hoyos, spa Thalasso y playa privada.',
    category: 'resort',
    zone: 'Caleta de Fuste',
    stars: 5,
    heroImage: '/images/alojamiento/apartamentos-caleta.jpg',
    mapQuery: 'Sheraton Fuerteventura Golf Spa Resort',
    features: [
      { icon: 'fa-golf-ball', label: 'Golf 18 hoyos' },
      { icon: 'fa-spa', label: 'Thalasso Spa' },
      { icon: 'fa-swimming-pool', label: '3 Piscinas' },
      { icon: 'fa-star', label: '5 estrellas' }
    ]
  },
  {
    id: 'elba-sara-beach',
    name: 'Elba Sara Beach & Golf Resort',
    summary: 'Hotel 4* frente al mar con acceso a playa y animación.',
    category: 'hotel',
    zone: 'Caleta de Fuste',
    heroImage: '/images/alojamiento/hotel-corralejo.jpg',
    mapQuery: 'Elba Sara Beach Golf Resort Caleta de Fuste',
    features: [
      { icon: 'fa-umbrella-beach', label: 'Primera línea' },
      { icon: 'fa-swimming-pool', label: 'Piscinas climatizadas' },
      { icon: 'fa-utensils', label: 'Todo incluido' },
      { icon: 'fa-music', label: 'Animación' }
    ]
  },
  {
    id: 'morasol-suites',
    name: 'Morasol Suites',
    summary: 'Apartamentos con terraza vista mar y piscina comunitaria.',
    category: 'apartamento',
    zone: 'Caleta de Fuste',
    heroImage: '/images/alojamiento/apartamentos-caleta.jpg',
    mapQuery: 'Morasol Suites Caleta de Fuste',
    features: [
      { icon: 'fa-utensils', label: 'Cocina completa' },
      { icon: 'fa-swimming-pool', label: 'Piscina' },
      { icon: 'fa-balcony', label: 'Terraza' },
      { icon: 'fa-plane', label: '10km aeropuerto' }
    ]
  },
  // Costa Calma subset
  {
    id: 'h10-tindaya',
    name: 'H10 Tindaya',
    summary: 'Hotel 4* superior frente a Sotavento con actividades náuticas.',
    category: 'hotel',
    zone: 'Costa Calma',
    heroImage: '/images/alojamiento/hotel-corralejo.jpg',
    mapQuery: 'H10 Tindaya Costa Calma Fuerteventura',
    features: [
      { icon: 'fa-infinity', label: 'Piscina infinity' },
      { icon: 'fa-wind', label: 'Windsurf/Kite' },
      { icon: 'fa-spa', label: 'Spa' },
      { icon: 'fa-umbrella-beach', label: 'Playa Sotavento' }
    ]
  },
  {
    id: 'sotavento-beach-club',
    name: 'Sotavento Beach Club',
    summary: 'Apartamentos a pie de playa con gimnasio y alquiler windsurf.',
    category: 'apartamento',
    zone: 'Costa Calma',
    heroImage: '/images/alojamiento/apartamentos-caleta.jpg',
    mapQuery: 'Sotavento Beach Club Costa Calma',
    features: [
      { icon: 'fa-umbrella-beach', label: 'Pie de playa' },
      { icon: 'fa-dumbbell', label: 'Gimnasio' },
      { icon: 'fa-wind', label: 'Alquiler windsurf' },
      { icon: 'fa-wifi', label: 'WiFi gratis' }
    ]
  },
  // Jandía subset
  {
    id: 'iberostar-fuerteventura-palace',
    name: 'Iberostar Selection Fuerteventura Palace',
    summary: 'Resort 5* Todo Incluido frente a playa de Jandía con spa.',
    category: 'resort',
    zone: 'Jandía / Morro Jable',
    stars: 5,
    heroImage: '/images/alojamiento/hotel-corralejo.jpg',
    mapQuery: 'Iberostar Selection Fuerteventura Palace Jandia',
    features: [
      { icon: 'fa-star', label: '5 estrellas' },
      { icon: 'fa-utensils', label: 'Todo incluido' },
      { icon: 'fa-spa', label: 'SPA Sensations' },
      { icon: 'fa-swimmer', label: '5 piscinas' }
    ]
  },
  {
    id: 'tui-blue-orquidea',
    name: 'TUI BLUE Orquidea',
    summary: 'Hotel 4* con deportes, fitness y música en vivo en paseo marítimo.',
    category: 'hotel',
    zone: 'Jandía / Morro Jable',
    heroImage: '/images/alojamiento/apartamentos-caleta.jpg',
    mapQuery: 'TUI BLUE Orquidea Morro Jable',
    features: [
      { icon: 'fa-dumbbell', label: 'Fitness premium' },
      { icon: 'fa-music', label: 'Música vivo' },
      { icon: 'fa-bicycle', label: 'Bike center' },
      { icon: 'fa-person-walking', label: 'Paseo marítimo' }
    ]
  }
];
