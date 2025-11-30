export interface BlogPost {
  title: string;
  slug: string;
  date: string; // ISO string
  category: string;
  image: string;
  excerpt: string;
  content: string;
}

// Static import of legacy JSON data
import postsData from '../../../data/blog.json';

export const blogPosts: BlogPost[] = (postsData as any).posts as BlogPost[];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find(p => p.slug === slug);
}

export function getSortedPosts(): BlogPost[] {
  return [...blogPosts].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}export interface BlogPost {
  title: string;
  slug: string;
  date: string; // ISO
  category: string;
  image?: string;
  excerpt: string;
  content: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    title: 'Rutas secretas en el norte de Fuerteventura',
    slug: 'rutas-secretas-norte',
    date: '2025-11-15',
    category: 'Rutas',
    image: '/images/turismo/el-cotillo.avif',
    excerpt: 'Descubre senderos poco conocidos entre volcanes y calas cerca de El Cotillo y Corralejo.',
    content: 'Desde El Cotillo hacia el norte encontrarás pistas de tierra que conectan calas de aguas turquesas y charcos tranquilos. Recomendación: madruga, lleva agua y protege el entorno.'
  },
  {
    title: 'Entrevista a una guardaparques de Jandía',
    slug: 'entrevista-guardaparques-jandia',
    date: '2025-11-10',
    category: 'Entrevistas',
    image: '/images/turismo/parque-natural-jandia.jpg',
    excerpt: 'Conservación en Cofete, impacto del turismo y cómo visitar responsablemente.',
    content: 'La guardaparques explica la riqueza natural de Jandía y la importancia de no dejar residuos. Recomienda informarse del estado de pistas y mareas.'
  },
  {
    title: 'Eventos en Fuerteventura: Diciembre 2025',
    slug: 'eventos-diciembre-2025',
    date: '2025-11-05',
    category: 'Agenda',
    image: '/images/turismo/puerto-del-rosario-.jpg',
    excerpt: 'Mercadillos navideños, conciertos al aire libre y rutas guiadas.',
    content: 'Puerto del Rosario acoge el mercadillo navideño y actuaciones locales. En La Oliva, rutas guiadas por el casco histórico.'
  }
];
