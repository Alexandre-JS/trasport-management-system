"use client";

import { Ban, CheckCircle2, Download, Eye, Pencil, Plus, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { ActionMenu, type ActionItem } from "@/components/ui/action-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ColumnsMenu } from "@/components/ui/columns-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { type Column, DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { SearchBar } from "@/components/ui/search-bar";
import { Select } from "@/components/ui/select";
import { useCancelTrip, useCloseTrip, useTrips } from "@/hooks/use-trips";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useToast } from "@/providers/toast-provider";
import { extractErrorMessage } from "@/services/http";
import type { SortOrder } from "@/types/api";
import type { ListTripsParams, Trip, TripSortBy, TripStatus } from "@/types/trip";
import { exportToCsv } from "@/utils/export-csv";
import { formatDateTime, shortCode } from "@/utils/format";
import { tripStatusMeta, tripStatusOptions } from "@/utils/trip-status";

type StatusFilter = "all" | TripStatus;

const initialHiddenColumns = new Set<string>([]);

const closedStatuses: TripStatus[] = ["DISCHARGED", "CANCELLED"];

export function TripsView() {
  const { toast } = useToast();

  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<TripSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [hiddenColumns, setHiddenColumns] =
    useState<Set<string>>(initialHiddenColumns);
  const [detailsTrip, setDetailsTrip] = useState<Trip | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Trip | null>(null);
  const [closeTarget, setCloseTarget] = useState<Trip | null>(null);

  const search = useDebouncedValue(searchInput, 350);

  const params = useMemo<ListTripsParams>(
    () => ({
      page,
      limit,
      sortBy,
      sortOrder,
      search: search.trim() || undefined,
      currentStatus: status === "all" ? undefined : status,
    }),
    [page, limit, sortBy, sortOrder, search, status],
  );

  const { data, isLoading, isError, error, isFetching, refetch } =
    useTrips(params);
  const cancelTrip = useCancelTrip();
  const closeTrip = useCloseTrip();

  const rows = data?.data ?? [];
  const meta = data?.meta;

  function resetToFirstPage() {
    setPage(1);
    setSelectedKeys(new Set());
  }

  function handleSort(sortKey: string) {
    const key = sortKey as TripSortBy;

    if (sortBy === key) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }

    resetToFirstPage();
  }

  function toggleRow(key: string) {
    setSelectedKeys((current) => {
      const next = new Set(current);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelectedKeys(() =>
      checked ? new Set(rows.map((row) => row.id)) : new Set(),
    );
  }

  function toggleColumn(id: string) {
    setHiddenColumns((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  function handleExport() {
    if (rows.length === 0) {
      toast({ title: "Nada para exportar", type: "warning" });
      return;
    }

    exportToCsv("viagens.csv", rows, [
      { header: "Código", value: (row) => shortCode(row.id) },
      { header: "Carga", value: (row) => row.cargo.code },
      { header: "Motorista", value: (row) => row.driver.fullName },
      { header: "Horse", value: (row) => row.truck.plateNumber },
      { header: "Origem", value: (row) => row.cargo.origin },
      { header: "Destino", value: (row) => row.cargo.destination },
      { header: "Estado", value: (row) => tripStatusMeta[row.currentStatus].label },
      { header: "Hora Saída", value: (row) => formatDateTime(row.departureDate) },
      { header: "Hora Chegada", value: (row) => formatDateTime(row.arrivalDate) },
    ]);

    toast({ title: "Exportação concluída", type: "success" });
  }

  function comingSoon(action: string) {
    toast({
      title: "Funcionalidade em preparação",
      description: `${action} será ativado numa próxima etapa.`,
      type: "info",
    });
  }

  function confirmCancel() {
    if (!cancelTarget) {
      return;
    }

    cancelTrip.mutate(cancelTarget.id, {
      onSuccess: () => {
        toast({ title: "Viagem cancelada", type: "success" });
        setCancelTarget(null);
      },
      onError: (mutationError) =>
        toast({
          title: "Não foi possível cancelar",
          description: extractErrorMessage(mutationError),
          type: "error",
        }),
    });
  }

  function confirmClose() {
    if (!closeTarget) {
      return;
    }

    closeTrip.mutate(closeTarget.id, {
      onSuccess: () => {
        toast({ title: "Viagem encerrada", type: "success" });
        setCloseTarget(null);
      },
      onError: (mutationError) =>
        toast({
          title: "Não foi possível encerrar",
          description: extractErrorMessage(mutationError),
          type: "error",
        }),
    });
  }

  const columns: Column<Trip>[] = [
    {
      id: "code",
      header: "Código",
      cell: (trip) => (
        <span className="font-mono text-xs font-medium text-slate-500 dark:text-slate-400">
          {shortCode(trip.id)}
        </span>
      ),
    },
    {
      id: "cargo",
      header: "Carga",
      cell: (trip) => (
        <span className="font-mono text-xs text-slate-900 dark:text-white">
          {trip.cargo.code}
        </span>
      ),
    },
    {
      id: "driver",
      header: "Motorista",
      cell: (trip) => trip.driver.fullName,
    },
    {
      id: "truck",
      header: "Horse",
      cell: (trip) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
          {trip.truck.plateNumber}
        </span>
      ),
    },
    {
      id: "origin",
      header: "Origem",
      cell: (trip) => trip.cargo.origin,
    },
    {
      id: "destination",
      header: "Destino",
      cell: (trip) => trip.cargo.destination,
    },
    {
      id: "currentStatus",
      header: "Estado",
      sortable: true,
      sortKey: "currentStatus",
      cell: (trip) => {
        const meta = tripStatusMeta[trip.currentStatus];
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      id: "departureDate",
      header: "Hora Saída",
      sortable: true,
      sortKey: "departureDate",
      cell: (trip) => formatDateTime(trip.departureDate),
    },
    {
      id: "arrivalDate",
      header: "Hora Chegada",
      sortable: true,
      sortKey: "arrivalDate",
      cell: (trip) => formatDateTime(trip.arrivalDate),
    },
  ];

  const hideableColumns = [
    { id: "origin", label: "Origem" },
    { id: "destination", label: "Destino" },
    { id: "departureDate", label: "Hora Saída" },
    { id: "arrivalDate", label: "Hora Chegada" },
  ];

  function buildActions(trip: Trip): ActionItem[] {
    const items: ActionItem[] = [
      { label: "Visualizar", icon: Eye, onSelect: () => setDetailsTrip(trip) },
      { label: "Editar", icon: Pencil, onSelect: () => comingSoon("A edição") },
    ];

    if (!closedStatuses.includes(trip.currentStatus)) {
      items.push({
        label: "Encerrar",
        icon: CheckCircle2,
        onSelect: () => setCloseTarget(trip),
      });
      items.push({
        label: "Cancelar",
        icon: Ban,
        tone: "danger",
        separatorBefore: true,
        onSelect: () => setCancelTarget(trip),
      });
    }

    return items;
  }

  return (
    <>
      <PageHeader
        title="Viagens"
        description="Planeamento e execução das viagens de transporte."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className="size-4" />}
              onClick={() => refetch()}
              loading={isFetching}
            >
              Atualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Download className="size-4" />}
              onClick={handleExport}
            >
              Exportar
            </Button>
            <Button
              size="sm"
              icon={<Plus className="size-4" />}
              onClick={() => comingSoon("A criação de viagens")}
            >
              Nova Viagem
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-3 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
          <SearchBar
            value={searchInput}
            onChange={(value) => {
              setSearchInput(value);
              resetToFirstPage();
            }}
            placeholder="Pesquisar por carga, motorista ou matrícula..."
            className="sm:max-w-sm sm:flex-1"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Select
              aria-label="Filtrar por estado"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as StatusFilter);
                resetToFirstPage();
              }}
              options={tripStatusOptions}
              className="w-48"
            />
            <ColumnsMenu
              columns={hideableColumns.map((column) => ({
                ...column,
                visible: !hiddenColumns.has(column.id),
              }))}
              onToggle={toggleColumn}
            />
          </div>
        </div>

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

        {selectedKeys.size > 0 ? (
          <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
            <span>{selectedKeys.size} selecionado(s)</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedKeys(new Set())}
            >
              Limpar seleção
            </Button>
          </div>
        ) : null}

        <DataTable<Trip>
          columns={columns}
          rows={rows}
          getRowKey={(trip) => trip.id}
          loading={isLoading}
          hiddenColumns={hiddenColumns}
          selectable
          selectedKeys={selectedKeys}
          onToggleRow={toggleRow}
          onToggleAll={toggleAll}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          footer={
            meta ? (
              <Pagination
                page={meta.page}
                limit={meta.limit}
                total={meta.total}
                totalPages={meta.totalPages}
                onPageChange={setPage}
                onLimitChange={(nextLimit) => {
                  setLimit(nextLimit);
                  resetToFirstPage();
                }}
              />
            ) : null
          }
          renderActions={(trip) => <ActionMenu items={buildActions(trip)} />}
        />
      </div>

      <Modal
        open={detailsTrip !== null}
        title={detailsTrip ? `Viagem ${shortCode(detailsTrip.id)}` : "Viagem"}
        description={detailsTrip?.cargo.code}
        onClose={() => setDetailsTrip(null)}
      >
        {detailsTrip ? (
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailRow label="Carga" value={detailsTrip.cargo.code} />
            <DetailRow label="Motorista" value={detailsTrip.driver.fullName} />
            <DetailRow label="Horse" value={detailsTrip.truck.plateNumber} />
            <DetailRow
              label="Estado"
              value={tripStatusMeta[detailsTrip.currentStatus].label}
            />
            <DetailRow label="Origem" value={detailsTrip.cargo.origin} />
            <DetailRow label="Destino" value={detailsTrip.cargo.destination} />
            <DetailRow
              label="Hora de saída"
              value={formatDateTime(detailsTrip.departureDate)}
            />
            <DetailRow
              label="Chegada estimada"
              value={formatDateTime(detailsTrip.arrivalEstimate)}
            />
            <DetailRow
              label="Hora de chegada"
              value={formatDateTime(detailsTrip.arrivalDate)}
            />
          </dl>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={cancelTarget !== null}
        title="Cancelar viagem"
        description={
          cancelTarget
            ? `Tem a certeza que pretende cancelar a viagem da carga “${cancelTarget.cargo.code}”?`
            : undefined
        }
        confirmLabel="Cancelar viagem"
        cancelLabel="Voltar"
        tone="danger"
        loading={cancelTrip.isPending}
        onConfirm={confirmCancel}
        onCancel={() => setCancelTarget(null)}
      />

      <ConfirmDialog
        open={closeTarget !== null}
        title="Encerrar viagem"
        description={
          closeTarget
            ? `Encerrar a viagem da carga “${closeTarget.cargo.code}”? A viagem passa a Concluída.`
            : undefined
        }
        confirmLabel="Encerrar"
        loading={closeTrip.isPending}
        onConfirm={confirmClose}
        onCancel={() => setCloseTarget(null)}
      />
    </>
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
