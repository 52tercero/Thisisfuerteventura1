import { SENDEROS, SenderoDifficulty } from '../../../data/senderos';
import { getMessages } from '../../../lib/i18n';
import ScrollObserver from '../../../components/ScrollObserver';

export const dynamic = 'force-dynamic';

interface PageProps { params: Promise<{ locale: string }> }

export default async function SenderosPage({ params }: PageProps) {
  const { locale } = await params;
  const messages = getMessages(locale);
  const tSections = messages.sections;
  const tTrails = messages.trails;
  const diffMap: Record<SenderoDifficulty,string> = {
    facil: tTrails.easy,
    moderada: tTrails.moderate,
    dificil: tTrails.hard
  };
  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">{tSections.senderos}</h1>
      <ScrollObserver>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {SENDEROS.map(s => (
          <article key={s.slug} className="rounded border p-4 bg-white hover:shadow transition">
            <h2 className="text-xl font-semibold mb-2">{s.name}</h2>
            <p className="text-sm text-gray-600 mb-2">{s.summary}</p>
            <ul className="text-xs text-gray-500 mb-3 space-y-1">
              <li><strong>{tTrails.difficulty}:</strong> {diffMap[s.difficulty]}</li>
              <li><strong>{tTrails.distance}:</strong> {s.distanceKm} km · +{s.ascentM} m</li>
              <li><strong>{tTrails.duration}:</strong> {(s.durationMin/60).toFixed(1)} h</li>
            </ul>
            <a href={`/${locale}/senderos/${s.slug}`} className="text-sm text-blue-600 font-medium">{messages.actions.viewDetail} →</a>
          </article>
        ))}
      </div>
      </ScrollObserver>
    </main>
  );
}
