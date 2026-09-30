"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { MapStation } from "./station-map";

const icon = (label: string, active: boolean) =>
  L.divIcon({
    className: "",
    html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-8px)">
      <span style="position:relative;display:flex;width:18px;height:18px">
        <span style="position:absolute;inset:0;border-radius:9999px;background:#2DD4A7;opacity:.5;animation:ping 1.8s cubic-bezier(0,0,.2,1) infinite"></span>
        <span style="position:relative;width:18px;height:18px;border-radius:9999px;background:${active ? "#2DD4A7" : "#3BA7E0"};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35)"></span>
      </span>
      <span style="margin-top:4px;padding:1px 8px;border-radius:9999px;background:#081426;color:white;font:600 11px Inter,sans-serif;white-space:nowrap;${active ? "outline:2px solid #2DD4A7" : ""}">${label}</span>
    </div>`,
    iconSize: [80, 44],
    iconAnchor: [40, 18],
  });

/** Flies to the selected station, or back to the overview of all stations. */
function Camera({ stations, selected }: { stations: MapStation[]; selected: string | null }) {
  const map = useMap();
  useEffect(() => {
    const s = stations.find((x) => x.id === selected);
    if (s) map.flyTo([s.lat, s.lng], 5, { duration: 1.1 });
    else if (stations.length) map.flyToBounds(L.latLngBounds(stations.map((x) => [x.lat, x.lng] as [number, number])).pad(0.12), { duration: 0.9 });
  }, [map, stations, selected]);
  // the pane can change size (sidebar toggle, window resize)
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map]);
  return null;
}

export default function LeafletMap({
  stations,
  attribution,
  selected,
  onSelect,
}: {
  stations: MapStation[];
  attribution: string;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <MapContainer
      bounds={L.latLngBounds(stations.map((s) => [s.lat, s.lng] as [number, number])).pad(0.12)}
      minZoom={1}
      scrollWheelZoom={false}
      worldCopyJump
      className="z-0 h-full w-full"
      style={{ background: "#aad3df" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution={`&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · ${attribution}`} />
      <Camera stations={stations} selected={selected} />
      {stations.map((s) => (
        <Marker key={s.id} position={[s.lat, s.lng]} icon={icon(s.name, s.id === selected)} title={s.name} alt={`${s.name} station`} eventHandlers={{ click: () => onSelect(s.id) }}>
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
