import { PLAYAS } from '../../data/playas';

export const dynamic = 'force-dynamic';

export default function PlayasPage() {
  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Playas</h1>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {PLAYAS.map(p => (
          <article key={p.id} className="rounded border p-4 bg-white hover:shadow transition">
            <h2 className="text-xl font-semibold mb-2">{p.title}</h2>
            <p className="text-sm text-gray-600 mb-2">{p.summary}</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {p.features?.map(f => <span key={f} className="text-xs px-2 py-1 bg-gray-100 rounded">{f}</span>)}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
