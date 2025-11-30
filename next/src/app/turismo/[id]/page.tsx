import { TURISMO } from '../../../data/turismo';
import { getMessages } from '../../../lib/i18n';

export const dynamic = 'force-dynamic';

interface PageProps { params: { id: string } }

export default function TurismoDetalle({ params }: PageProps) {
  const messages = getMessages('es');
  const spot = TURISMO.find(s => s.id === params.id);
  if (!spot) {
    return (
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-4">{messages.actions.notFoundSpot}</h1>
        <a href="/turismo" className="text-blue-600">← {messages.tourism.backToList}</a>
      </main>
    );
  }
  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-4">{spot.title}</h1>
      <p className="text-gray-700 max-w-prose mb-6">{spot.description}</p>
      {spot.heroImage && (
        <div className="mb-6">
          <img src={`/${spot.heroImage}`} alt={spot.title} className="w-full max-h-[480px] object-cover rounded" />
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="rounded border p-4 bg-white">
          <h2 className="font-semibold mb-2">{messages.tourism.info}</h2>
          <ul className="text-sm space-y-1">
            {spot.info.bestTime && <li><strong>{messages.tourism.bestTime}:</strong> {spot.info.bestTime}</li>}
            {spot.info.parking && <li><strong>{messages.tourism.parking}:</strong> {spot.info.parking}</li>}
            {spot.info.accessibility && <li><strong>{messages.tourism.accessibility}:</strong> {spot.info.accessibility}</li>}
            {spot.info.services && <li><strong>{messages.tourism.services}:</strong> {spot.info.services}</li>}
            {spot.info.duration && <li><strong>{messages.tourism.duration}:</strong> {spot.info.duration}</li>}
            {spot.info.difficulty && <li><strong>{messages.tourism.difficulty}:</strong> {spot.info.difficulty}</li>}
            {spot.info.tips && <li><strong>{messages.tourism.tips}:</strong> {spot.info.tips}</li>}
            <li><strong>{messages.tourism.coords}:</strong> {spot.lat.toFixed(4)}, {spot.lng.toFixed(4)}</li>
          </ul>
        </div>
        <div className="rounded border p-4 bg-white">
          <h2 className="font-semibold mb-2">{messages.tourism.history}</h2>
          <p className="text-sm leading-relaxed">{spot.history}</p>
        </div>
      </div>
      <div className="prose max-w-none mb-10">
        <h2>{messages.tourism.extended}</h2>
        <p>{spot.longDescription}</p>
      </div>
      {spot.gallery.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-3">{messages.tourism.gallery}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {spot.gallery.map(img => <img key={img} src={`/${img}`} alt={spot.title} className="rounded object-cover h-40 w-full" />)}
          </div>
        </div>
      )}
      <p className="text-sm mb-6"><a href={`https://www.google.com/maps/search/${encodeURIComponent(spot.placeQuery)}`} target="_blank" rel="noopener" className="text-blue-600">{messages.tourism.maps} →</a></p>
      <a href="/turismo" className="text-sm text-blue-600">← {messages.tourism.backToList}</a>
    </main>
  );
}
