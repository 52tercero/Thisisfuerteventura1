export interface PlayaFeature { icon?: string; label: string }
export interface Playa {
  id: string;
  title: string;
  zone: string; // Corralejo | Jandía | El Cotillo | Costa Calma | Ajuy | Morro Jable | Esquinzo
  summary: string;
  description?: string;
  heroImage?: string;
  features?: PlayaFeature[];
  mapQuery?: string;
  caution?: string; // notas de advertencia (corrientes, acceso pista, etc.)
}

export const PLAYAS: Playa[] = [
  {
    id: 'grandes-playas-corralejo',
    title: 'Grandes Playas de Corralejo',
    zone: 'Corralejo',
    summary: 'Más de 10 km de arena blanca junto al parque de dunas; aguas turquesas poco profundas.',
    description: 'Zona norte ventosa ideal para windsurf y kitesurf; familias en sectores de menor viento.',
    heroImage: '/images/playas/corralejo.jpeg',
    mapQuery: 'Grandes Playas de Corralejo Fuerteventura',
    features: [
      { icon: 'fa-parking', label: 'Aparcamiento' },
      { icon: 'fa-umbrella-beach', label: 'Hamacas' },
      { icon: 'fa-wind', label: 'Windsurf' },
      { icon: 'fa-utensils', label: 'Chiringuitos' }
    ]
  },
  {
    id: 'playa-cofete',
    title: 'Playa de Cofete',
    zone: 'Jandía',
    summary: '12 km de playa virgen entre montañas; paisaje salvaje icónico.',
    description: 'Acceso por pista de tierra; oleaje fuerte y corrientes—baño con mucha precaución.',
    heroImage: '/images/playas/cofete.jpeg',
    mapQuery: 'Playa de Cofete Fuerteventura',
    caution: 'Corrientes fuertes y acceso por pista (4x4 recomendado).',
    features: [
      { icon: 'fa-person-hiking', label: 'Playa virgen' },
      { icon: 'fa-camera', label: 'Paisajes únicos' },
      { icon: 'fa-triangle-exclamation', label: 'Corrientes' },
      { icon: 'fa-car', label: '4x4 recomendado' }
    ]
  },
  {
    id: 'lagos-el-cotillo',
    title: 'Lagos de El Cotillo',
    zone: 'El Cotillo',
    summary: 'Calas protegidas y piscinas naturales de aguas cristalinas.',
    description: 'Ideal familias y snorkel; surf en zonas abiertas más al sur.',
    heroImage: '/images/playas/cotillo.jpeg',
    mapQuery: 'Lagos de El Cotillo Fuerteventura',
    features: [
      { icon: 'fa-child', label: 'Familias' },
      { icon: 'fa-swimming-pool', label: 'Piscinas naturales' },
      { icon: 'fa-fish', label: 'Snorkel' },
      { icon: 'fa-parking', label: 'Parking' }
    ]
  },
  {
    id: 'playa-sotavento',
    title: 'Playa de Sotavento',
    zone: 'Costa Calma',
    summary: '9 km de playa con laguna intermareal y vientos constantes.',
    description: 'Spot mundial de windsurf/kite con escuelas y servicios turísticos.',
    heroImage: '/images/playas/sotavento.jpeg',
    mapQuery: 'Playa de Sotavento Costa Calma Fuerteventura',
    features: [
      { icon: 'fa-wind', label: 'Windsurf/Kite' },
      { icon: 'fa-trophy', label: 'Campeonatos' },
      { icon: 'fa-school', label: 'Escuelas' },
      { icon: 'fa-umbrella-beach', label: 'Servicios' }
    ]
  },
  {
    id: 'playa-ajuy',
    title: 'Playa de Ajuy (Negra)',
    zone: 'Ajuy',
    summary: 'Pequeña playa de arena negra con cuevas marinas y restaurantes.',
    description: 'Pueblo pesquero auténtico; paseo a cuevas visitables. Oleaje moderado.',
    heroImage: '/images/playas/ajuy.jpeg',
    mapQuery: 'Playa de Ajuy Fuerteventura',
    features: [
      { icon: 'fa-mountain', label: 'Arena volcánica' },
      { icon: 'fa-dungeon', label: 'Cuevas' },
      { icon: 'fa-fish', label: 'Pueblo pesquero' },
      { icon: 'fa-utensils', label: 'Restaurantes' }
    ]
  },
  {
    id: 'playa-morro-jable',
    title: 'Playa de Morro Jable',
    zone: 'Morro Jable',
    summary: 'Playa urbana de 4 km con paseo, aguas tranquilas y servicios.',
    description: 'Hoteles y restauración abundante; excursiones en barco desde el puerto.',
    heroImage: '/images/playas/morrojable.jpeg',
    mapQuery: 'Playa de Morro Jable Fuerteventura',
    features: [
      { icon: 'fa-city', label: 'Urbana' },
      { icon: 'fa-child', label: 'Familias' },
      { icon: 'fa-umbrella-beach', label: 'Servicios completos' },
      { icon: 'fa-ship', label: 'Excursiones' }
    ]
  },
  {
    id: 'playa-la-concha-cotillo',
    title: 'Playa de La Concha',
    zone: 'El Cotillo',
    summary: 'Bahía en forma de concha con aguas muy calmadas.',
    description: 'Ideal para niños y mayores; arena blanca muy fina.',
    heroImage: '/images/playas/laconcha.webp',
    mapQuery: 'Playa de La Concha El Cotillo Fuerteventura',
    features: [
      { icon: 'fa-baby', label: 'Ideal niños' },
      { icon: 'fa-water', label: 'Aguas tranquilas' },
      { icon: 'fa-parking', label: 'Parking' },
      { icon: 'fa-heart', label: 'Popular' }
    ]
  },
  {
    id: 'playa-esquinzo',
    title: 'Playa de Esquinzo (Butihondo)',
    zone: 'Esquinzo',
    summary: 'Playa tranquila entre acantilados con arena dorada.',
    description: 'Menos masificada; servicios básicos y chiringuitos en temporada.',
    heroImage: '/images/playas/esquinzo.jpeg',
    mapQuery: 'Playa de Esquinzo Butihondo Fuerteventura',
    features: [
      { icon: 'fa-users', label: 'Tranquila' },
      { icon: 'fa-mountain', label: 'Acantilados' },
      { icon: 'fa-parking', label: 'Parking gratuito' },
      { icon: 'fa-umbrella-beach', label: 'Servicios básicos' }
    ]
  },
  {
    id: 'playa-matorral',
    title: 'Playa del Matorral',
    zone: 'Morro Jable',
    summary: 'Extensión menos urbanizada de Morro Jable con paseo al faro.',
    description: 'Popular para caminar y observar aves; arena clara y aguas limpias.',
    heroImage: '/images/playas/matorral.jpg',
    mapQuery: 'Playa del Matorral Fuerteventura',
    features: [
      { icon: 'fa-person-running', label: 'Paseos' },
      { icon: 'fa-crow', label: 'Aves' },
      { icon: 'fa-lightbulb', label: 'Faro cercano' },
      { icon: 'fa-umbrella-beach', label: 'Menos concurrida' }
    ]
  }
];
