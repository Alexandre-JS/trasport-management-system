"use client";

import {
  CircleCheck,
  Download,
  Eye,
  Pencil,
  Plus,
  PowerOff,
  RefreshCw,
  Trash2,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
import { TruckFormModal } from "@/components/trucks/truck-form-modal";
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
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  useDeleteTruck,
  useTruckStatusAction,
  useTrucks,
} from "@/hooks/use-trucks";
import { useToast } from "@/providers/toast-provider";
import { extractErrorMessage } from "@/services/http";
import type { SortOrder } from "@/types/api";
import type {
  ListTrucksParams,
  Truck,
  TruckSortBy,
  TruckStatus,
} from "@/types/truck";
import { formatDateTime, shortCode } from "@/utils/format";
import { truckStatusMeta, truckStatusOptions } from "@/utils/truck-status";
import { exportToCsv } from "@/utils/export-csv";

type StatusFilter = "all" | TruckStatus;

const initialHiddenColumns = new Set<string>(["updatedAt"]);

type TrucksViewProps = {
  showHeader?: boolean;
};

export function TrucksView({ showHeader = true }: TrucksViewProps = {}) {
  const { toast } = useToast();

  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<TruckSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [hiddenColumns, setHiddenColumns] =
    useState<Set<string>>(initialHiddenColumns);
  const [detailsTruck, setDetailsTruck] = useState<Truck | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Truck | null>(null);
  const [formTruck, setFormTruck] = useState<Truck | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  function openCreate() {
    setFormTruck(null);
    setFormOpen(true);
  }

  function openEdit(truck: Truck) {
    setFormTruck(truck);
    setFormOpen(true);
  }

  const search = useDebouncedValue(searchInput, 350);

  const params = useMemo<ListTrucksParams>(
    () => ({
      page,
      limit,
      sortBy,
      sortOrder,
      search: search.trim() || undefined,
      status: status === "all" ? undefined : status,
    }),
    [page, limit, sortBy, sortOrder, search, status],
  );

  const { data, isLoading, isError, error, isFetching, refetch } =
    useTrucks(params);
  const deleteTruck = useDeleteTruck();
  const statusAction = useTruckStatusAction();

  const rows = data?.data ?? [];
  const meta = data?.meta;

  function resetToFirstPage() {
    setPage(1);
    setSelectedKeys(new Set());
  }

  function handleSort(sortKey: string) {
    const key = sortKey as TruckSortBy;

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

    exportToCsv("horses.csv", rows, [
      { header: "Matrícula", value: (row) => row.plateNumber },
      { header: "Marca", value: (row) => row.brand ?? "" },
      { header: "Modelo", value: (row) => row.model ?? "" },
      { header: "Ano", value: (row) => row.year ?? "" },
      { header: "Estado", value: (row) => truckStatusMeta[row.status].label },
    ]);

    toast({ title: "Exportação concluída", type: "success" });
  }

  function runStatusAction(
    truck: Truck,
    action: "available" | "maintenance" | "deactivate",
    successMessage: string,
  ) {
    statusAction.mutate(
      { id: truck.id, action },
      {
        onSuccess: () => toast({ title: successMessage, type: "success" }),
        onError: (mutationError) =>
          toast({
            title: "Não foi possível atualizar",
            description: extractErrorMessage(mutationError),
            type: "error",
          }),
      },
    );
  }

  function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    deleteTruck.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast({ title: "Horse eliminado", type: "success" });
        setDeleteTarget(null);
      },
      onError: (mutationError) =>
        toast({
          title: "Não foi possível eliminar",
          description: extractErrorMessage(mutationError),
          type: "error",
        }),
    });
  }

  const columns: Column<Truck>[] = [
    {
      id: "plateNumber",
      header: "Matrícula",
      sortable: true,
      sortKey: "plateNumber",
      cell: (truck) => (
        <span className="font-mono text-sm font-medium text-slate-900 dark:text-white">
          {truck.plateNumber}
        </span>
      ),
    },
    {
      id: "brand",
      header: "Marca",
      sortable: true,
      sortKey: "brand",
      cell: (truck) => truck.brand ?? "—",
    },
    {
      id: "model",
      header: "Modelo",
      sortable: true,
      sortKey: "model",
      cell: (truck) => truck.model ?? "—",
    },
    {
      id: "status",
      header: "Estado",
      sortable: true,
      sortKey: "status",
      cell: (truck) => {
        const meta = truckStatusMeta[truck.status];
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      id: "currentDriver",
      header: "Motorista Atual",
      cell: () => (
        <span className="text-slate-400 dark:text-slate-500">—</span>
      ),
    },
    {
      id: "updatedAt",
      header: "Atualização",
      cell: (truck) => formatDateTime(truck.updatedAt),
    },
  ];

  const hideableColumns = [
    { id: "brand", label: "Marca" },
    { id: "model", label: "Modelo" },
    { id: "currentDriver", label: "Motorista Atual" },
    { id: "updatedAt", label: "Atualização" },
  ];

  function buildActions(truck: Truck): ActionItem[] {
    const items: ActionItem[] = [
      {
        label: "Detalhes",
        icon: Eye,
        tone: "info",
        onSelect: () => setDetailsTruck(truck),
      },
    ];

    if (truck.status === "ON_TRIP") {
      return items;
    }

    if (truck.status !== "INACTIVE") {
      items.push({
        label: "Editar",
        icon: Pencil,
        tone: "warning",
        onSelect: () => openEdit(truck),
      });
    }

    if (truck.status === "MAINTENANCE") {
      items.push({
        label: "Marcar disponível",
        icon: CircleCheck,
        tone: "success",
        onSelect: () =>
          runStatusAction(truck, "available", "Horse disponível"),
      });
    }

    if (truck.status === "AVAILABLE") {
      items.push({
        label: "Enviar p/ manutenção",
        icon: Wrench,
        tone: "warning",
        onSelect: () =>
          runStatusAction(truck, "maintenance", "Horse em manutenção"),
      });
    }

    if (truck.status === "AVAILABLE" || truck.status === "MAINTENANCE") {
      items.push({
        label: "Desativar",
        icon: PowerOff,
        tone: "muted",
        onSelect: () =>
          runStatusAction(truck, "deactivate", "Horse desativado"),
      });
    }

    if (truck.status !== "INACTIVE") {
      items.push({
        label: "Eliminar",
        icon: Trash2,
        tone: "danger",
        separatorBefore: true,
        onSelect: () => setDeleteTarget(truck),
      });
    }

    return items;
  }

  return (
    <>
      {showHeader ? (
        <PageHeader
          title="Horses"
          description="Gestão da frota, capacidade e estado operacional dos horses."
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
                onClick={openCreate}
              >
                Novo Horse
              </Button>
            </>
          }
        />
      ) : null}

      {!showHeader ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
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
          <Button size="sm" icon={<Plus className="size-4" />} onClick={openCreate}>
            Novo Horse
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-3 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
          <SearchBar
            value={searchInput}
            onChange={(value) => {
              setSearchInput(value);
              resetToFirstPage();
            }}
            placeholder="Pesquisar por matrícula, marca ou modelo..."
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
              options={truckStatusOptions}
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

        <DataTable<Truck>
          columns={columns}
          rows={rows}
          getRowKey={(truck) => truck.id}
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
          renderActions={(truck) => <ActionMenu items={buildActions(truck)} />}
        />
      </div>

      <Modal
        open={detailsTruck !== null}
        title={detailsTruck?.plateNumber ?? "Horse"}
        description={detailsTruck ? shortCode(detailsTruck.id) : undefined}
        onClose={() => setDetailsTruck(null)}
      >
        {detailsTruck ? (
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailRow label="Marca" value={detailsTruck.brand} />
            <DetailRow label="Modelo" value={detailsTruck.model} />
            <DetailRow
              label="Ano"
              value={detailsTruck.year ? String(detailsTruck.year) : null}
            />
            <DetailRow
              label="Estado"
              value={truckStatusMeta[detailsTruck.status].label}
            />
            <DetailRow
              label="Data de cadastro"
              value={formatDateTime(detailsTruck.createdAt)}
            />
            <DetailRow
              label="Última atualização"
              value={formatDateTime(detailsTruck.updatedAt)}
            />
          </dl>
        ) : null}
      </Modal>

      <TruckFormModal
        open={formOpen}
        truck={formTruck}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Eliminar horse"
        description={
          deleteTarget
            ? `Tem a certeza que pretende eliminar “${deleteTarget.plateNumber}”? Esta ação desativa o registo.`
            : undefined
        }
        confirmLabel="Eliminar"
        tone="danger"
        loading={deleteTruck.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
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
