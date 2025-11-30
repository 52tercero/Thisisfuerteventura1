import { SENDEROS } from '../../data/senderos';
import { slugify } from '../../lib/news';
import { getMessages } from '../../lib/i18n';

export const dynamic = 'force-dynamic';

export default function SenderosPage() {
  const messages = getMessages('es');
  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">{messages.sections.senderos}</h1>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {SENDEROS.map(s => (
          <article key={s.slug} className="rounded border p-4 bg-white hover:shadow transition">
            <h2 className="text-xl font-semibold mb-2">{s.name}</h2>
            <p className="text-sm text-gray-600 mb-2">{s.summary}</p>
            <ul className="text-xs text-gray-500 mb-3 space-y-1">
              <li><strong>{messages.trails.difficulty}:</strong> {s.difficulty}</li>
              <li><strong>{messages.trails.distance}:</strong> {s.distanceKm} km · +{s.ascentM} m</li>
              <li><strong>{messages.trails.duration}:</strong> {(s.durationMin/60).toFixed(1)} h</li>
            </ul>
            <a href={`/senderos/${slugify(s.slug)}`} className="text-sm text-blue-600 font-medium">{messages.actions.viewDetail} →</a>
          </article>
        ))}
      </div>
    </main>
  );
}
