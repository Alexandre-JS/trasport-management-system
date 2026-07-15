"use client";

import { ChevronLeft, ChevronRight, Eye, FileSpreadsheet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  IconButton,
  SecondaryButton,
} from "@/src/shared/components/action-button";
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
import { exportToCsv } from "@/utils/export-csv";
import {
  borderNames,
  tripStatusBadgeTone,
  tripStatusMeta,
  tripStatusOptions,
} from "@/utils/trip-status";

type StatusFilter = TripStatus | "all";

const columns = [
  { id: "code", header: "Nº" },
  { id: "route", header: "Rota" },
  { id: "equipment", header: "Horse / Trailer" },
  { id: "driver", header: "Motorista" },
  { id: "border", header: "Border" },
  { id: "position", header: "Posição atual" },
  { id: "status", header: "Estado" },
  { id: "actions", header: "Ações", align: "right" as const },
];

const PAGE_SIZE = 10;

function dash(value: string | null | undefined): string {
  return value && value.trim() ? value : "—";
}

type TripsListViewProps = {
  initialSearch?: string;
  initialStatus?: string;
  initialPage?: number;
};

export function TripsListView({
  initialSearch = "",
  initialStatus = "all",
  initialPage = 1,
}: TripsListViewProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [status, setStatus] = useState<StatusFilter>(
    tripStatusOptions.some((option) => option.value === initialStatus)
      ? (initialStatus as StatusFilter)
      : "all",
  );
  const [page, setPage] = useState(Math.max(1, initialPage));

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

  function updateUrl(next: {
    q?: string;
    status?: StatusFilter;
    page?: number;
  }) {
    const params = new URLSearchParams();
    const nextSearch = next.q ?? searchInput;
    const nextStatus = next.status ?? status;
    const nextPage = next.page ?? page;

    if (nextSearch.trim()) params.set("q", nextSearch.trim());
    if (nextStatus !== "all") params.set("status", nextStatus);
    if (nextPage > 1) params.set("page", String(nextPage));
    router.replace(`/viagens${params.size ? `?${params}` : ""}`, {
      scroll: false,
    });
  }

  function clearFilters() {
    setSearchInput("");
    setStatus("all");
    setPage(1);
    router.replace("/viagens", { scroll: false });
  }

  function exportVisibleRows() {
    if (trips.length === 0) return;

    exportToCsv("viagens.csv", trips, [
      { header: "Carga", value: (trip) => trip.cargo.code },
      { header: "Origem", value: (trip) => trip.cargo.origin },
      { header: "Destino", value: (trip) => trip.cargo.destination },
      { header: "Horse", value: (trip) => trip.truck.plateNumber },
      { header: "Trailer", value: (trip) => trip.trailer?.plateNumber },
      { header: "Motorista", value: (trip) => trip.driver.fullName },
      { header: "Border", value: (trip) => borderNames(trip.borders) },
      { header: "Tonelagem", value: (trip) => trip.tonnage },
      { header: "Posição atual", value: (trip) => trip.currentPosition },
      { header: "Estado", value: (trip) => tripStatusMeta[trip.currentStatus].label },
    ]);
  }

  function openTrip(trip: Trip) {
    router.push(`/viagens/${trip.id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Viagens"
        description="Acompanhe as viagens de transporte: estado, posição atual e ciclo de vida."
        secondaryActions={
          <SecondaryButton
            icon={<FileSpreadsheet className="size-4" aria-hidden />}
            onClick={exportVisibleRows}
            disabled={trips.length === 0}
          >
            Exportar para Excel
          </SecondaryButton>
        }
      />

      <FilterBar>
        <SearchInput
          value={searchInput}
          onChange={(value) => {
            setSearchInput(value);
            setPage(1);
            updateUrl({ q: value, page: 1 });
          }}
          placeholder="Pesquisar por carga, rota, motorista ou matrícula..."
          className="sm:w-96"
        />
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as StatusFilter);
            setPage(1);
            updateUrl({
              status: event.target.value as StatusFilter,
              page: 1,
            });
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
          <DataTable
            columns={columns}
            isEmpty={trips.length === 0}
            emptyTitle="Nenhuma viagem encontrada"
            emptyDescription="Altere os filtros ou crie uma viagem a partir de uma carga disponível."
            emptyAction={
              searchInput || status !== "all" ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="h-9 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  Limpar filtros
                </button>
              ) : null
            }
          >
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
                      <span className="block whitespace-nowrap">
                        {trip.cargo.origin} → {trip.cargo.destination}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-400 dark:text-slate-500">
                        {trip.tonnage ? `${trip.tonnage} t` : "Sem tonelagem"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      <span className="block font-medium text-slate-800 dark:text-slate-200">
                        {trip.truck.plateNumber}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-400 dark:text-slate-500">
                        {trip.trailer?.plateNumber ?? "Sem trailer"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {trip.driver.fullName}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {borderNames(trip.borders) ?? "—"}
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
                  onClick={() => {
                    const nextPage = Math.max(1, page - 1);
                    setPage(nextPage);
                    updateUrl({ page: nextPage });
                  }}
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
                  onClick={() => {
                    const nextPage = Math.min(meta.totalPages, page + 1);
                    setPage(nextPage);
                    updateUrl({ page: nextPage });
                  }}
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
