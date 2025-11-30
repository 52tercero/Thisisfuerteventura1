"use client";
import React, { useEffect, useState } from "react";
let MapContainer: any, TileLayer: any, Marker: any, Popup: any;
let L: any;
try {
  // Avoid SSR importing leaflet/react-leaflet where window is undefined
  if (typeof window !== "undefined") {
    const RL = require("react-leaflet");
    MapContainer = RL.MapContainer;
    TileLayer = RL.TileLayer;
    Marker = RL.Marker;
    Popup = RL.Popup;
    L = require("leaflet");
    require("leaflet/dist/leaflet.css");
  }
} catch (_) {}

type MarkerDef = { lat: number; lng: number; label?: string; type?: "trail" | "beach" | "tourism" };
type Props = {
  lat: number;
  lng: number;
  zoom?: number;
  markers?: MarkerDef[];
  cluster?: boolean;
};

function iconFor(type?: "trail" | "beach" | "tourism") {
  const svgMap: Record<string, string> = {
    trail: "/icons/marker-trail.svg",
    beach: "/icons/marker-beach.svg",
    tourism: "/icons/marker-tourism.svg"
  };
  const pngMap: Record<string, string> = {
    trail: "/icons/marker-trail.png",
    beach: "/icons/marker-beach.png",
    tourism: "/icons/marker-tourism.png"
  };
  const url = type && (svgMap[type] || pngMap[type]) ? (svgMap[type] || pngMap[type]) : "/icons/marker-default.svg";
  const isSvg = url.endsWith('.svg');
  return L.icon({
    iconUrl: url,
    iconSize: isSvg ? [30, 40] : [28, 28],
    iconAnchor: isSvg ? [15, 40] : [14, 28],
    popupAnchor: isSvg ? [0, -36] : [0, -28]
  });
}

function simpleCluster(markers: MarkerDef[], radiusMeters = 120) {
  // Very lightweight clustering: group markers within ~radiusMeters using lat/lng
  const groups: { lat: number; lng: number; members: MarkerDef[] }[] = [];
  const toMeters = (lat1:number,lng1:number,lat2:number,lng2:number) => {
    const R = 6371000; // meters
    const dLat = (lat2-lat1)*Math.PI/180;
    const dLng = (lng2-lng1)*Math.PI/180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    const c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R*c;
  };
  markers.forEach(m => {
    let placed = false;
    for (const g of groups) {
      if (toMeters(g.lat, g.lng, m.lat, m.lng) <= radiusMeters) {
        g.members.push(m);
        // simple centroid update
        g.lat = (g.lat*(g.members.length-1)+m.lat)/g.members.length;
        g.lng = (g.lng*(g.members.length-1)+m.lng)/g.members.length;
        placed = true; break;
      }
    }
    if (!placed) groups.push({ lat: m.lat, lng: m.lng, members: [m] });
  });
  return groups;
}

export default function LeafletMap({ lat, lng, zoom = 12, markers, cluster = false }: Props) {
  const containerStyle: React.CSSProperties = { height: 320, width: "100%", borderRadius: 12, overflow: "hidden" };
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    // Ensure Leaflet CSS is loaded
    const id = "leaflet-css";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
  }, []);

  // Guard against SSR: render a simple placeholder on the server
  // Server-side and first client render: render a stable container only
  if (typeof window === "undefined" || !MapContainer || !mounted) {
    return <div style={containerStyle} />;
  }
  // Validate center; fallback to first marker if available
  const hasCenter = typeof lat === 'number' && typeof lng === 'number';
  let centerLat = lat;
  let centerLng = lng;
  if (!hasCenter && Array.isArray(markers) && markers.length > 0) {
    centerLat = markers[0].lat;
    centerLng = markers[0].lng;
  }
  const centerValid = typeof centerLat === 'number' && typeof centerLng === 'number';
  if (!centerValid) {
    // No valid coordinates; render empty container
    return <div style={containerStyle} />;
  }
  return (
    <div style={containerStyle}>
      <MapContainer
        key={`${centerLat},${centerLng},${zoom}`}
        center={[centerLat, centerLng]}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={iconFor("tourism")}>
          <Popup>Center</Popup>
        </Marker>
        {markers && !cluster && markers.map((m, i) => (
          <Marker key={i} position={[m.lat, m.lng]} icon={iconFor(m.type)}>
            {m.label && <Popup>{m.label}</Popup>}
          </Marker>
        ))}
        {markers && cluster && simpleCluster(markers).map((g, i) => (
          <Marker key={`c-${i}`} position={[g.lat, g.lng]} icon={L.divIcon({
            className: "cluster-marker",
            html: `<div style="background:#0ea5e9;color:#fff;border-radius:9999px;padding:6px 10px;font-weight:600;font-size:12px">${g.members.length}</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          })}>
            <Popup>
              {g.members.slice(0,5).map((m,idx)=>(<div key={idx}>{m.label || `${m.lat.toFixed(4)}, ${m.lng.toFixed(4)}`}</div>))}
              {g.members.length>5 && <div>+{g.members.length-5} más…</div>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}