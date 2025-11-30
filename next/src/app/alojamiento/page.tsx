import { ALOJAMIENTO } from '../../data/alojamiento';

export const dynamic = 'force-dynamic';

export default function AlojamientoPage() {
  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Alojamiento</h1>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {ALOJAMIENTO.map(a => (
          <article key={a.id} className="rounded border p-4 bg-white hover:shadow transition">
            <h2 className="text-xl font-semibold mb-2">{a.name}</h2>
            <p className="text-sm text-gray-600 mb-2">{a.summary}</p>
            <ul className="text-xs text-gray-500 mb-2 space-y-1">
              <li><strong>Categoría:</strong> {a.category}</li>
              {a.location && <li><strong>Localización:</strong> {a.location}</li>}
            </ul>
          </article>
        ))}
      </div>
    </main>
  );
}
