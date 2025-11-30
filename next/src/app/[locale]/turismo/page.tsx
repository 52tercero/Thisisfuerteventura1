import { TURISMO } from '../../../data/turismo';
import { getMessages } from '../../../lib/i18n';
import ListGrid, { GridItem } from '../../../components/ListGrid';
import LeafletMap from '../../../components/LeafletMap';
import ScrollObserver from '../../../components/ScrollObserver';

export const dynamic = 'force-dynamic';

interface PageProps { params: Promise<{ locale: string }> }

export default async function TurismoPage({ params }: PageProps) {
  const { locale } = await params;
  const messages = getMessages(locale);
  const tSections = messages.sections;
  const tTourism = messages.tourism;
  const items: GridItem[] = TURISMO.map(s => ({
    id: s.id,
    title: s.title,
    summary: s.summary,
    image: '/' + s.heroImage,
    meta: s.features.slice(0,3).join(', '),
    features: s.features.slice(0,4),
    href: `/${locale}/turismo/${s.id}`,
    actionLabel: tTourism.info
  }));
  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">{tSections.turismo}</h1>
      <ScrollObserver>
        <ListGrid items={items} />
        <div className="mt-4">
          <LeafletMap lat={TURISMO[0].lat} lng={TURISMO[0].lng} cluster markers={TURISMO.filter(s=>typeof s.lat==='number' && typeof s.lng==='number').map(s=>({ lat: s.lat!, lng: s.lng!, label: s.title, type: 'tourism' }))} />
        </div>
      </ScrollObserver>
    </main>
  );
}
