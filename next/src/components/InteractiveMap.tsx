"use client";
import LeafletMap from "./LeafletMap";

export default function InteractiveMap({ lat, lng, label }: { lat?: number; lng?: number; label?: string }){
  const hasCoords = typeof lat==='number' && typeof lng==='number';
  const url = hasCoords ? `https://www.google.com/maps/@${lat},${lng},14z` : undefined;
  if (!hasCoords) {
    return (
      <div className="surface p-4 rounded">
        <strong>Interactive Map</strong>
        <p className="text-sm">Coordenadas no disponibles</p>
      </div>
    );
  }
  return (
    <div className="surface p-4 rounded space-y-3">
      <div className="text-sm">{label || 'Location'}: {lat?.toFixed(4)}, {lng?.toFixed(4)}</div>
      <LeafletMap lat={lat!} lng={lng!} markers={[{ lat: lat!, lng: lng!, label: label }]} />
      {url && <a href={url} className="inline-block text-blue-600" target="_blank" rel="noopener">Open in Google Maps →</a>}
    </div>
  );
}