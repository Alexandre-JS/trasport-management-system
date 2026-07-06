"use client";

import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Plus,
  Route,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  IconButton,
  PrimaryButton,
} from "@/src/shared/components/action-button";
import { CargoFormModal } from "@/src/shared/components/cargo-form-modal";
import { ConfirmDialog } from "@/src/shared/components/confirm-dialog";
import { CreateTripFromCargoModal } from "@/src/shared/components/create-trip-from-cargo-modal";
import { DataTable } from "@/src/shared/components/data-table";
import { ErrorState } from "@/src/shared/components/error-state";
import { FilterBar } from "@/src/shared/components/filter-bar";
import { PageHeader } from "@/src/shared/components/page-header";
import { PageLoader } from "@/src/shared/components/page-loader";
import { SearchInput } from "@/src/shared/components/search-input";
import { StatusBadge } from "@/src/shared/components/status-badge";
import { Modal } from "@/components/ui/modal";
import { useCancelCargo, useCargo } from "@/hooks/use-cargo";
import { useClients } from "@/hooks/use-clients";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useToast } from "@/providers/toast-provider";
import { extractErrorMessage } from "@/services/http";
import type { Cargo, CargoStatus, ListCargoParams } from "@/types/cargo";
import { formatDate, formatDateTime, formatWeight } from "@/utils/format";
import {
  cargoStatusBadgeTone,
  cargoStatusMeta,
  cargoStatusOptions,
} from "@/utils/cargo-status";
import {
  borderLabel,
  isTerminalTripStatus,
  tripStatusBadgeTone,
  tripStatusMeta,
} from "@/utils/trip-status";

type StatusFilter = CargoStatus | "all";

const columns = [
  { id: "code", header: "Código" },
  { id: "client", header: "Cliente" },
  { id: "route", header: "Rota" },
  { id: "weight", header: "Peso" },
  { id: "stage", header: "Etapa" },
  { id: "trip", header: "Viagem" },
  { id: "actions", header: "Ações", align: "right" as const },
];

const PAGE_SIZE = 10;

const MANAGEABLE_STATUSES: CargoStatus[] = ["CREATED", "WAITING_PICKUP"];

export function CargasView() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [clientId, setClientId] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailsCargo, setDetailsCargo] = useState<Cargo | null>(null);
  const [editCargo, setEditCargo] = useState<Cargo | null>(null);
  const [tripCargo, setTripCargo] = useState<Cargo | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Cargo | null>(null);

  const search = useDebouncedValue(searchInput.trim(), 350);
  const clients = useClients({ limit: 100, isActive: true });
  const cancelCargo = useCancelCargo();

  const params = useMemo<ListCargoParams>(
    () => ({
      page,
      limit: PAGE_SIZE,
      sortBy: "createdAt",
      sortOrder: "desc",
      search: search || undefined,
      clientId: clientId === "all" ? undefined : clientId,
      status: status === "all" ? undefined : status,
    }),
    [page, search, clientId, status],
  );

  const { data, isLoading, isError, refetch, isFetching } = useCargo(params);
  const cargos = data?.data ?? [];
  const meta = data?.meta;

  function latestTrip(cargo: Cargo) {
    return cargo.trips?.[0] ?? null;
  }

  function activeTrip(cargo: Cargo) {
    const trip = latestTrip(cargo);

    return trip && !isTerminalTripStatus(trip.currentStatus) ? trip : null;
  }

  function canManageCargo(cargo: Cargo) {
    return MANAGEABLE_STATUSES.includes(cargo.status) && !activeTrip(cargo);
  }

  function canCreateTrip(cargo: Cargo) {
    return canManageCargo(cargo);
  }

  function cargoStage(cargo: Cargo) {
    const trip = latestTrip(cargo);

    if (trip) {
      return {
        label: tripStatusMeta[trip.currentStatus].label,
        tone: tripStatusBadgeTone[trip.currentStatus],
        detail:
          trip.currentPosition ??
          (trip.border ? borderLabel[trip.border] : null) ??
          (trip.currentStatus === "WAITING_APPOINTMENT"
            ? "No porto · aguarda marcação"
            : null) ??
          (trip.currentStatus === "APPOINTMENT_DONE"
            ? "No porto · marcação feita"
            : null),
      };
    }

    if (cargo.status === "CREATED") {
      return {
        label: "Ainda não despachada",
        tone: "neutral" as const,
        detail: "Sem motorista e camião atribuídos",
      };
    }

    return {
      label: cargoStatusMeta[cargo.status].label,
      tone: cargoStatusBadgeTone[cargo.status],
      detail: null,
    };
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Cargas"
        description="Cargas dos clientes — o primeiro passo do fluxo, antes de criar a viagem."
        primaryAction={
          <PrimaryButton
            icon={<Plus className="size-4" aria-hidden />}
            onClick={() => setCreateOpen(true)}
          >
            Nova carga
          </PrimaryButton>
        }
      />

      <FilterBar>
        <SearchInput
          value={searchInput}
          onChange={(value) => {
            setSearchInput(value);
            setPage(1);
          }}
          placeholder="Pesquisar por código, rota ou mercadoria..."
          className="sm:w-80"
        />
        <div className="flex gap-2">
          <select
            value={clientId}
            onChange={(event) => {
              setClientId(event.target.value);
              setPage(1);
            }}
            aria-label="Filtrar por cliente"
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="all">Todos os clientes</option>
            {(clients.data?.data ?? []).map((client) => (
              <option key={client.id} value={client.id}>
                {client.companyName}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as StatusFilter);
              setPage(1);
            }}
            aria-label="Filtrar por estado"
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {cargoStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </FilterBar>

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState
          title="Não foi possível carregar as cargas"
          onAction={() => void refetch()}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <DataTable columns={columns}>
            {cargos.length > 0
              ? cargos.map((cargo) => {
                  const trip = latestTrip(cargo);
                  const active = activeTrip(cargo);
                  const stage = cargoStage(cargo);

                  return (
                    <tr
                      key={cargo.id}
                      className="border-t border-slate-100 dark:border-slate-800"
                    >
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      {cargo.code}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {cargo.client.companyName}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {cargo.origin} → {cargo.destination}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-300">
                      {formatWeight(cargo.weightKg)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      <StatusBadge tone={stage.tone}>{stage.label}</StatusBadge>
                      {stage.detail ? (
                        <p className="mt-1 max-w-48 truncate text-xs text-slate-500 dark:text-slate-400">
                          {stage.detail}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {trip ? (
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => router.push(`/viagens/${trip.id}`)}
                            className="w-fit font-mono text-xs font-medium text-brand-700 hover:text-brand-900 dark:text-brand-300 dark:hover:text-brand-100"
                          >
                            {trip.id.slice(0, 8).toUpperCase()}
                          </button>
                          <span className="text-xs">
                            {trip.truck.plateNumber} · {trip.driver.fullName}
                          </span>
                          {trip.trailer ? (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              Reboque {trip.trailer.plateNumber}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">
                          Sem viagem
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <IconButton
                          variant="secondary"
                          icon={<Eye className="size-4" aria-hidden />}
                          aria-label="Ver detalhes da carga"
                          title="Ver detalhes da carga"
                          className="border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200 dark:hover:bg-blue-900"
                          onClick={() => setDetailsCargo(cargo)}
                        >
                          Ver detalhes da carga
                        </IconButton>
                        {active ? (
                          <IconButton
                            variant="secondary"
                            icon={<Route className="size-4" aria-hidden />}
                            aria-label="Abrir viagem"
                            title="Abrir viagem"
                            className="border-brand-100 bg-brand-50 text-brand-700 hover:bg-brand-100 dark:border-brand-900 dark:bg-brand-950 dark:text-brand-200 dark:hover:bg-brand-900"
                            onClick={() => router.push(`/viagens/${active.id}`)}
                          >
                            Abrir viagem
                          </IconButton>
                        ) : null}
                        {canCreateTrip(cargo) ? (
                          <IconButton
                            variant="secondary"
                            icon={<Route className="size-4" aria-hidden />}
                            aria-label="Criar viagem"
                            title="Criar viagem"
                            className="border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 dark:hover:bg-emerald-900"
                            onClick={() => setTripCargo(cargo)}
                          >
                            Criar viagem
                          </IconButton>
                        ) : null}
                        {canManageCargo(cargo) ? (
                          <IconButton
                            variant="secondary"
                            icon={<Pencil className="size-4" aria-hidden />}
                            aria-label="Editar carga"
                            title="Editar carga"
                            className="border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200 dark:hover:bg-amber-900"
                            onClick={() => setEditCargo(cargo)}
                          >
                            Editar carga
                          </IconButton>
                        ) : null}
                        {canManageCargo(cargo) ? (
                          <IconButton
                            variant="danger"
                            icon={<Ban className="size-4" aria-hidden />}
                            aria-label="Cancelar carga"
                            title="Cancelar carga"
                            onClick={() => setCancelTarget(cargo)}
                          >
                            Cancelar
                          </IconButton>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
                })
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

      <CargoFormModal
        key="create-cargo"
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      <CargoFormModal
        key={editCargo?.id ?? "edit-cargo"}
        open={editCargo !== null}
        cargo={editCargo}
        onClose={() => setEditCargo(null)}
      />

      <CreateTripFromCargoModal
        open={tripCargo !== null}
        cargo={tripCargo}
        onClose={() => setTripCargo(null)}
      />

      <Modal
        open={detailsCargo !== null}
        title={detailsCargo?.code ?? "Carga"}
        description={detailsCargo?.client.companyName}
        onClose={() => setDetailsCargo(null)}
        size="lg"
      >
        {detailsCargo
          ? (() => {
              const stage = cargoStage(detailsCargo);
              const trip = latestTrip(detailsCargo);

              return (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={stage.tone}>{stage.label}</StatusBadge>
                    {stage.detail ? (
                      <span className="rounded-md bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-200">
                        {stage.detail}
                      </span>
                    ) : null}
                    {!canManageCargo(detailsCargo) ? (
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        Apenas consulta
                      </span>
                    ) : null}
                  </div>

                  {trip ? (
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Viagem associada
                        </h3>
                        <button
                          type="button"
                          onClick={() => router.push(`/viagens/${trip.id}`)}
                          className="text-xs font-medium text-brand-700 hover:text-brand-900 dark:text-brand-300 dark:hover:text-brand-100"
                        >
                          Abrir viagem
                        </button>
                      </div>
                      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <DetailRow
                          label="Motorista"
                          value={trip.driver.fullName}
                        />
                        <DetailRow
                          label="Camião"
                          value={trip.truck.plateNumber}
                        />
                        <DetailRow
                          label="Reboque"
                          value={trip.trailer?.plateNumber}
                        />
                        <DetailRow
                          label="Posição atual"
                          value={
                            trip.currentPosition ??
                            (trip.border ? borderLabel[trip.border] : null)
                          }
                        />
                        <DetailRow
                          label="Saída prevista/real"
                          value={formatDateTime(trip.departureDate)}
                        />
                        <DetailRow
                          label="Chegada estimada"
                          value={formatDateTime(trip.arrivalEstimate)}
                        />
                      </dl>
                    </div>
                  ) : null}

                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <DetailRow
                      label="Cliente"
                      value={detailsCargo.client.companyName}
                    />
                    <DetailRow label="Código" value={detailsCargo.code} />
                    <DetailRow label="Origem" value={detailsCargo.origin} />
                    <DetailRow label="Destino" value={detailsCargo.destination} />
                    <DetailRow
                      label="Peso"
                      value={formatWeight(detailsCargo.weightKg)}
                    />
                    <DetailRow
                      label="Volume"
                      value={
                        detailsCargo.volumeM3 === null
                          ? "—"
                          : `${detailsCargo.volumeM3} m³`
                      }
                    />
                    <DetailRow
                      label="Data de recolha"
                      value={formatDate(detailsCargo.pickupDate)}
                    />
                    <DetailRow
                      label="Entrega prevista"
                      value={formatDate(detailsCargo.expectedDelivery)}
                    />
                    <DetailRow
                      label="Criada em"
                      value={formatDateTime(detailsCargo.createdAt)}
                    />
                    <DetailRow
                      label="Última atualização"
                      value={formatDateTime(detailsCargo.updatedAt)}
                    />
                    <DetailRow
                      label="Mercadoria"
                      value={detailsCargo.description}
                    />
                    <DetailRow
                      label="Observações"
                      value={detailsCargo.observations}
                    />
                  </dl>
                </div>
              );
            })()
          : null}
      </Modal>

      <ConfirmDialog
        open={cancelTarget !== null}
        title="Cancelar esta carga?"
        description={
          cancelTarget
            ? `A carga ${cancelTarget.code} passa a Cancelada.`
            : undefined
        }
        confirmLabel="Cancelar carga"
        cancelLabel="Voltar"
        onCancel={() => setCancelTarget(null)}
        onConfirm={() => {
          const target = cancelTarget;
          setCancelTarget(null);
          if (!target) return;
          cancelCargo.mutate(target.id, {
            onSuccess: () =>
              toast({ title: "Carga cancelada", type: "success" }),
            onError: (error) =>
              toast({
                title: "Não foi possível cancelar",
                description: extractErrorMessage(error),
                type: "error",
              }),
          });
        }}
      />
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-slate-800 dark:text-slate-200">
        {value && value.length > 0 ? value : "—"}
      </dd>
    </div>
  );
}
