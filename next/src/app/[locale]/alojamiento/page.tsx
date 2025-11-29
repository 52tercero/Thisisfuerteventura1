import { ALOJAMIENTO, Alojamiento } from '../../../data/alojamiento';
import { getMessages } from '../../../lib/i18n';
import ImageWithFallback from '../../../components/ImageWithFallback';
import ScrollObserver from '../../../components/ScrollObserver';

export const dynamic = 'force-dynamic';

interface PageProps { params: Promise<{ locale: string }> }

export default async function AlojamientoPage({ params }: PageProps) {
  const { locale } = await params;
  const messages = getMessages(locale);
  const tNav = messages.nav;
  // Agrupar por zona
  const byZone: Record<string, Alojamiento[]> = {};
  for (const item of ALOJAMIENTO) {
    byZone[item.zone] = byZone[item.zone] ? [...byZone[item.zone], item] : [item];
  }

  const translateFeature = (label: string) => {
    const slug = label.toLowerCase()
      .replace(/á/g,'a').replace(/é/g,'e').replace(/í/g,'i').replace(/ó/g,'o').replace(/ú/g,'u')
      .replace(/ñ/g,'n')
      .replace(/[^a-z0-9]+/g,'-')
      .replace(/^-|-$/g,'');
    return messages.features?.[slug] || label;
  };
  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">{tNav.accommodation}</h1>
      {Object.entries(byZone).map(([zone, items]) => (
        <section key={zone} className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">{zone}</h2>
          <ScrollObserver>
          <div className="legacy-grid">
            {items.map(a => (
              <article key={a.id} className="legacy-card">
                {a.heroImage && <ImageWithFallback src={a.heroImage} alt={a.name} className="w-full h-40 object-cover rounded" />}
                <h3>{a.name}</h3>
                <p className="text-light text-sm">{a.summary}</p>
                <p className="text-xs text-gray-500">{a.category}{a.stars ? ` • ${a.stars}★` : ''}{a.adultsOnly ? ' • Solo adultos' : ''}</p>
                {a.features && (
                  <ul className="flex flex-wrap gap-2 mt-2 text-[11px] text-gray-600">
                    {a.features.map(f => (
                      <li key={f.label} className="px-2 py-1 bg-gray-100 rounded">{translateFeature(f.label)}</li>
                    ))}
                  </ul>
                )}
                {a.mapQuery && (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.mapQuery)}`} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm mt-2">Ver en Maps</a>
                )}
              </article>
            ))}
          </div>
          </ScrollObserver>
        </section>
      ))}
    </main>
  );
}
