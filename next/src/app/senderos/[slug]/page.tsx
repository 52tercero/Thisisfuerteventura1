import { SENDEROS } from '../../../data/senderos';

export const dynamic = 'force-dynamic';

interface PageProps { params: { slug: string } }

export default function SenderoDetalle({ params }: PageProps) {
  const sendero = SENDEROS.find(s => s.slug === params.slug);
  if (!sendero) {
    return (
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-4">Sendero no encontrado</h1>
        <a href="/senderos" className="text-blue-600">← Volver a senderos</a>
      </main>
    );
  }
  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-4">{sendero.name}</h1>
      <p className="text-gray-700 mb-4 max-w-prose">{sendero.summary}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="rounded border p-4 bg-white">
          <h2 className="font-semibold mb-2">Ficha técnica</h2>
          <ul className="text-sm space-y-1">
            <li><strong>Dificultad:</strong> {sendero.difficulty}</li>
            <li><strong>Distancia:</strong> {sendero.distanceKm} km</li>
            <li><strong>Desnivel positivo:</strong> {sendero.ascentM} m</li>
            <li><strong>Duración estimada:</strong> {Math.round(sendero.durationMin/60*10)/10} h</li>
            <li><strong>Coordenadas inicio:</strong> {sendero.start.lat.toFixed(4)}, {sendero.start.lon.toFixed(4)}</li>
            {sendero.gpx && <li><a className="text-blue-600" href={`/${sendero.gpx}`} download>Descargar GPX</a></li>}
          </ul>
        </div>
        <div className="rounded border p-4 bg-white">
          <h2 className="font-semibold mb-2">Mapa rápido</h2>
          <a href={`https://www.google.com/maps/search/${encodeURIComponent(sendero.mapsQuery)}`} target="_blank" rel="noopener" className="text-sm text-blue-600">Abrir en Google Maps →</a>
          <p className="mt-2 text-xs text-gray-500">Consulta estado de pistas y meteorología antes de iniciar la ruta.</p>
        </div>
      </div>
      <a href="/senderos" className="text-sm text-blue-600">← Volver a senderos</a>
    </main>
  );
}
