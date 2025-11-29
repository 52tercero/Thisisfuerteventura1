import { SENDEROS, SenderoDifficulty } from '../../../../data/senderos';
import LeafletMap from '../../../../components/LeafletMap';
import { getMessages } from '../../../../lib/i18n';

export const dynamic = 'force-dynamic';

interface PageProps { params: Promise<{ locale: string; slug: string }> }

export default async function SenderoDetalle({ params }: PageProps) {
  const { locale, slug } = await params;
  const messages = getMessages(locale);
  const tSections = messages.sections;
  const tTrails = messages.trails;
  const diffMap: Record<SenderoDifficulty,string> = {
    facil: tTrails.easy,
    moderada: tTrails.moderate,
    dificil: tTrails.hard
  };
  const sendero = SENDEROS.find(s => s.slug === slug);
  if (!sendero) {
    return (
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-4">Sendero no encontrado</h1>
        <a href={`/${locale}/senderos`} className="text-blue-600">← {tSections.senderos}</a>
      </main>
    );
  }
  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-4">{sendero.name}</h1>
      <p className="text-gray-700 mb-4 max-w-prose">{sendero.summary}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="rounded border p-4 bg-white">
          <h2 className="font-semibold mb-2">{tSections.senderos}: {tTrails.difficulty}</h2>
          <ul className="text-sm space-y-1">
            <li><strong>{tTrails.difficulty}:</strong> {diffMap[sendero.difficulty]}</li>
            <li><strong>{tTrails.distance}:</strong> {sendero.distanceKm} km</li>
            <li><strong>{tTrails.ascent}:</strong> {sendero.ascentM} m</li>
            <li><strong>{tTrails.duration}:</strong> {Math.round(sendero.durationMin/60*10)/10} h</li>
            <li><strong>{tTrails.startCoords}:</strong> {sendero.start.lat.toFixed(4)}, {sendero.start.lon.toFixed(4)}</li>
            {sendero.gpx && <li><a className="text-blue-600" href={`/${sendero.gpx}`} download>{tTrails.downloadGpx}</a></li>}
          </ul>
        </div>
        <div className="rounded border p-4 bg-white space-y-3">
          <h2 className="font-semibold mb-2">Mapa rápido</h2>
          <LeafletMap lat={sendero.start.lat} lng={sendero.start.lon} markers={[{ lat: sendero.start.lat, lng: sendero.start.lon, label: sendero.name, type: 'trail' }]} />
          <a href={`https://www.google.com/maps/search/${encodeURIComponent(sendero.mapsQuery)}`} target="_blank" rel="noopener" className="text-sm text-blue-600">Abrir en Google Maps →</a>
          <p className="mt-2 text-xs text-gray-500">Consulta estado de pistas y meteorología antes de iniciar la ruta.</p>
        </div>
      </div>
        <div className="mb-8">
          <LeafletMap lat={sendero.start.lat} lng={sendero.start.lon} markers={[{ lat: sendero.start.lat, lng: sendero.start.lon, label: sendero.name, type: 'trail' }]} />
        </div>
      <a href={`/${locale}/senderos`} className="text-sm text-blue-600">← {tSections.senderos}</a>
    </main>
  );
}
