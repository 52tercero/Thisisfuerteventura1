import ScrollReveal from "@/components/ScrollReveal";
import ParallaxHero from "@/components/ParallaxHero";
import HeroVideo from "@/components/HeroVideo";
import Particles from "../components/Particles";
import DarkModeToggle from '../components/DarkModeToggle';
import TimelineSwiper from "@/components/TimelineSwiper";
import { useStaggerReveal } from "@/lib/gsapReveals";
import FeaturedGrid from "@/components/FeaturedGrid";

async function fetchFeatured() {
  const sources = process.env.NEXT_PUBLIC_NEWS_SOURCES || "https://rss.app/feeds/jbwZ2Q9QAvgvI6G0.xml,https://rss.app/feeds/8SmCQL7GDZyu2xB4.xml";
  try {
    const res = await fetch(`/api/aggregate?sources=${encodeURIComponent(sources)}`, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data.items) ? data.items.slice(0, 8) : [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const featured = await fetchFeatured();
  return (
    <main className="min-h-screen">
      <Particles />
      <section className="hero parallax reveal hero-video">
        <div className="hero-bg">
          {/* Hero con componente que intenta reproducir y hace fallback a poster */}
          <HeroVideo src="/VideoHeader.mp4" poster="/images/turismo/la-oliva.avif" />
        </div>
        <div className="hero-overlay light" />
        <div className="hero-content">
          <ParallaxHero>
            <div className="flex justify-end p-4"><DarkModeToggle /></div>
            <div>
              <h1 className="text-3xl md:text-5xl">Bienvenido a Fuerteventura</h1>
              <p className="mt-3 md:mt-5 text-lg md:text-xl">Descubre el paraíso de las Islas Canarias</p>
              <a href="/turismo" className="mt-6 inline-block px-6 py-3 rounded bg-white/90 text-black font-medium shadow-sm hover:bg-white">Explorar la isla</a>
            </div>
          </ParallaxHero>
        </div>
      </section>
      <section className="container mx-auto px-4 py-10">
        <ScrollReveal>
          <h2 className="text-2xl font-semibold">Destacados</h2>
        </ScrollReveal>
        <FeaturedGrid>
          <div id="featured-news" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            <ScrollReveal className="rounded border p-4">Cargando contenido...</ScrollReveal>
          </div>
        </FeaturedGrid>
        {/* Timeline slider wired to aggregate feed */}
        {featured.length > 0 && (
          <TimelineSwiper items={featured.map((n: any) => ({ title: n.title, date: n.pubDate || n.date }))} />
        )}
      </section>
    </main>
  );
}
