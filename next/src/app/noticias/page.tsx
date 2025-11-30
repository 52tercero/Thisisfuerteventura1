export const dynamic = 'force-dynamic';

import { slugify } from '../../lib/news';

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

interface PageProps { searchParams?: Record<string, string | string[]> }

export default async function Noticias({ searchParams }: PageProps) {
  const pageParam = typeof searchParams?.page === 'string' ? searchParams?.page : Array.isArray(searchParams?.page) ? searchParams?.page[0] : '1';
  const qParam = typeof searchParams?.q === 'string' ? searchParams?.q : Array.isArray(searchParams?.q) ? searchParams?.q[0] : '';
  const currentPage = Math.max(parseInt(pageParam || '1', 10), 1);
  const query = (qParam || '').trim().toLowerCase();
  const itemsPerPage = 12;

  const data = await fetchAggregate();
  let items = Array.isArray(data.items) ? data.items : [];

  if (query) {
    items = items.filter((it: any) => (it.title || '').toLowerCase().includes(query));
  }

  const totalItems = items.length;
  const totalPages = Math.max(Math.ceil(totalItems / itemsPerPage), 1);
  const start = (currentPage - 1) * itemsPerPage;
  const pageItems = items.slice(start, start + itemsPerPage);

  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Noticias</h1>
      {data.error && <div className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">Error al cargar: {data.error}</div>}
      <form method="get" className="mb-6 flex flex-col md:flex-row gap-3 md:items-end">
        <div className="flex-1">
          <label htmlFor="q" className="block text-sm font-medium mb-1">Buscar</label>
          <input id="q" name="q" defaultValue={query} placeholder="Buscar título..." className="w-full rounded border px-3 py-2" />
        </div>
        <button type="submit" className="h-[42px] px-5 rounded bg-blue-600 text-white font-medium shadow">Filtrar</button>
      </form>
      <div className="text-sm text-gray-600 mb-4">Página {currentPage} de {totalPages} · {totalItems} noticias</div>
      <div id="news-container" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pageItems.length === 0 ? (
          <div className="col-span-full rounded border p-4">No se pudieron cargar las noticias</div>
        ) : pageItems.map((n: any, idx: number) => {
          const slug = slugify(n.title || '');
          return (
            <article key={idx} className="rounded border overflow-hidden bg-white hover:shadow transition">
              <img src={n.image || '/images/Fuerteventura.jpeg'} alt={n.title || 'Noticia'} className="w-full h-48 object-cover" />
              <div className="p-4 flex flex-col gap-2">
                <h3 className="text-lg font-semibold leading-tight line-clamp-3">{n.title || 'Noticia'}</h3>
                <p className="text-xs text-gray-500">{n.pubDate ? new Date(n.pubDate).toLocaleDateString('es-ES') : ''}</p>
                <a href={`/noticia/${slug}`} className="text-blue-600 text-sm font-medium">Leer más →</a>
              </div>
            </article>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-8">
        <div className="flex gap-2">
          {currentPage > 1 && (
            <a href={`?page=${currentPage - 1}${query ? `&q=${encodeURIComponent(query)}` : ''}`} className="px-3 py-2 rounded border bg-gray-50">← Anterior</a>
          )}
          {currentPage < totalPages && (
            <a href={`?page=${currentPage + 1}${query ? `&q=${encodeURIComponent(query)}` : ''}`} className="px-3 py-2 rounded border bg-gray-50">Siguiente →</a>
          )}
        </div>
        <div className="text-xs text-gray-500">Mostrando {pageItems.length} en esta página</div>
      </div>
    </main>
  );
}
