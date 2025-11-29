import { TURISMO } from '../../data/turismo';
import { getMessages } from '../../lib/i18n';

export const dynamic = 'force-dynamic';

export default function TurismoPage() {
  const messages = getMessages('es');
  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">{messages.sections.turismo}</h1>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {TURISMO.map(spot => (
          <article key={spot.id} className="rounded border bg-white p-4 hover:shadow transition">
            <h2 className="text-xl font-semibold mb-2">{spot.title}</h2>
            <p className="text-sm text-gray-600 mb-2">{spot.summary}</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {spot.features.slice(0,3).map(f => <span key={f} className="text-xs px-2 py-1 bg-gray-100 rounded">{f}</span>)}
            </div>
            <a href={`/turismo/${spot.id}`} className="text-sm text-blue-600 font-medium">{messages.actions.viewDetail} →</a>
          </article>
        ))}
      </div>
    </main>
  );
}
