"use client";

import "leaflet/dist/leaflet.css";
import { Crosshair } from "lucide-react";
import { useEffect, useId, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { cn } from "@/src/shared/utils/cn";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  color: string;
  code: string;
  statusLabel: string;
  position: string | null;
};

type TrackingMapProps = {
  markers: MapMarker[];
  selectedId: string | null;
  route: [number, number][];
  className?: string;
};

// Centro aproximado do corredor Beira–Lusaka.
const DEFAULT_CENTER: [number, number] = [-17.5, 31.5];

function MapController({
  markers,
  selectedId,
  fitSignal,
}: {
  markers: MapMarker[];
  selectedId: string | null;
  fitSignal: number;
}) {
  const map = useMap();
  const markerKey = markers.map((marker) => marker.id).join(",");

  useEffect(() => {
    if (markers.length === 0) return;
    map.fitBounds(
      markers.map((marker) => [marker.lat, marker.lng]),
      { padding: [50, 50], maxZoom: 8 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, fitSignal, markerKey]);

  useEffect(() => {
    const selected = markers.find((marker) => marker.id === selectedId);
    if (selected) map.setView([selected.lat, selected.lng], 7);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selectedId]);

  return null;
}

export default function TrackingMap({
  markers,
  selectedId,
  route,
  className,
}: TrackingMapProps) {
  const mapId = useId();
  const [mounted, setMounted] = useState(false);
  const [fitSignal, setFitSignal] = useState(0);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));

    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={cn(
        "relative h-[32rem] w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800",
        className,
      )}
    >
      {mounted ? (
        <MapContainer
          key={mapId}
          center={DEFAULT_CENTER}
          zoom={5}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          {/* Satélite (Esri World Imagery) + rótulos de referência por cima */}
          <TileLayer
            attribution="Imagery &copy; Esri, Maxar, Earthstar Geographics"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" />

          {route.length >= 2 ? (
            <Polyline
              positions={route}
              pathOptions={{
                color: "#fbbf24",
                weight: 3,
                opacity: 0.9,
                dashArray: "6 6",
              }}
            />
          ) : null}

          {markers.map((marker) => (
            <CircleMarker
              key={marker.id}
              center={[marker.lat, marker.lng]}
              radius={marker.id === selectedId ? 11 : 8}
              pathOptions={{
                color: "#ffffff",
                fillColor: marker.color,
                fillOpacity: 0.95,
                weight: marker.id === selectedId ? 3 : 2,
              }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold text-slate-900">{marker.code}</p>
                  <p className="text-slate-600">{marker.statusLabel}</p>
                  {marker.position ? (
                    <p className="text-slate-500">{marker.position}</p>
                  ) : null}
                </div>
              </Popup>
            </CircleMarker>
          ))}

          <MapController
            markers={markers}
            selectedId={selectedId}
            fitSignal={fitSignal}
          />
        </MapContainer>
      ) : (
        <div className="grid h-full w-full place-items-center bg-slate-50 dark:bg-slate-900">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            A preparar mapa...
          </span>
        </div>
      )}

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
