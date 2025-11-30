"use client";
export default function Map({ lat, lng, query }: { lat?: number; lng?: number; query?: string }){
  const url = query
    ? `https://www.google.com/maps/search/${encodeURIComponent(query)}`
    : typeof lat==='number' && typeof lng==='number'
      ? `https://www.google.com/maps/@${lat},${lng},14z`
      : undefined;
  return (
    <div className="surface p-4 rounded">
      <strong>Map</strong>
      <p className="text-sm">Simple placeholder linked to Google Maps.</p>
      {url ? (
        <a href={url} target="_blank" rel="noopener" className="inline-block mt-2 text-blue-600">Open in Google Maps →</a>
      ) : (
        <p className="text-xs text-gray-500 mt-2">Coordinates not available.</p>
      )}
    </div>
  );
}