import { slugify } from '../../../lib/news';
import { getMessages } from '../../../lib/i18n';
import ScrollObserver from '../../../components/ScrollObserver';

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

interface PageProps { params: Promise<{ locale: string }>; searchParams: Promise<Record<string,string>> }

export default async function Noticias({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const resolvedSearch = await searchParams;
  const messages = getMessages(locale);
  const tSections = messages.sections;
  const tNews = messages.news || { searchLabel:'Buscar', searchPlaceholder:'Buscar título...', filter:'Filtrar', page:'Página', of:'de', items:'noticias', noResults:'Sin resultados', prev:'← Anterior', next:'Siguiente →', showing:'Mostrando' };
  const pageParam = typeof resolvedSearch?.page === 'string' ? resolvedSearch.page : '1';
  const qParam = typeof resolvedSearch?.q === 'string' ? resolvedSearch.q : '';
  const currentPage = Math.max(parseInt(pageParam || '1',10),1);
  const query = qParam.trim().toLowerCase();
  const itemsPerPage = 12;
  const data = await fetchAggregate();
  let items = Array.isArray(data.items) ? data.items : [];
  if (query) items = items.filter((it: any) => (it.title||'').toLowerCase().includes(query));
  const totalItems = items.length;
  const totalPages = Math.max(Math.ceil(totalItems/itemsPerPage),1);
  const start = (currentPage-1)*itemsPerPage;
  const pageItems = items.slice(start,start+itemsPerPage);

  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">{tSections.news}</h1>
      {data.error && <div className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">Error: {data.error}</div>}
      <form method="get" className="mb-6 flex flex-col md:flex-row gap-3 md:items-end">
        <div className="flex-1">
          <label htmlFor="q" className="block text-sm font-medium mb-1">{tNews.searchLabel}</label>
          <input id="q" name="q" defaultValue={query} placeholder={tNews.searchPlaceholder} className="w-full rounded border px-3 py-2" />
        </div>
        <button type="submit" className="h-[42px] px-5 rounded bg-blue-600 text-white font-medium shadow">{tNews.filter}</button>
      </form>
      <div className="text-sm text-gray-600 mb-4">{tNews.page} {currentPage} {tNews.of} {totalPages} · {totalItems} {tNews.items}</div>
      <ScrollObserver>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pageItems.length === 0 ? <div className="col-span-full rounded border p-4">{tNews.noResults}</div> : pageItems.map((n:any,idx:number) => {
          const slug = slugify(n.title||'');
          const rawImg = n.image || '/images/Fuerteventura.jpeg';
          const img = rawImg && rawImg.startsWith('http') ? `/api/image?url=${encodeURIComponent(rawImg)}` : rawImg;
          return (
            <article key={idx} className="rounded border overflow-hidden bg-white hover:shadow transition">
              <img src={img} alt={n.title||'Noticia'} className="w-full h-48 object-cover" />
              <div className="p-4 flex flex-col gap-2">
                <h3 className="text-lg font-semibold leading-tight line-clamp-3">{n.title||'Noticia'}</h3>
                <p className="text-xs text-gray-500">{n.pubDate ? new Date(n.pubDate).toLocaleDateString(locale==='de'?'de-DE':locale==='en'?'en-GB':'es-ES') : ''}</p>
                <a href={`/${locale}/noticia/${slug}`} className="text-blue-600 text-sm font-medium">Leer más →</a>
              </div>
            </article>
          );
        })}
      </div>
      </ScrollObserver>
      <div className="flex items-center justify-between mt-8">
        <div className="flex gap-2">
          {currentPage>1 && <a href={`?page=${currentPage-1}${query?`&q=${encodeURIComponent(query)}`:''}`} className="px-3 py-2 rounded border bg-gray-50">{tNews.prev}</a>}
          {currentPage<totalPages && <a href={`?page=${currentPage+1}${query?`&q=${encodeURIComponent(query)}`:''}`} className="px-3 py-2 rounded border bg-gray-50">{tNews.next}</a>}
        </div>
        <div className="text-xs text-gray-500">{tNews.showing} {pageItems.length}</div>
      </div>
    </main>
  );
}
