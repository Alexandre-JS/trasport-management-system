"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Clock, Gauge, History, MapPin, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { LiveMap, type MapMarker } from "@/components/tracking/live-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { useTrips } from "@/hooks/use-trips";
import { useLastLocations, useTripRoute } from "@/hooks/use-tracking";
import { extractErrorMessage } from "@/services/http";
import type { Trip, TripStatus } from "@/types/trip";
import { cn } from "@/utils/cn";
import { formatDateTime } from "@/utils/format";
import { tripStatusMeta } from "@/utils/trip-status";

const activeStatuses: TripStatus[] = [
  "LOADED",
  "DISPATCHED_ORIGIN",
  "AT_BORDER",
  "BORDER_CLEARED",
  "ARRIVED",
];

function formatCoord(value: string): string {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed.toFixed(5);
}

function formatSpeed(value: string | null): string {
  if (value === null) {
    return "—";
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? "—" : `${Math.round(parsed)} km/h`;
}

export function TrackingView() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [historyTrip, setHistoryTrip] = useState<Trip | null>(null);

  const { data, isLoading, isError, error, isFetching, refetch } = useTrips({
    page: 1,
    limit: 50,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const activeTrips = useMemo(
    () =>
      (data?.data ?? []).filter((trip) =>
        activeStatuses.includes(trip.currentStatus),
      ),
    [data],
  );

  const tripIds = useMemo(
    () => activeTrips.map((trip) => trip.id),
    [activeTrips],
  );
  const { byTripId, isLoading: locationsLoading } = useLastLocations(tripIds);

  const markers: MapMarker[] = useMemo(() => {
    return activeTrips
      .map((trip) => {
        const last = byTripId[trip.id];

        if (!last) {
          return null;
        }

        return {
          id: trip.id,
          label: trip.cargo.code,
          lat: Number(last.latitude),
          lng: Number(last.longitude),
        };
      })
      .filter((marker): marker is MapMarker => marker !== null);
  }, [activeTrips, byTripId]);

  function handleRefresh() {
    void refetch();
    void queryClient.invalidateQueries({ queryKey: ["tracking-last"] });
  }

  return (
    <>
      <PageHeader
        title="Rastreamento"
        description="Acompanhamento GPS em tempo real das cargas em movimento."
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className="size-4" />}
            onClick={handleRefresh}
            loading={isFetching}
          >
            Atualizar
          </Button>
        }
      />

      {isError ? (
        <div className="flex flex-col items-start gap-3 rounded-md border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/40">
          <p className="text-sm text-rose-700 dark:text-rose-300">
            {extractErrorMessage(error)}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LiveMap markers={markers} selectedId={selectedId} />
        </div>

        <div className="flex flex-col overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Viagens ativas
            </p>
            <Badge tone="slate">{activeTrips.length}</Badge>
          </div>

          <div className="max-h-[28rem] flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="grid place-items-center py-12">
                <Spinner />
              </div>
            ) : activeTrips.length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                Sem viagens ativas de momento.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeTrips.map((trip) => {
                  const last = byTripId[trip.id];
                  const meta = tripStatusMeta[trip.currentStatus];
                  const isSelected = selectedId === trip.id;

                  return (
                    <li
                      key={trip.id}
                      className={cn(
                        "flex flex-col gap-2 px-4 py-3 transition-colors",
                        isSelected && "bg-slate-50 dark:bg-slate-800/40",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedId(trip.id)}
                        className="flex flex-col gap-2 text-left"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-medium text-slate-900 dark:text-white">
                            {trip.cargo.code}
                          </span>
                          <Badge tone={meta.tone}>{meta.label}</Badge>
                        </div>

                        <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="size-3.5" aria-hidden />
                            {last
                              ? `${formatCoord(last.latitude)}, ${formatCoord(last.longitude)}`
                              : "Sem posição registada"}
                          </span>
                          <span className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5">
                              <Gauge className="size-3.5" aria-hidden />
                              {last ? formatSpeed(last.speed) : "—"}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="size-3.5" aria-hidden />
                              {last ? formatDateTime(last.recordedAt) : "—"}
                            </span>
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setHistoryTrip(trip)}
                        className="inline-flex w-fit items-center gap-1.5 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <History className="size-3.5" aria-hidden />
                        Ver Histórico
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {locationsLoading && activeTrips.length > 0 ? (
            <div className="border-t border-slate-200 px-4 py-2 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
              A obter posições…
            </div>
          ) : null}
        </div>
      </div>

      <HistoryModal trip={historyTrip} onClose={() => setHistoryTrip(null)} />
    </>
  );
}

function HistoryModal({
  trip,
  onClose,
}: {
  trip: Trip | null;
  onClose: () => void;
}) {
  const { data, isLoading } = useTripRoute(trip?.id ?? null);

  return (
    <Modal
      open={trip !== null}
      title={trip ? `Histórico · ${trip.cargo.code}` : "Histórico"}
      description={
        data ? `${data.count} posição(ões) registada(s)` : undefined
      }
      onClose={onClose}
    >
      {isLoading ? (
        <div className="grid place-items-center py-8">
          <Spinner />
        </div>
      ) : !data || data.count === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Sem histórico de posições para esta viagem.
        </p>
      ) : (
        <div className="max-h-80 overflow-y-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-400 dark:text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-medium">Hora</th>
                <th className="py-2 pr-4 font-medium">Posição</th>
                <th className="py-2 font-medium">Velocidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.points.map((point, index) => (
                <tr key={`${point.recordedAt}-${index}`}>
                  <td className="py-2 pr-4 text-slate-600 dark:text-slate-300">
                    {formatDateTime(point.recordedAt)}
                  </td>
                  <td className="py-2 pr-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                    {formatCoord(point.latitude)}, {formatCoord(point.longitude)}
                  </td>
                  <td className="py-2 text-slate-600 dark:text-slate-300">
                    {formatSpeed(point.speed)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
