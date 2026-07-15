"use client";

import { Loader2, Map, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { TripBorderRef, TripStatus } from "@/types/trip";
import { estimateTripPosition, tripRoute } from "@/src/shared/data/trip-geo";
import type { MapMarker } from "@/src/shared/components/tracking-map";
import { tripStatusMeta } from "@/utils/trip-status";

const TrackingMap = dynamic(
  () => import("@/src/shared/components/tracking-map"),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-80 place-items-center rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
        <Loader2 className="size-6 animate-spin text-slate-400" aria-hidden />
      </div>
    ),
  },
);

type ClientShipmentMapProps = {
  code: string;
  origin: string;
  destination: string;
  currentStatus: TripStatus;
  currentPosition: string | null;
  borders: TripBorderRef[];
};

export function ClientShipmentMap(props: ClientShipmentMapProps) {
  const [open, setOpen] = useState(false);
  const geoInput = useMemo(
    () => ({
      currentStatus: props.currentStatus,
      origin: props.origin,
      destination: props.destination,
      borders: props.borders.map((crossing) => ({
        ...crossing,
        border: { ...crossing.border, lat: null, lng: null },
      })),
    }),
    [props],
  );
  const position = estimateTripPosition(geoInput);
  const route = tripRoute(geoInput);
  const markers: MapMarker[] = position
    ? [
        {
          id: props.code,
          lat: position.lat,
          lng: position.lng,
          color: "#1e50ab",
          code: props.code,
          statusLabel: tripStatusMeta[props.currentStatus].label,
          position: props.currentPosition,
        },
      ]
    : [];

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Localização no mapa
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Mostra apenas o transporte desta carga. A posição é estimada a partir da etapa operacional.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-brand-600 px-3 text-sm font-medium text-white hover:bg-brand-700"
        >
          {open ? <X className="size-4" aria-hidden /> : <Map className="size-4" aria-hidden />}
          {open ? "Fechar mapa" : "Ver no mapa"}
        </button>
      </div>
      {open ? (
        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
          {markers.length > 0 ? (
            <TrackingMap
              markers={markers}
              selectedId={props.code}
              route={route}
              className="h-80 min-h-80"
            />
          ) : (
            <p className="rounded-md bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              Não foi possível localizar esta rota no mapa.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
