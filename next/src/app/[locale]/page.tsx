import ScrollReveal from '@/components/ScrollReveal';
import ParallaxHero from '@/components/ParallaxHero';
import TimelineSwiper from '@/components/TimelineSwiper';
import FeaturedGrid from '@/components/FeaturedGrid';
import { sanitizeHTML } from '@/lib/sanitize';
import { slugify } from '@/lib/news';

async function fetchFeatured() {
  const sources = process.env.NEXT_PUBLIC_NEWS_SOURCES || 'https://rss.app/feeds/jbwZ2Q9QAvgvI6G0.xml,https://rss.app/feeds/8SmCQL7GDZyu2xB4.xml';
  try {
    const res = await fetch(`/api/aggregate?sources=${encodeURIComponent(sources)}`, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data.items) ? data.items.slice(0, 9) : [];
  } catch {
    return [];
  }
}

export default async function HomeLocale({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const featured = await fetchFeatured();
  // useTranslations only works in client components; minimal inline texts kept until nav is hydrated
  return (
    <main className="min-h-screen">
      <section className="relative h-[60vh] bg-black">
        <img src="/images/turismo/la-oliva.avif" alt="Fuerteventura" className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-black/40" />
        <ParallaxHero>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center">
            <h1 className="text-3xl md:text-5xl font-bold">Bienvenido a Fuerteventura</h1>
            <p className="mt-2 md:mt-4">Descubre el paraíso de las Islas Canarias</p>
            <a href={`/${locale}/turismo`} className="mt-4 inline-block px-5 py-2 rounded bg-white/90 text-black">Explorar la isla</a>
          </div>
        </ParallaxHero>
      </section>
      <section className="container mx-auto px-4 py-10">
        <ScrollReveal>
          <h2 className="text-2xl font-semibold">Destacados</h2>
        </ScrollReveal>
        <FeaturedGrid>
          <div id="featured-news" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {featured.length === 0 ? (
              <ScrollReveal className="rounded border p-4">Cargando contenido...</ScrollReveal>
            ) : (
              featured.map((n: any, idx: number) => {
                const title = n.title || 'Sin título';
                const date = n.pubDate || n.date || '';
                const rawImg = n.image || '/images/logo.jpg';
                const img = rawImg.startsWith('http')
                  ? `/api/image?url=${encodeURIComponent(rawImg)}`
                  : rawImg;
                const slug = slugify(title);
                const summary = sanitizeHTML(n.description || n.summary || '');
                return (
                  <article key={idx} className="rounded border overflow-hidden bg-white hover:shadow transition">
                    <img src={img} alt={title} className="w-full h-48 object-cover" />
                    <div className="p-4 flex flex-col gap-2">
                      <h3 className="text-lg font-semibold leading-tight line-clamp-3">{title}</h3>
                      {date && (
                        <p className="text-xs text-gray-500">{new Date(date).toLocaleDateString('es-ES')}</p>
                      )}
                      <div className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: summary }} />
                      <a href={`/${locale}/noticia/${slug}`} className="text-blue-600 text-sm font-medium">Leer más →</a>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </FeaturedGrid>
        {featured.length > 0 && (
          <TimelineSwiper items={featured.map((n: any) => ({ title: n.title, date: n.pubDate || n.date }))} />
        )}
      </section>
    </main>
  );
}
