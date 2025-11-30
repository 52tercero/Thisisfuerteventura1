import { TURISMO } from '../../../../data/turismo';
import { getMessages } from '../../../../lib/i18n';
import ImageWithFallback from '../../../../components/ImageWithFallback';
import InteractiveMap from '../../../../components/InteractiveMap';
import LeafletMap from '../../../../components/LeafletMap';

export const dynamic = 'force-dynamic';

interface PageProps { params: Promise<{ locale: string; id: string }> }

export default async function TurismoDetalle({ params }: PageProps) {
  const { locale, id } = await params;
  const spot = TURISMO.find(s => s.id === id);
  const messages = getMessages(locale);
  const tSections = messages.sections;
  const tTourism = messages.tourism;
  if (!spot) {
    return (
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-4">{messages.actions.notFoundSpot}</h1>
        <a href={`/${locale}/turismo`} className="text-blue-600">← {messages.tourism.backToList}</a>
      </main>
    );
  }
  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-4">{spot.title}</h1>
      <p className="text-gray-700 max-w-prose mb-6">{spot.description}</p>
      {spot.heroImage && <div className="mb-6"><ImageWithFallback src={`/${spot.heroImage}`} alt={spot.title} className="w-full max-h-[480px] object-cover rounded" /></div>}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="rounded border p-4 bg-white">
          <h2 className="font-semibold mb-2">{tTourism.info}</h2>
          <ul className="text-sm space-y-1">
            {spot.info.bestTime && <li><strong>{tTourism.bestTime}:</strong> {spot.info.bestTime}</li>}
            {spot.info.parking && <li><strong>{tTourism.parking}:</strong> {spot.info.parking}</li>}
            {spot.info.accessibility && <li><strong>{tTourism.accessibility}:</strong> {spot.info.accessibility}</li>}
            {spot.info.services && <li><strong>{tTourism.services}:</strong> {spot.info.services}</li>}
            {spot.info.duration && <li><strong>{tTourism.duration}:</strong> {spot.info.duration}</li>}
            {spot.info.difficulty && <li><strong>{tTourism.difficulty}:</strong> {spot.info.difficulty}</li>}
            {spot.info.tips && <li><strong>{tTourism.tips}:</strong> {spot.info.tips}</li>}
            <li><strong>{tTourism.coords}:</strong> {spot.lat.toFixed(4)}, {spot.lng.toFixed(4)}</li>
          </ul>
        </div>
        <div className="rounded border p-4 bg-white">
          <h2 className="font-semibold mb-2">{tTourism.history}</h2>
          <p className="text-sm leading-relaxed">{spot.history}</p>
        </div>
      </div>
      <div className="mb-8">
        <InteractiveMap lat={spot.lat} lng={spot.lng} label={spot.title} />
        <div className="mt-4">
          <LeafletMap lat={spot.lat} lng={spot.lng} markers={[{ lat: spot.lat, lng: spot.lng, label: spot.title, type: 'tourism' }]} />
        </div>
      </div>
      <div className="prose max-w-none mb-10">
        <h2>{tTourism.extended}</h2>
        <p>{spot.longDescription}</p>
      </div>
      {spot.gallery.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-3">{tTourism.gallery}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {spot.gallery.map(img => <img key={img} src={`/${img}`} alt={spot.title} className="rounded object-cover h-40 w-full" />)}
          </div>
        </div>
      )}
      <p className="text-sm mb-6"><a href={`https://www.google.com/maps/search/${encodeURIComponent(spot.placeQuery)}`} target="_blank" rel="noopener" className="text-blue-600">{tTourism.maps} →</a></p>
      <a href={`/${locale}/turismo`} className="text-sm text-blue-600">← {tSections.turismo}</a>
    </main>
  );
}
