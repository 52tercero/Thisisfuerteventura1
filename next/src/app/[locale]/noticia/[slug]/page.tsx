import { slugify, NewsItem } from '../../../../lib/news';
import { getMessages } from '../../../../lib/i18n';
import { sanitizeHTML } from '../../../../lib/sanitize';
import ImageWithFallback from '../../../../components/ImageWithFallback';

export const dynamic = 'force-dynamic';

async function fetchAggregate(locale: string) {
  const url = process.env.NEXT_PUBLIC_AGGREGATE_URL || 'http://localhost:3000/api/aggregate';
  const defaultSources = 'https://rss.app/feeds/jbwZ2Q9QAvgvI6G0.xml,https://rss.app/feeds/8SmCQL7GDZyu2xB4.xml';
  const sources = process.env.NEXT_PUBLIC_NEWS_SOURCES || defaultSources;
  try {
    const res = await fetch(`${url}?sources=${encodeURIComponent(sources)}`, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    return { items: [], error: String(e) };
  }
}


interface PageProps { params: Promise<{ locale: string; slug: string }> }

export default async function NoticiaDetalle({ params }: PageProps) {
  const { locale, slug } = await params;
  const messages = getMessages(locale);
  const tArticle = messages.article;
  const data = await fetchAggregate(locale);
  const items: NewsItem[] = Array.isArray(data.items) ? data.items : [];
  const match = items.find(it => slugify(it.title || '') === slug);

  if (!match) {
    return (
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-4">{tArticle.notFound}</h1>
        <p>{tArticle.notFoundDescription}</p>
        <a href={`/${locale}/noticias`} className="inline-block mt-6 text-blue-600">← {tArticle.backToNews}</a>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-10">
      <article className="prose max-w-none">
        <h1>{match.title}</h1>
        {match.pubDate && (
          <p className="text-sm text-gray-500">{tArticle.published}: {new Date(match.pubDate).toLocaleDateString(locale === 'es' ? 'es-ES' : locale === 'de' ? 'de-DE' : 'en-GB')}</p>
        )}
        {match.image && (
            <div className="my-6">
              const rawImg = match?.image || '/images/logo.jpg';
              const image = rawImg && rawImg.startsWith('http')
                ? `/api/image?url=${encodeURIComponent(rawImg)}`
                : rawImg;
              <ImageWithFallback src={image} alt={match.title || 'Noticia'} className="w-full max-h-[480px] object-cover rounded" />
          </div>
        )}
        <div className="mt-4 text-gray-700">
          {/* Render sanitized HTML from external feed content */}
          <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(match.description || '') }} />
        </div>
        {match.link && (
          <p className="mt-6"><a href={match.link} target="_blank" rel="noopener" className="text-blue-600">{tArticle.source} →</a></p>
        )}
      </article>
      <div className="mt-10">
        <a href={`/${locale}/noticias`} className="text-sm text-blue-600">← {tArticle.backToNews}</a>
      </div>
    </main>
  );
}
