import { PLAYAS, Playa } from '../../../data/playas';
import { getMessages } from '../../../lib/i18n';
import ListGrid, { GridItem } from '../../../components/ListGrid';
import LeafletMap from '../../../components/LeafletMap';
import ScrollObserver from '../../../components/ScrollObserver';

export const dynamic = 'force-dynamic';

interface PageProps { params: Promise<{ locale: string }> }

export default async function PlayasPage({ params }: PageProps) {
  const { locale } = await params;
  const messages = getMessages(locale);
  const tNav = messages.nav;
  // Agrupar por zona
  const byZone: Record<string, Playa[]> = {};
  for (const beach of PLAYAS) {
    byZone[beach.zone] = byZone[beach.zone] ? [...byZone[beach.zone], beach] : [beach];
  }

  const zoneOrder = Object.keys(byZone);

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
      <h1 className="text-3xl font-bold mb-8">{tNav.beaches}</h1>
      {zoneOrder.map(zone => {
        const items = byZone[zone].map<GridItem>(b => ({
          id: b.id,
          title: b.title,
          summary: b.summary,
          image: b.heroImage,
          meta: zone,
          features: b.features?.map(f => translateFeature(f.label)),
          href: b.mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.mapQuery)}` : undefined,
          actionLabel: 'Maps',
          external: true
        }));
        return (
          <section key={zone} className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">{zone}</h2>
            <ScrollObserver>
              <ListGrid items={items} />
              <div className="mt-4">
                <LeafletMap lat={byZone[zone][0].lat} lng={byZone[zone][0].lng} cluster markers={byZone[zone].filter(b=>typeof b.lat==='number' && typeof b.lng==='number').map(b=>({ lat: b.lat!, lng: b.lng!, label: b.title, type: 'beach' }))} />
              </div>
            </ScrollObserver>
          </section>
        );
      })}
    </main>
  );
}
