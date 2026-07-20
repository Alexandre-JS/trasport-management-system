"use client";

import { MapPin, Navigation } from "lucide-react";
import { LiveMap } from "@/components/tracking/live-map";
import { formatRelativeTime } from "@/utils/format";
import type { LastLocation } from "@/types/public-tracking";

// Mostra a última posição GPS reportada pelo motorista: mini-mapa + "atualizado
// há X" + link para abrir no OpenStreetMap. Reutilizado no rastreio público e
// no portal do cliente.
export function GpsLocationCard({
  location,
  label,
}: {
  location: LastLocation;
  label?: string;
}) {
  const osmUrl = `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=12/${location.latitude}/${location.longitude}`;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-2.5 dark:border-slate-800">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-800 dark:text-slate-200">
          <Navigation className="size-4 text-brand-500" aria-hidden />
          Localização GPS
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          atualizado {formatRelativeTime(location.recordedAt)}
        </span>
      </div>
      <LiveMap
        markers={[
          {
            id: "gps",
            label: label ?? "Posição atual",
            lat: location.latitude,
            lng: location.longitude,
          },
        ]}
        selectedId="gps"
      />
      <div className="px-4 py-2.5 text-right">
        <a
          href={osmUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          <MapPin className="size-3.5" aria-hidden />
          Ver no mapa
        </a>
      </div>
    </div>
  );
}
