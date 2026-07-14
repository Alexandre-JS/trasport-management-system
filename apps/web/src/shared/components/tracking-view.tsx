"use client";

import { Loader2, MapPin } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { ErrorState } from "@/src/shared/components/error-state";
import { PageHeader } from "@/src/shared/components/page-header";
import { PageLoader } from "@/src/shared/components/page-loader";
import { StatusBadge } from "@/src/shared/components/status-badge";
import type { MapMarker } from "@/src/shared/components/tracking-map";
import {
  estimateTripPosition,
  tripRoute,
} from "@/src/shared/data/trip-geo";
import { useTrips } from "@/hooks/use-trips";
import type { Trip, TripStatus } from "@/types/trip";
import { cn } from "@/src/shared/utils/cn";
import {
  isTerminalTripStatus,
  tripStatusBadgeTone,
  tripStatusMeta,
} from "@/utils/trip-status";

const TrackingMap = dynamic(
  () => import("@/src/shared/components/tracking-map"),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full min-h-[32rem] w-full place-items-center rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
        <Loader2 className="size-6 animate-spin text-slate-400" aria-hidden />
      </div>
    ),
  },
);

const statusColor: Record<TripStatus, string> = {
  WAITING_APPOINTMENT: "#64748b",
  APPOINTMENT_DONE: "#64748b",
  LOADED: "#2563eb",
  DISPATCHED_ORIGIN: "#2563eb",
  AT_BORDER: "#d97706",
  BORDER_CLEARED: "#d97706",
  ARRIVED: "#059669",
  DISCHARGED: "#059669",
  CONTAINER_RETURN_PENDING: "#d97706",
  CONTAINER_RETURNED: "#059669",
  CANCELLED: "#dc2626",
};

export function TrackingView() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data, isLoading, isError, refetch } = useTrips({
    page: 1,
    limit: 100,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const activeTrips = useMemo(
    () =>
      (data?.data ?? []).filter(
        (trip) => !isTerminalTripStatus(trip.currentStatus),
      ),
    [data],
  );

  const { markers, byId } = useMemo(() => {
    const list: MapMarker[] = [];
    const index = new Map<string, Trip>();
    for (const trip of activeTrips) {
      const geo = estimateTripPosition({
        currentStatus: trip.currentStatus,
        borders: trip.borders,
        origin: trip.cargo.origin,
        destination: trip.cargo.destination,
      });
      if (!geo) continue;
      index.set(trip.id, trip);
      list.push({
        id: trip.id,
        lat: geo.lat,
        lng: geo.lng,
        color: statusColor[trip.currentStatus],
        code: trip.cargo.code,
        statusLabel: tripStatusMeta[trip.currentStatus].label,
        position: trip.currentPosition,
      });
    }
    return { markers: list, byId: index };
  }, [activeTrips]);

  const selectedTrip = selectedId ? byId.get(selectedId) : undefined;
  const route = selectedTrip
    ? tripRoute({
        currentStatus: selectedTrip.currentStatus,
        borders: selectedTrip.borders,
        origin: selectedTrip.cargo.origin,
        destination: selectedTrip.cargo.destination,
      })
    : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <PageHeader
        title="Rastreamento"
        description="Localização das viagens ativas ao longo do corredor, em mapa de satélite."
      />

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState
          title="Não foi possível carregar o rastreamento"
          onAction={() => void refetch()}
        />
      ) : (
        <div className="grid min-h-[32rem] flex-1 gap-4 lg:grid-cols-3">
          <div className="flex min-h-0 flex-col gap-2 overflow-y-auto lg:col-span-1">
            {markers.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                Não há viagens ativas para rastrear.
              </div>
            ) : (
              markers.map((marker) => {
                const trip = byId.get(marker.id);
                if (!trip) return null;
                const active = marker.id === selectedId;
                return (
                  <button
                    key={marker.id}
                    type="button"
                    onClick={() =>
                      setSelectedId((current) =>
                        current === marker.id ? null : marker.id,
                      )
                    }
                    className={cn(
                      "flex flex-col gap-2 rounded-lg border p-4 text-left transition-colors",
                      active
                        ? "border-brand-300 bg-brand-50/50 dark:border-brand-700 dark:bg-brand-950/30"
                        : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/50",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {trip.cargo.code}
                      </span>
                      <StatusBadge
                        tone={tripStatusBadgeTone[trip.currentStatus]}
                      >
                        {tripStatusMeta[trip.currentStatus].label}
                      </StatusBadge>
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      {trip.cargo.origin} → {trip.cargo.destination}
                    </span>
                    {trip.currentPosition ? (
                      <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <MapPin className="size-3.5 shrink-0" aria-hidden />
                        {trip.currentPosition}
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>

          <div className="min-h-[32rem] lg:col-span-2">
            <TrackingMap
              markers={markers}
              selectedId={selectedId}
              route={route}
              className="h-full min-h-[32rem]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
