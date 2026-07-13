"use client";

import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { IconButton } from "@/src/shared/components/action-button";
import { DataTable } from "@/src/shared/components/data-table";
import { ErrorState } from "@/src/shared/components/error-state";
import { FilterBar } from "@/src/shared/components/filter-bar";
import { PageHeader } from "@/src/shared/components/page-header";
import { PageLoader } from "@/src/shared/components/page-loader";
import { SearchInput } from "@/src/shared/components/search-input";
import { StatusBadge } from "@/src/shared/components/status-badge";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useTrips } from "@/hooks/use-trips";
import type { ListTripsParams, Trip, TripStatus } from "@/types/trip";
import {
  borderLabel,
  tripStatusBadgeTone,
  tripStatusMeta,
  tripStatusOptions,
} from "@/utils/trip-status";

type StatusFilter = TripStatus | "all";

const columns = [
  { id: "code", header: "Nº" },
  { id: "route", header: "Rota" },
  { id: "truck", header: "Horse" },
  { id: "trailer", header: "Trailer" },
  { id: "driver", header: "Motorista" },
  { id: "border", header: "Fronteira" },
  { id: "tonnage", header: "Tonelagem" },
  { id: "position", header: "Posição atual" },
  { id: "status", header: "Estado" },
  { id: "actions", header: "Ações", align: "right" as const },
];

const PAGE_SIZE = 10;

function dash(value: string | null | undefined): string {
  return value && value.trim() ? value : "—";
}

export function TripsListView() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  const search = useDebouncedValue(searchInput.trim(), 350);

  const params = useMemo<ListTripsParams>(
    () => ({
      page,
      limit: PAGE_SIZE,
      sortBy: "createdAt",
      sortOrder: "desc",
      search: search || undefined,
      currentStatus: status === "all" ? undefined : status,
    }),
    [page, search, status],
  );

  const { data, isLoading, isError, refetch, isFetching } = useTrips(params);

  const trips = data?.data ?? [];
  const meta = data?.meta;

  function openTrip(trip: Trip) {
    router.push(`/viagens/${trip.id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Viagens"
        description="Acompanhe as viagens de transporte: estado, posição atual e ciclo de vida."
      />

      <FilterBar>
        <SearchInput
          value={searchInput}
          onChange={(value) => {
            setSearchInput(value);
            setPage(1);
          }}
          placeholder="Pesquisar por carga, rota, motorista ou matrícula..."
          className="sm:w-96"
        />
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as StatusFilter);
            setPage(1);
          }}
          aria-label="Filtrar por estado"
          className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          {tripStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FilterBar>

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState
          title="Não foi possível carregar as viagens"
          description="Verifique a ligação à API e tente novamente."
          onAction={() => void refetch()}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <DataTable columns={columns}>
            {trips.length > 0
              ? trips.map((trip) => (
                  <tr
                    key={trip.id}
                    onClick={() => openTrip(trip)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") openTrip(trip);
                    }}
                    tabIndex={0}
                    className="cursor-pointer border-t border-slate-100 outline-none transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50 dark:focus-visible:bg-slate-800/50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      {trip.cargo.code}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {trip.cargo.origin} → {trip.cargo.destination}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {trip.truck.plateNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {trip.trailer?.plateNumber ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {trip.driver.fullName}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {trip.border ? borderLabel[trip.border] : "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-300">
                      {trip.tonnage ? `${trip.tonnage} t` : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {dash(trip.currentPosition)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={tripStatusBadgeTone[trip.currentStatus]}>
                        {tripStatusMeta[trip.currentStatus].label}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <IconButton
                        variant="secondary"
                        icon={<Eye className="size-4" aria-hidden />}
                        aria-label="Visualizar viagem"
                        title="Visualizar viagem"
                        className="border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200 dark:hover:bg-blue-900"
                        onClick={(event) => {
                          event.stopPropagation();
                          openTrip(trip);
                        }}
                      >
                        Visualizar viagem
                      </IconButton>
                    </td>
                  </tr>
                ))
              : null}
          </DataTable>

          {meta && meta.total > 0 ? (
            <div className="flex flex-col items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 sm:flex-row">
              <span>
                {(meta.page - 1) * meta.limit + 1}–
                {Math.min(meta.page * meta.limit, meta.total)} de {meta.total}
                {isFetching ? " · a atualizar…" : ""}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={meta.page <= 1}
                  aria-label="Página anterior"
                  className="grid size-8 place-items-center rounded-md border border-slate-200 disabled:opacity-40 dark:border-slate-700"
                >
                  <ChevronLeft className="size-4" aria-hidden />
                </button>
                <span>
                  Página {meta.page} de {meta.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPage((current) =>
                      Math.min(meta.totalPages, current + 1),
                    )
                  }
                  disabled={meta.page >= meta.totalPages}
                  aria-label="Página seguinte"
                  className="grid size-8 place-items-center rounded-md border border-slate-200 disabled:opacity-40 dark:border-slate-700"
                >
                  <ChevronRight className="size-4" aria-hidden />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
