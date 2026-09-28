"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

export interface MapStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  regionLabel: string;
  description: string;
  count: number;
  expeditions: string[];
}

// Leaflet touches `window`, so it only loads in the browser.
const LeafletMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-[480px] w-full rounded-none" />,
});

export function StationMap(props: { stations: MapStation[]; attribution: string }) {
  return <LeafletMap {...props} />;
}
