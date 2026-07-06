"use client";

import "leaflet/dist/leaflet.css";
import { Crosshair } from "lucide-react";
import { useEffect, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { MapMarker } from "@/components/tracking/live-map";

type LeafletMapProps = {
  markers: MapMarker[];
  selectedId: string | null;
};

// Centro aproximado de Moçambique.
const DEFAULT_CENTER: [number, number] = [-18.6657, 35.5296];

function MapController({
  markers,
  selectedId,
  fitSignal,
}: LeafletMapProps & { fitSignal: number }) {
  const map = useMap();
  const markerKey = markers.map((marker) => marker.id).join(",");

  useEffect(() => {
    if (markers.length === 0) {
      return;
    }

    map.fitBounds(
      markers.map((marker) => [marker.lat, marker.lng]),
      { padding: [40, 40], maxZoom: 13 },
    );
    // Reajusta quando o conjunto de marcadores muda ou ao clicar em Centralizar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, fitSignal, markerKey]);

  useEffect(() => {
    const selected = markers.find((marker) => marker.id === selectedId);

    if (selected) {
      map.setView([selected.lat, selected.lng], 12);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selectedId]);

  return null;
}

export default function LeafletMap({ markers, selectedId }: LeafletMapProps) {
  const [fitSignal, setFitSignal] = useState(0);

  return (
    <div className="relative h-[28rem] w-full overflow-hidden rounded-md border border-slate-200 dark:border-slate-800">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={5}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((marker) => (
          <CircleMarker
            key={marker.id}
            center={[marker.lat, marker.lng]}
            radius={8}
            pathOptions={{
              color: "#0f172a",
              fillColor: "#2563eb",
              fillOpacity: 0.9,
              weight: 2,
            }}
          >
            <Popup>{marker.label}</Popup>
          </CircleMarker>
        ))}
        <MapController
          markers={markers}
          selectedId={selectedId}
          fitSignal={fitSignal}
        />
      </MapContainer>

      <button
        type="button"
        onClick={() => setFitSignal((value) => value + 1)}
        className="absolute right-3 top-3 z-[1000] inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      >
        <Crosshair className="size-4" aria-hidden />
        Centralizar
      </button>
    </div>
  );
}
