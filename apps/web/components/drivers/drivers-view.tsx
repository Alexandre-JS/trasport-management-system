"use client";

import {
  CircleSlash,
  FileSpreadsheet,
  Eye,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Smartphone,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { DriverAccountModal } from "@/components/drivers/driver-account-modal";
import { DriverFormModal } from "@/components/drivers/driver-form-modal";
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
import {
  useDeleteDriver,
  useDriverStatusAction,
  useDrivers,
} from "@/hooks/use-drivers";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useUser } from "@/hooks/use-users";
import { useToast } from "@/providers/toast-provider";
import { extractErrorMessage } from "@/services/http";
import type { SortOrder } from "@/types/api";
import type {
  Driver,
  DriverSortBy,
  DriverStatus,
  ListDriversParams,
} from "@/types/driver";
import { driverStatusMeta, driverStatusOptions } from "@/utils/driver-status";
import { exportToCsv } from "@/utils/export-csv";
import { formatDate, formatDateTime, shortCode } from "@/utils/format";

type StatusFilter = "all" | DriverStatus;

const initialHiddenColumns = new Set<string>(["updatedAt"]);

type DriversViewProps = {
  showHeader?: boolean;
};

export function DriversView({ showHeader = true }: DriversViewProps = {}) {
  const { toast } = useToast();

  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<DriverSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [hiddenColumns, setHiddenColumns] =
    useState<Set<string>>(initialHiddenColumns);
  const [detailsDriver, setDetailsDriver] = useState<Driver | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);
  const [formDriver, setFormDriver] = useState<Driver | null>(null);
  const [accountDriver, setAccountDriver] = useState<Driver | null>(null);
  const linkedAccount = useUser(detailsDriver?.userId ?? null);
  const [formOpen, setFormOpen] = useState(false);

  function openCreate() {
    setFormDriver(null);
    setFormOpen(true);
  }

  function openEdit(driver: Driver) {
    setFormDriver(driver);
    setFormOpen(true);
  }

  const search = useDebouncedValue(searchInput, 350);

  const params = useMemo<ListDriversParams>(
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
    useDrivers(params);
  const deleteDriver = useDeleteDriver();
  const statusAction = useDriverStatusAction();

  const rows = data?.data ?? [];
  const meta = data?.meta;

  function resetToFirstPage() {
    setPage(1);
    setSelectedKeys(new Set());
  }

  function handleSort(sortKey: string) {
    const key = sortKey as DriverSortBy;

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

    exportToCsv("motoristas.csv", rows, [
      { header: "Código", value: (row) => shortCode(row.id) },
      { header: "Nome", value: (row) => row.fullName },
      { header: "Carta", value: (row) => row.licenseNumber },
      { header: "Passaporte", value: (row) => row.passportNumber ?? "" },
      { header: "Telefone", value: (row) => row.phone ?? "" },
      { header: "Email", value: (row) => row.email ?? "" },
      { header: "Disponibilidade", value: (row) => driverStatusMeta[row.status].label },
      {
        header: "Estado",
        value: (row) => (row.status === "INACTIVE" ? "Inativo" : "Ativo"),
      },
      { header: "Data Cadastro", value: (row) => formatDate(row.createdAt) },
    ]);

    toast({ title: "Exportação concluída", type: "success" });
  }

  function runStatusAction(
    driver: Driver,
    action: "available" | "offline" | "deactivate",
    successMessage: string,
  ) {
    statusAction.mutate(
      { id: driver.id, action },
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

    deleteDriver.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast({ title: "Motorista eliminado", type: "success" });
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

  const columns: Column<Driver>[] = [
    {
      id: "code",
      header: "Código",
      cell: (driver) => (
        <span className="font-mono text-xs font-medium text-slate-500 dark:text-slate-400">
          {shortCode(driver.id)}
        </span>
      ),
    },
    {
      id: "fullName",
      header: "Nome",
      sortable: true,
      sortKey: "fullName",
      cell: (driver) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900 dark:text-white">
            {driver.fullName}
          </span>
          {driver.email ? (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {driver.email}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      id: "licenseNumber",
      header: "Carta",
      sortable: true,
      sortKey: "licenseNumber",
      cell: (driver) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
          {driver.licenseNumber}
        </span>
      ),
    },
    {
      id: "phone",
      header: "Telefone",
      cell: (driver) => driver.phone ?? "—",
    },
    {
      id: "estado",
      header: "Estado",
      cell: (driver) => (
        <Badge tone={driver.status === "INACTIVE" ? "red" : "green"}>
          {driver.status === "INACTIVE" ? "Inativo" : "Ativo"}
        </Badge>
      ),
    },
    {
      id: "status",
      header: "Disponibilidade",
      sortable: true,
      sortKey: "status",
      cell: (driver) => {
        const meta = driverStatusMeta[driver.status];
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      id: "lastTrip",
      header: "Última Viagem",
      cell: () => (
        <span className="text-slate-400 dark:text-slate-500">—</span>
      ),
    },
    {
      id: "updatedAt",
      header: "Atualização",
      cell: (driver) => formatDateTime(driver.updatedAt),
    },
  ];

  const hideableColumns = [
    { id: "phone", label: "Telefone" },
    { id: "lastTrip", label: "Última Viagem" },
    { id: "updatedAt", label: "Atualização" },
  ];

  function buildActions(driver: Driver): ActionItem[] {
    const items: ActionItem[] = [
      {
        label: "Detalhes",
        icon: Eye,
        tone: "info",
        onSelect: () => setDetailsDriver(driver),
      },
      {
        label: "Editar",
        icon: Pencil,
        tone: "warning",
        onSelect: () => openEdit(driver),
      },
    ];

    if (!driver.userId) {
      items.push({
        label: "Dar acesso mobile",
        icon: Smartphone,
        tone: "default",
        onSelect: () => setAccountDriver(driver),
      });
    }

    if (driver.status !== "AVAILABLE" && driver.status !== "INACTIVE") {
      items.push({
        label: "Marcar disponível",
        icon: Power,
        tone: "success",
        onSelect: () =>
          runStatusAction(driver, "available", "Motorista disponível"),
      });
    }

    if (driver.status === "AVAILABLE") {
      items.push({
        label: "Marcar offline",
        icon: CircleSlash,
        tone: "muted",
        onSelect: () =>
          runStatusAction(driver, "offline", "Motorista offline"),
      });
    }

    if (driver.status !== "INACTIVE") {
      items.push({
        label: "Desativar",
        icon: CircleSlash,
        tone: "muted",
        onSelect: () =>
          runStatusAction(driver, "deactivate", "Motorista desativado"),
      });
    }

    items.push({
      label: "Eliminar",
      icon: Trash2,
      tone: "danger",
      separatorBefore: true,
      onSelect: () => setDeleteTarget(driver),
    });

    return items;
  }

  return (
    <>
      {showHeader ? (
        <PageHeader
          title="Motoristas"
          description="Gestão dos motoristas, disponibilidade e estado operacional."
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                icon={<RefreshCw className="size-4" />}
                onClick={() => refetch()}
                loading={isFetching}
              >
                Atualizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                icon={<FileSpreadsheet className="size-4" />}
                onClick={handleExport}
              >
                Exportar para Excel
              </Button>
              <Button
                size="sm"
                className="h-9"
                icon={<Plus className="size-4" />}
                onClick={openCreate}
              >
                Novo Motorista
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
            className="h-9"
            icon={<RefreshCw className="size-4" />}
            onClick={() => refetch()}
            loading={isFetching}
          >
            Atualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            icon={<FileSpreadsheet className="size-4" />}
            onClick={handleExport}
          >
            Exportar para Excel
          </Button>
          <Button
            size="sm"
            className="h-9"
            icon={<Plus className="size-4" />}
            onClick={openCreate}
          >
            Novo Motorista
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
            placeholder="Pesquisar por nome, carta ou email..."
            className="sm:max-w-sm sm:flex-1"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Select
              aria-label="Filtrar por disponibilidade"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as StatusFilter);
                resetToFirstPage();
              }}
              options={driverStatusOptions}
              className="w-52"
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

        <DataTable<Driver>
          columns={columns}
          rows={rows}
          getRowKey={(driver) => driver.id}
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
          renderActions={(driver) => <ActionMenu items={buildActions(driver)} />}
        />
      </div>

      <Modal
        open={detailsDriver !== null}
        size="lg"
        title={detailsDriver?.fullName ?? "Motorista"}
        description={detailsDriver ? shortCode(detailsDriver.id) : undefined}
        onClose={() => setDetailsDriver(null)}
      >
        {detailsDriver ? (
          <dl className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <DetailRow label="Carta de condução" value={detailsDriver.licenseNumber} />
            <DetailRow label="Passaporte" value={detailsDriver.passportNumber} />
            <DetailRow label="Telefone" value={detailsDriver.phone} />
            <DetailRow label="Email" value={detailsDriver.email} />
            <DetailRow
              label="Disponibilidade"
              value={driverStatusMeta[detailsDriver.status].label}
            />
            <DetailRow
              label="Estado"
              value={detailsDriver.status === "INACTIVE" ? "Inativo" : "Ativo"}
            />
            <DetailRow
              label="Conta de acesso mobile"
              value={
                detailsDriver.userId
                  ? (linkedAccount.data?.email ?? "Associada")
                  : "Sem conta"
              }
            />
            <DetailRow
              label="Data de cadastro"
              value={formatDateTime(detailsDriver.createdAt)}
            />
            <DetailRow
              label="Última atualização"
              value={formatDateTime(detailsDriver.updatedAt)}
            />
          </dl>
        ) : null}
        {detailsDriver && !detailsDriver.userId ? (
          <div className="mt-4 flex justify-end">
            <Button
              size="sm"
              icon={<Smartphone className="size-4" />}
              onClick={() => {
                setAccountDriver(detailsDriver);
                setDetailsDriver(null);
              }}
            >
              Dar acesso mobile
            </Button>
          </div>
        ) : null}
      </Modal>

      <DriverAccountModal
        driver={accountDriver}
        onClose={() => setAccountDriver(null)}
      />

      <DriverFormModal
        open={formOpen}
        driver={formDriver}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Eliminar motorista"
        description={
          deleteTarget
            ? `Tem a certeza que pretende eliminar “${deleteTarget.fullName}”? Esta ação desativa o registo.`
            : undefined
        }
        confirmLabel="Eliminar"
        tone="danger"
        loading={deleteDriver.isPending}
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
