"use client";

import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

export type MapMarker = {
  id: string;
  label: string;
  lat: number;
  lng: number;
};

type LiveMapProps = {
  markers: MapMarker[];
  selectedId: string | null;
};

// O Leaflet acede a `window`, por isso é carregado apenas no cliente.
const LeafletMap = dynamic(
  () => import("@/components/tracking/leaflet-map"),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-[28rem] w-full place-items-center rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <Loader2 className="size-6 animate-spin text-slate-400" aria-hidden />
      </div>
    ),
  },
);

export function LiveMap({ markers, selectedId }: LiveMapProps) {
  return <LeafletMap markers={markers} selectedId={selectedId} />;
}
