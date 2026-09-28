"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { MapStation } from "./station-map";

const icon = (label: string) =>
  L.divIcon({
    className: "",
    html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-8px)">
      <span style="position:relative;display:flex;width:18px;height:18px">
        <span style="position:absolute;inset:0;border-radius:9999px;background:#2DD4A7;opacity:.5;animation:ping 1.8s cubic-bezier(0,0,.2,1) infinite"></span>
        <span style="position:relative;width:18px;height:18px;border-radius:9999px;background:#3BA7E0;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35)"></span>
      </span>
      <span style="margin-top:4px;padding:1px 8px;border-radius:9999px;background:#081426;color:white;font:600 11px Inter,sans-serif;white-space:nowrap">${label}</span>
    </div>`,
    iconSize: [80, 44],
    iconAnchor: [40, 18],
  });

export default function LeafletMap({ stations, attribution }: { stations: MapStation[]; attribution: string }) {
  return (
    <MapContainer
      bounds={L.latLngBounds(stations.map((s) => [s.lat, s.lng] as [number, number])).pad(0.12)}
      minZoom={1}
      scrollWheelZoom={false}
      worldCopyJump className="h-[480px] w-full" style={{ background: "#aad3df" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution={`&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · ${attribution}`} />
      {stations.map((s) => (
        <Marker key={s.id} position={[s.lat, s.lng]} icon={icon(s.name)} title={s.name} alt={`${s.name} station`}>
          <Popup>
            <div className="space-y-1">
              <p className="font-semibold">{s.name}</p>
              <p className="text-xs">{s.regionLabel} · approx. location</p>
              <p className="text-xs">{s.count} linked items</p>
              {s.expeditions.map((code) => (
                <Link key={code} href={`/expeditions/${code}`} className="block text-xs">
                  {code} →
                </Link>
              ))}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
