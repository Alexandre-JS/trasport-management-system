"use client";

import { Eye, FileSpreadsheet, Pencil, Plus, Power, RefreshCw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { ClientFormModal } from "@/components/clients/client-form-modal";
import { ActionMenu } from "@/components/ui/action-menu";
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
import { useClients, useDeleteClient, useSetClientActive } from "@/hooks/use-clients";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useToast } from "@/providers/toast-provider";
import { extractErrorMessage } from "@/services/http";
import type { SortOrder } from "@/types/api";
import type { Client, ClientSortBy, ListClientsParams } from "@/types/client";
import { exportToCsv } from "@/utils/export-csv";
import { formatDate, formatDateTime, shortCode } from "@/utils/format";

type StatusFilter = "all" | "active" | "inactive";

const statusOptions = [
  { label: "Todos os estados", value: "all" },
  { label: "Ativos", value: "active" },
  { label: "Inativos", value: "inactive" },
];

const initialHiddenColumns = new Set<string>(["updatedAt"]);

type ClientsViewProps = {
  showHeader?: boolean;
};

export function ClientsView({ showHeader = true }: ClientsViewProps = {}) {
  const { toast } = useToast();

  const [searchInput, setSearchInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<ClientSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [hiddenColumns, setHiddenColumns] =
    useState<Set<string>>(initialHiddenColumns);
  const [detailsClient, setDetailsClient] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [formClient, setFormClient] = useState<Client | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  function openCreate() {
    setFormClient(null);
    setFormOpen(true);
  }

  function openEdit(client: Client) {
    setFormClient(client);
    setFormOpen(true);
  }

  const search = useDebouncedValue(searchInput, 350);
  const city = useDebouncedValue(cityInput, 350);

  const params = useMemo<ListClientsParams>(
    () => ({
      page,
      limit,
      sortBy,
      sortOrder,
      search: search.trim() || undefined,
      city: city.trim() || undefined,
      isActive: status === "all" ? undefined : status === "active",
    }),
    [page, limit, sortBy, sortOrder, search, city, status],
  );

  const { data, isLoading, isError, error, isFetching, refetch } =
    useClients(params);
  const deleteClient = useDeleteClient();
  const setClientActive = useSetClientActive();

  const rows = data?.data ?? [];
  const meta = data?.meta;

  function resetToFirstPage() {
    setPage(1);
    setSelectedKeys(new Set());
  }

  function handleSort(sortKey: string) {
    const key = sortKey as ClientSortBy;

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
    setSelectedKeys(() => {
      if (!checked) {
        return new Set();
      }

      return new Set(rows.map((row) => row.id));
    });
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

    exportToCsv("clientes.csv", rows, [
      { header: "Código", value: (row) => shortCode(row.id) },
      { header: "Empresa", value: (row) => row.companyName },
      { header: "Contacto", value: (row) => row.contactName ?? "" },
      { header: "Telefone", value: (row) => row.phone ?? "" },
      { header: "Email", value: (row) => row.email ?? "" },
      { header: "Cidade", value: (row) => row.city ?? "" },
      { header: "Província", value: (row) => row.province ?? "" },
      { header: "Estado", value: (row) => (row.isActive ? "Ativo" : "Inativo") },
      { header: "Data Cadastro", value: (row) => formatDate(row.createdAt) },
    ]);

    toast({ title: "Exportação concluída", type: "success" });
  }

  function handleToggleActive(client: Client) {
    setClientActive.mutate(
      { id: client.id, active: !client.isActive },
      {
        onSuccess: () =>
          toast({
            title: client.isActive ? "Cliente desativado" : "Cliente ativado",
            type: "success",
          }),
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

    deleteClient.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast({ title: "Cliente eliminado", type: "success" });
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

  const columns: Column<Client>[] = [
    {
      id: "code",
      header: "Código",
      cell: (client) => (
        <span className="font-mono text-xs font-medium text-slate-500 dark:text-slate-400">
          {shortCode(client.id)}
        </span>
      ),
    },
    {
      id: "companyName",
      header: "Empresa",
      sortable: true,
      sortKey: "companyName",
      cell: (client) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900 dark:text-white">
            {client.companyName}
          </span>
          {client.email ? (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {client.email}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      id: "contactName",
      header: "Contacto",
      sortable: true,
      sortKey: "contactName",
      cell: (client) => client.contactName ?? "—",
    },
    {
      id: "phone",
      header: "Telefone",
      cell: (client) => client.phone ?? "—",
    },
    {
      id: "city",
      header: "Cidade",
      cell: (client) => client.city ?? "—",
    },
    {
      id: "isActive",
      header: "Estado",
      cell: (client) => (
        <Badge tone={client.isActive ? "green" : "slate"}>
          {client.isActive ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
    {
      id: "createdAt",
      header: "Data Cadastro",
      sortable: true,
      sortKey: "createdAt",
      cell: (client) => formatDate(client.createdAt),
    },
    {
      id: "updatedAt",
      header: "Atualização",
      cell: (client) => formatDateTime(client.updatedAt),
    },
  ];

  const hideableColumns = [
    { id: "contactName", label: "Contacto" },
    { id: "phone", label: "Telefone" },
    { id: "city", label: "Cidade" },
    { id: "updatedAt", label: "Atualização" },
  ];

  return (
    <>
      {showHeader ? (
        <PageHeader
          title="Clientes"
          description="Gestão dos clientes associados às cargas transportadas."
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
                Novo Cliente
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
            Novo Cliente
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
            placeholder="Pesquisar por empresa, contacto ou email..."
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
              options={statusOptions}
              className="w-40"
            />
            <SearchBar
              value={cityInput}
              onChange={(value) => {
                setCityInput(value);
                resetToFirstPage();
              }}
              placeholder="Cidade"
              className="w-40"
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

        <DataTable<Client>
          columns={columns}
          rows={rows}
          getRowKey={(client) => client.id}
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
          renderActions={(client) => (
              <ActionMenu
                items={[
                  {
                    label: "Detalhes",
                    icon: Eye,
                    tone: "info",
                    onSelect: () => setDetailsClient(client),
                  },
                  {
                    label: "Editar",
                    icon: Pencil,
                    tone: "warning",
                    onSelect: () => openEdit(client),
                  },
                  {
                    label: client.isActive ? "Desativar" : "Ativar",
                    icon: Power,
                    tone: client.isActive ? "muted" : "success",
                    onSelect: () => handleToggleActive(client),
                  },
                  {
                    label: "Eliminar",
                    icon: Trash2,
                    tone: "danger",
                    separatorBefore: true,
                    onSelect: () => setDeleteTarget(client),
                  },
                ]}
              />
            )}
          />
      </div>

      <Modal
        open={detailsClient !== null}
        size="lg"
        title={detailsClient?.companyName ?? "Cliente"}
        description={detailsClient ? shortCode(detailsClient.id) : undefined}
        onClose={() => setDetailsClient(null)}
      >
        {detailsClient ? (
          <dl className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <DetailRow label="Contacto" value={detailsClient.contactName} />
            <DetailRow label="NUIT" value={detailsClient.nuit} />
            <DetailRow label="Telefone" value={detailsClient.phone} />
            <DetailRow label="Email" value={detailsClient.email} />
            <DetailRow label="Endereço" value={detailsClient.address} />
            <DetailRow label="Cidade" value={detailsClient.city} />
            <DetailRow label="Província" value={detailsClient.province} />
            <DetailRow label="País" value={detailsClient.country} />
            <DetailRow
              label="Estado"
              value={detailsClient.isActive ? "Ativo" : "Inativo"}
            />
            <DetailRow
              label="Data de cadastro"
              value={formatDateTime(detailsClient.createdAt)}
            />
          </dl>
        ) : null}
      </Modal>

      <ClientFormModal
        open={formOpen}
        client={formClient}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Eliminar cliente"
        description={
          deleteTarget
            ? `Tem a certeza que pretende eliminar “${deleteTarget.companyName}”? Esta ação desativa o registo.`
            : undefined
        }
        confirmLabel="Eliminar"
        tone="danger"
        loading={deleteClient.isPending}
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
