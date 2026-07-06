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
import { TrailerFormModal } from "@/components/trailers/trailer-form-modal";
import { ActionMenu, type ActionItem } from "@/components/ui/action-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ColumnsMenu } from "@/components/ui/columns-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { type Column, DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { SearchBar } from "@/components/ui/search-bar";
import { Select } from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  useDeleteTrailer,
  useTrailerStatusAction,
  useTrailers,
} from "@/hooks/use-trailers";
import { useToast } from "@/providers/toast-provider";
import { extractErrorMessage } from "@/services/http";
import type { SortOrder } from "@/types/api";
import type {
  ListTrailersParams,
  Trailer,
  TrailerSortBy,
  TrailerStatus,
} from "@/types/trailer";
import { exportToCsv } from "@/utils/export-csv";
import { formatDateTime, shortCode } from "@/utils/format";
import { truckStatusMeta, truckStatusOptions } from "@/utils/truck-status";

type StatusFilter = "all" | TrailerStatus;

const initialHiddenColumns = new Set<string>(["updatedAt"]);

export function TrailersView() {
  const { toast } = useToast();

  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<TrailerSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [hiddenColumns, setHiddenColumns] =
    useState<Set<string>>(initialHiddenColumns);
  const [detailsTrailer, setDetailsTrailer] = useState<Trailer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Trailer | null>(null);
  const [formTrailer, setFormTrailer] = useState<Trailer | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  function openCreate() {
    setFormTrailer(null);
    setFormOpen(true);
  }

  function openEdit(trailer: Trailer) {
    setFormTrailer(trailer);
    setFormOpen(true);
  }

  const search = useDebouncedValue(searchInput, 350);

  const params = useMemo<ListTrailersParams>(
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
    useTrailers(params);
  const deleteTrailer = useDeleteTrailer();
  const statusAction = useTrailerStatusAction();

  const rows = data?.data ?? [];
  const meta = data?.meta;

  function resetToFirstPage() {
    setPage(1);
    setSelectedKeys(new Set());
  }

  function handleSort(sortKey: string) {
    const key = sortKey as TrailerSortBy;

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

    exportToCsv("reboques.csv", rows, [
      { header: "Matrícula", value: (row) => row.plateNumber },
      { header: "Marca", value: (row) => row.brand ?? "" },
      { header: "Modelo/Tipo", value: (row) => row.model ?? "" },
      { header: "Camião associado", value: (row) => row.truck?.plateNumber ?? "" },
      { header: "Ano", value: (row) => row.year ?? "" },
      { header: "Tonelagem", value: (row) => row.tonnage ?? "" },
      { header: "Estado", value: (row) => truckStatusMeta[row.status].label },
    ]);

    toast({ title: "Exportação concluída", type: "success" });
  }

  function runStatusAction(
    trailer: Trailer,
    action: "available" | "maintenance" | "deactivate",
    successMessage: string,
  ) {
    statusAction.mutate(
      { id: trailer.id, action },
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

    deleteTrailer.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast({ title: "Reboque eliminado", type: "success" });
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

  const columns: Column<Trailer>[] = [
    {
      id: "plateNumber",
      header: "Matrícula",
      sortable: true,
      sortKey: "plateNumber",
      cell: (trailer) => (
        <span className="font-mono text-sm font-medium text-slate-900 dark:text-white">
          {trailer.plateNumber}
        </span>
      ),
    },
    {
      id: "brand",
      header: "Marca",
      sortable: true,
      sortKey: "brand",
      cell: (trailer) => trailer.brand ?? "—",
    },
    {
      id: "model",
      header: "Modelo / Tipo",
      sortable: true,
      sortKey: "model",
      cell: (trailer) => trailer.model ?? "—",
    },
    {
      id: "truck",
      header: "Camião",
      cell: (trailer) => trailer.truck?.plateNumber ?? "—",
    },
    {
      id: "tonnage",
      header: "Tonelagem",
      sortable: true,
      sortKey: "tonnage",
      cell: (trailer) => (trailer.tonnage ? `${trailer.tonnage} t` : "—"),
    },
    {
      id: "status",
      header: "Estado",
      sortable: true,
      sortKey: "status",
      cell: (trailer) => {
        const meta = truckStatusMeta[trailer.status];
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      id: "updatedAt",
      header: "Atualização",
      cell: (trailer) => formatDateTime(trailer.updatedAt),
    },
  ];

  const hideableColumns = [
    { id: "brand", label: "Marca" },
    { id: "model", label: "Modelo / Tipo" },
    { id: "truck", label: "Camião" },
    { id: "updatedAt", label: "Atualização" },
  ];

  function buildActions(trailer: Trailer): ActionItem[] {
    const items: ActionItem[] = [
      {
        label: "Detalhes",
        icon: Eye,
        tone: "info",
        onSelect: () => setDetailsTrailer(trailer),
      },
    ];

    if (trailer.status === "ON_TRIP") {
      return items;
    }

    if (trailer.status !== "INACTIVE") {
      items.push({
        label: "Editar",
        icon: Pencil,
        tone: "warning",
        onSelect: () => openEdit(trailer),
      });
    }

    if (trailer.status === "MAINTENANCE") {
      items.push({
        label: "Marcar disponível",
        icon: CircleCheck,
        tone: "success",
        onSelect: () =>
          runStatusAction(trailer, "available", "Reboque disponível"),
      });
    }

    if (trailer.status === "AVAILABLE") {
      items.push({
        label: "Enviar p/ manutenção",
        icon: Wrench,
        tone: "warning",
        onSelect: () =>
          runStatusAction(trailer, "maintenance", "Reboque em manutenção"),
      });
    }

    if (trailer.status === "AVAILABLE" || trailer.status === "MAINTENANCE") {
      items.push({
        label: "Desativar",
        icon: PowerOff,
        tone: "muted",
        onSelect: () =>
          runStatusAction(trailer, "deactivate", "Reboque desativado"),
      });
    }

    if (trailer.status !== "INACTIVE") {
      items.push({
        label: "Eliminar",
        icon: Trash2,
        tone: "danger",
        separatorBefore: true,
        onSelect: () => setDeleteTarget(trailer),
      });
    }

    return items;
  }

  return (
    <>
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
          Novo Reboque
        </Button>
      </div>

      <div className="mt-4 flex flex-col gap-4">
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

        <DataTable<Trailer>
          columns={columns}
          rows={rows}
          getRowKey={(trailer) => trailer.id}
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
          renderActions={(trailer) => (
            <ActionMenu items={buildActions(trailer)} />
          )}
        />
      </div>

      <Modal
        open={detailsTrailer !== null}
        title={detailsTrailer?.plateNumber ?? "Reboque"}
        description={detailsTrailer ? shortCode(detailsTrailer.id) : undefined}
        onClose={() => setDetailsTrailer(null)}
      >
        {detailsTrailer ? (
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailRow label="Marca" value={detailsTrailer.brand} />
            <DetailRow label="Modelo / Tipo" value={detailsTrailer.model} />
            <DetailRow
              label="Camião associado"
              value={detailsTrailer.truck?.plateNumber}
            />
            <DetailRow
              label="Ano"
              value={detailsTrailer.year ? String(detailsTrailer.year) : null}
            />
            <DetailRow
              label="Tonelagem"
              value={detailsTrailer.tonnage ? `${detailsTrailer.tonnage} t` : null}
            />
            <DetailRow
              label="Estado"
              value={truckStatusMeta[detailsTrailer.status].label}
            />
            <DetailRow
              label="Data de cadastro"
              value={formatDateTime(detailsTrailer.createdAt)}
            />
            <DetailRow
              label="Última atualização"
              value={formatDateTime(detailsTrailer.updatedAt)}
            />
          </dl>
        ) : null}
      </Modal>

      <TrailerFormModal
        open={formOpen}
        trailer={formTrailer}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Eliminar reboque"
        description={
          deleteTarget
            ? `Tem a certeza que pretende eliminar “${deleteTarget.plateNumber}”? Esta ação desativa o registo.`
            : undefined
        }
        confirmLabel="Eliminar"
        tone="danger"
        loading={deleteTrailer.isPending}
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
