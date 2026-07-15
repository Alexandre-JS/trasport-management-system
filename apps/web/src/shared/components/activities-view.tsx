"use client";

import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ClipboardList,
  RefreshCw,
} from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/src/shared/components/page-header";
import { ActionButton } from "@/src/shared/components/action-button";
import { StatusBadge } from "@/src/shared/components/status-badge";
import { useActivities } from "@/hooks/use-activities";
import { useTrips, useUpdateTripStatus } from "@/hooks/use-trips";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { useToast } from "@/providers/toast-provider";
import { extractErrorMessage } from "@/services/http";
import type { ActivitySheet, Trip } from "@/types/trip";
import { formatDate } from "@/utils/format";
import {
  isTerminalTripStatus,
  nextTripStatus,
  tripStatusBadgeTone,
  tripStatusMeta,
} from "@/utils/trip-status";

// Página de acompanhamento: reutiliza a rota /viagens. Lista as "folhas"
// (cliente + rota + dia) e, ao abrir uma, mostra a grelha do quadro em
// modo só-leitura — só o ESTADO é editável (por quem tiver trips:manage).

export function ActivitiesView() {
  const [sheet, setSheet] = useState<ActivitySheet | null>(null);

  if (sheet) {
    return <SheetTracking sheet={sheet} onBack={() => setSheet(null)} />;
  }
  return <ActivitiesList onOpen={setSheet} />;
}

function ActivitiesList({ onOpen }: { onOpen: (s: ActivitySheet) => void }) {
  const { data, isLoading, isError, refetch, isFetching } = useActivities();
  const sheets = data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Atividades"
        description="Cada folha reúne as cargas de um cliente e rota registadas no mesmo dia. Abra para acompanhar o progresso reportado pelos motoristas."
        secondaryActions={
          <ActionButton
            icon={<RefreshCw className="size-4" />}
            onClick={() => void refetch()}
          >
            Atualizar
          </ActionButton>
        }
      />

      {isLoading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">A carregar…</p>
      ) : isError ? (
        <div className="flex flex-col items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/40">
          <p className="text-sm text-rose-700 dark:text-rose-300">
            Não foi possível carregar as atividades.
          </p>
          <ActionButton onClick={() => void refetch()}>Tentar de novo</ActionButton>
        </div>
      ) : sheets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
          <ClipboardList className="mx-auto size-8 text-slate-400" aria-hidden />
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Ainda não há atividades. Registe viagens no Quadro Operacional.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sheets.map((s) => {
            const key = `${s.clientId}-${s.origin}-${s.destination}-${s.day}`;
            const pct = s.total ? Math.round((s.delivered / s.total) * 100) : 0;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onOpen(s)}
                className="group flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-brand-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {s.clientName}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-slate-400 group-hover:text-brand-600" />
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  {s.origin} → {s.destination}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {formatDate(s.day)}
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {s.delivered}/{s.total} entregues
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
      {isFetching && !isLoading ? (
        <p className="text-xs text-slate-400">A atualizar…</p>
      ) : null}
    </div>
  );
}

const HEADERS = [
  "Nu.",
  "Booking",
  "Horse",
  "Trailer",
  "Driver Name",
  "Border",
  "Ton",
  "Dispatched From Beira",
  "GMS Dispatch Date",
  "Arrive Date",
  "Discharge Date",
  "Current Position",
  "Estado",
];

function SheetTracking({
  sheet,
  onBack,
}: {
  sheet: ActivitySheet;
  onBack: () => void;
}) {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const canEditState = hasPermission("trips:manage");
  const updateStatus = useUpdateTripStatus();

  const { data, isLoading, refetch } = useTrips({
    clientId: sheet.clientId,
    origin: sheet.origin,
    destination: sheet.destination,
    day: sheet.day,
    limit: 100,
    sortBy: "createdAt",
    sortOrder: "asc",
  });
  const trips = useMemo(() => data?.data ?? [], [data]);

  function advance(trip: Trip) {
    const next = nextTripStatus(trip.currentStatus);
    if (!next) return;
    updateStatus.mutate(
      { id: trip.id, payload: { currentStatus: next } },
      {
        onSuccess: () => {
          toast({
            title: `Estado → ${tripStatusMeta[next].label}`,
            type: "success",
          });
          void refetch();
        },
        onError: (error) =>
          toast({
            title: "Não foi possível avançar o estado",
            description: extractErrorMessage(error),
            type: "error",
          }),
      },
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ArrowLeft className="size-4" aria-hidden /> Atividades
      </button>
      <PageHeader
        title={`${sheet.clientName} · ${sheet.origin} → ${sheet.destination}`}
        description={`Folha de ${formatDate(sheet.day)} · ${sheet.total} cargas · acompanhamento (só o estado é editável)`}
      />

      <div className="max-h-[calc(100vh-16rem)] overflow-auto rounded-md border border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <table className="min-w-[1800px] border-separate border-spacing-0 text-xs">
          <thead className="sticky top-0 z-20 bg-slate-100 text-left font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              {HEADERS.map((h, i) => (
                <th
                  key={h}
                  className={`whitespace-nowrap border-b border-r border-slate-300 px-3 py-2 dark:border-slate-700 ${i === 0 ? "sticky left-0 z-30 w-12 bg-slate-100 dark:bg-slate-800" : ""}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={HEADERS.length} className="px-3 py-6 text-center text-slate-500">
                  A carregar…
                </td>
              </tr>
            ) : (
              trips.map((trip, index) => {
                const next = nextTripStatus(trip.currentStatus);
                const terminal = isTerminalTripStatus(trip.currentStatus);
                return (
                  <tr
                    key={trip.id}
                    className="odd:bg-white even:bg-slate-50/60 dark:odd:bg-slate-900 dark:even:bg-slate-900/70"
                  >
                    <Td sticky>{index + 1}</Td>
                    <Td>{trip.bookingReference ?? trip.cargo.code}</Td>
                    <Td mono>{trip.horsePlate ?? trip.truck?.plateNumber ?? "—"}</Td>
                    <Td mono>{trip.trailerPlate ?? trip.trailer?.plateNumber ?? "—"}</Td>
                    <Td>{trip.driverName ?? trip.driver?.fullName ?? "—"}</Td>
                    <Td>{trip.borders.map((b) => b.border.name).join(" › ") || "—"}</Td>
                    <Td>{trip.tonnage ? `${trip.tonnage} t` : "—"}</Td>
                    <Td>{trip.dispatchedBy ?? "—"}</Td>
                    <Td>{formatDate(trip.departureDate)}</Td>
                    <Td>{formatDate(trip.arrivalDate)}</Td>
                    <Td>{formatDate(trip.dischargeDate)}</Td>
                    <Td>{trip.currentPosition ?? "—"}</Td>
                    <td className="whitespace-nowrap border-b border-r border-slate-200 px-3 py-2 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <StatusBadge tone={tripStatusBadgeTone[trip.currentStatus]}>
                          {tripStatusMeta[trip.currentStatus].label}
                        </StatusBadge>
                        {canEditState && !terminal && next ? (
                          <button
                            type="button"
                            onClick={() => advance(trip)}
                            disabled={updateStatus.isPending}
                            title={`Avançar para ${tripStatusMeta[next].label}`}
                            className="inline-flex items-center gap-1 rounded-md border border-brand-200 px-2 py-1 text-[11px] font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50 dark:border-brand-800 dark:text-brand-300"
                          >
                            {tripStatusMeta[next].label}
                            <ArrowRight className="size-3" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Td({
  children,
  sticky,
  mono,
}: {
  children: React.ReactNode;
  sticky?: boolean;
  mono?: boolean;
}) {
  return (
    <td
      className={`whitespace-nowrap border-b border-r border-slate-200 px-3 py-2 text-slate-700 dark:border-slate-800 dark:text-slate-300 ${sticky ? "sticky left-0 z-10 w-12 bg-inherit text-center font-semibold" : ""} ${mono ? "font-mono" : ""}`}
    >
      {children}
    </td>
  );
}
