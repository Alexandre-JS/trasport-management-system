"use client";

import {
  Ban,
  FileSpreadsheet,
  Eye,
  Link2,
  Pencil,
  Plus,
  RefreshCw,
} from "lucide-react";
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
import { useCancelCargo, useCargo } from "@/hooks/use-cargo";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useToast } from "@/providers/toast-provider";
import { extractErrorMessage } from "@/services/http";
import type { SortOrder } from "@/types/api";
import type { Cargo, CargoSortBy, CargoStatus, ListCargoParams } from "@/types/cargo";
import { cargoStatusMeta, cargoStatusOptions } from "@/utils/cargo-status";
import { exportToCsv } from "@/utils/export-csv";
import { formatDate, formatDateTime, formatWeight } from "@/utils/format";
import { cargoTypeLabel } from "@/utils/cargo-type";

type StatusFilter = "all" | CargoStatus;

const initialHiddenColumns = new Set<string>(["updatedAt"]);

const nonCancellable: CargoStatus[] = ["CANCELLED", "DELIVERED"];

export function CargoView() {
  const { toast } = useToast();

  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<CargoSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [hiddenColumns, setHiddenColumns] =
    useState<Set<string>>(initialHiddenColumns);
  const [detailsCargo, setDetailsCargo] = useState<Cargo | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Cargo | null>(null);

  const search = useDebouncedValue(searchInput, 350);

  const params = useMemo<ListCargoParams>(
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
    useCargo(params);
  const cancelCargo = useCancelCargo();

  const rows = data?.data ?? [];
  const meta = data?.meta;

  function resetToFirstPage() {
    setPage(1);
    setSelectedKeys(new Set());
  }

  function handleSort(sortKey: string) {
    const key = sortKey as CargoSortBy;

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

    exportToCsv("cargas.csv", rows, [
      { header: "Código", value: (row) => row.code },
      { header: "Cliente", value: (row) => row.client.companyName },
      { header: "Origem", value: (row) => row.origin },
      { header: "Destino", value: (row) => row.destination },
      { header: "Peso (t)", value: (row) => row.weightTonnes ?? "" },
      { header: "Tipo", value: (row) => cargoTypeLabel(row.type) },
      { header: "Nº container", value: (row) => row.containerNumber ?? "" },
      { header: "Estado", value: (row) => cargoStatusMeta[row.status].label },
      { header: "Data Recolha", value: (row) => formatDate(row.pickupDate) },
      {
        header: "Entrega Prevista",
        value: (row) => formatDate(row.expectedDelivery),
      },
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

    cancelCargo.mutate(cancelTarget.id, {
      onSuccess: () => {
        toast({ title: "Carga cancelada", type: "success" });
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

  const columns: Column<Cargo>[] = [
    {
      id: "code",
      header: "Código",
      sortable: true,
      sortKey: "code",
      cell: (cargo) => (
        <span className="font-mono text-xs font-medium text-slate-900 dark:text-white">
          {cargo.code}
        </span>
      ),
    },
    {
      id: "client",
      header: "Cliente",
      cell: (cargo) => cargo.client.companyName,
    },
    {
      id: "origin",
      header: "Origem",
      sortable: true,
      sortKey: "origin",
      cell: (cargo) => cargo.origin,
    },
    {
      id: "destination",
      header: "Destino",
      sortable: true,
      sortKey: "destination",
      cell: (cargo) => cargo.destination,
    },
    {
      id: "weightTonnes",
      header: "Peso",
      sortable: true,
      sortKey: "weightTonnes",
      align: "right",
      cell: (cargo) => formatWeight(cargo.weightTonnes),
    },
    {
      id: "status",
      header: "Estado",
      sortable: true,
      sortKey: "status",
      cell: (cargo) => {
        const meta = cargoStatusMeta[cargo.status];
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      id: "pickupDate",
      header: "Data Recolha",
      cell: (cargo) => formatDate(cargo.pickupDate),
    },
    {
      id: "expectedDelivery",
      header: "Entrega Prevista",
      cell: (cargo) => formatDate(cargo.expectedDelivery),
    },
    {
      id: "updatedAt",
      header: "Atualização",
      cell: (cargo) => formatDateTime(cargo.updatedAt),
    },
  ];

  const hideableColumns = [
    { id: "origin", label: "Origem" },
    { id: "destination", label: "Destino" },
    { id: "pickupDate", label: "Data Recolha" },
    { id: "expectedDelivery", label: "Entrega Prevista" },
    { id: "updatedAt", label: "Atualização" },
  ];

  function buildActions(cargo: Cargo): ActionItem[] {
    const items: ActionItem[] = [
      { label: "Visualizar", icon: Eye, onSelect: () => setDetailsCargo(cargo) },
      { label: "Editar", icon: Pencil, onSelect: () => comingSoon("A edição") },
      {
        label: "Atribuir",
        icon: Link2,
        onSelect: () => comingSoon("A atribuição a uma viagem"),
      },
    ];

    if (!nonCancellable.includes(cargo.status)) {
      items.push({
        label: "Cancelar",
        icon: Ban,
        tone: "danger",
        separatorBefore: true,
        onSelect: () => setCancelTarget(cargo),
      });
    }

    return items;
  }

  return (
    <>
      <PageHeader
        title="Cargas"
        description="Cadastro e acompanhamento do estado das cargas transportadas."
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
              icon={<FileSpreadsheet className="size-4" />}
              onClick={handleExport}
            >
              Exportar para Excel
            </Button>
            <Button
              size="sm"
              icon={<Plus className="size-4" />}
              onClick={() => comingSoon("A criação de cargas")}
            >
              Criar Carga
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
            placeholder="Pesquisar por código, cliente, origem ou destino..."
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
              options={cargoStatusOptions}
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

        <DataTable<Cargo>
          columns={columns}
          rows={rows}
          getRowKey={(cargo) => cargo.id}
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
          renderActions={(cargo) => <ActionMenu items={buildActions(cargo)} />}
        />
      </div>

      <Modal
        open={detailsCargo !== null}
        size="lg"
        title={detailsCargo?.code ?? "Carga"}
        description={detailsCargo?.client.companyName}
        onClose={() => setDetailsCargo(null)}
      >
        {detailsCargo ? (
          <dl className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <DetailRow label="Origem" value={detailsCargo.origin} />
            <DetailRow label="Destino" value={detailsCargo.destination} />
            <DetailRow label="Peso" value={formatWeight(detailsCargo.weightTonnes)} />
            <DetailRow label="Tipo" value={cargoTypeLabel(detailsCargo.type)} />
            <DetailRow label="Nº container" value={detailsCargo.containerNumber ?? "—"} />
            <DetailRow
              label="Estado"
              value={cargoStatusMeta[detailsCargo.status].label}
            />
            <DetailRow
              label="Data de recolha"
              value={formatDate(detailsCargo.pickupDate)}
            />
            <DetailRow
              label="Entrega prevista"
              value={formatDate(detailsCargo.expectedDelivery)}
            />
            <DetailRow label="Descrição" value={detailsCargo.description} />
            <DetailRow label="Observações" value={detailsCargo.observations} />
          </dl>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={cancelTarget !== null}
        title="Cancelar carga"
        description={
          cancelTarget
            ? `Tem a certeza que pretende cancelar a carga “${cancelTarget.code}”?`
            : undefined
        }
        confirmLabel="Cancelar carga"
        cancelLabel="Voltar"
        tone="danger"
        loading={cancelCargo.isPending}
        onConfirm={confirmCancel}
        onCancel={() => setCancelTarget(null)}
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
    <div className="grid border-b border-slate-100 last:border-b-0 sm:grid-cols-[minmax(9rem,38%)_1fr] dark:border-slate-800">
      <dt className="bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
        {label}
      </dt>
      <dd className="min-w-0 break-words px-4 py-3 text-sm text-slate-800 dark:text-slate-200">
        {value && value.length > 0 ? value : "—"}
      </dd>
    </div>
  );
}
