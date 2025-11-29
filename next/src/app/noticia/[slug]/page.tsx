import { slugify, NewsItem } from '../../../lib/news';
import { getMessages } from '../../../lib/i18n';

export const dynamic = 'force-dynamic';

async function fetchAggregate() {
  const url = process.env.NEXT_PUBLIC_AGGREGATE_URL || 'http://localhost:3000/api/aggregate';
  const sources = process.env.NEXT_PUBLIC_NEWS_SOURCES || 'https://rss.app/feeds/jbwZ2Q9QAvgvI6G0.xml,https://rss.app/feeds/8SmCQL7GDZyu2xB4.xml';
  try {
    const res = await fetch(`${url}?sources=${encodeURIComponent(sources)}`, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    return { items: [], error: String(e) };
  }
}

interface PageProps { params: { slug: string } }

export default async function NoticiaDetalle({ params }: PageProps) {
  const { slug } = params;
  const data = await fetchAggregate();
  const items: NewsItem[] = Array.isArray(data.items) ? data.items : [];
  const match = items.find(it => slugify(it.title || '') === slug);

  const messages = getMessages('es');
  const tArticle = messages.article;
  if (!match) {
    return (
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-4">{tArticle.notFound}</h1>
        <p>{tArticle.notFoundDescription}</p>
        <a href="/noticias" className="inline-block mt-6 text-blue-600">← {tArticle.backToNews}</a>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-10">
      <article className="prose max-w-none">
        <h1>{match.title}</h1>
        {match.pubDate && <p className="text-sm text-gray-500">{tArticle.published}: {new Date(match.pubDate).toLocaleDateString('es-ES')}</p>}
        {match.image && (
          <div className="my-6">
            <img src={match.image} alt={match.title || 'Noticia'} className="w-full max-h-[480px] object-cover rounded" />
          </div>
        )}
        <div className="mt-4 text-gray-700 whitespace-pre-wrap">
          {(match.description || '').replace(/<script[^>]*>[\s\S]*?<\/script>/gi,'')}
        </div>
        {match.link && (
          <p className="mt-6"><a href={match.link} target="_blank" rel="noopener" className="text-blue-600">{tArticle.source} →</a></p>
        )}
      </article>
      <div className="mt-10">
        <a href="/noticias" className="text-sm text-blue-600">← {tArticle.backToNews}</a>
      </div>
    </main>
  );
}
