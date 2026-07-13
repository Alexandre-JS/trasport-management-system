"use client";

import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { BorderFormModal } from "@/components/borders/border-form-modal";
import { ActionMenu, type ActionItem } from "@/components/ui/action-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { type Column, DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { SearchBar } from "@/components/ui/search-bar";
import { Select } from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useBorders, useDeleteBorder } from "@/hooks/use-borders";
import { useToast } from "@/providers/toast-provider";
import { extractErrorMessage } from "@/services/http";
import type { SortOrder } from "@/types/api";
import type { Border, BorderSortBy, ListBordersParams } from "@/types/border";

type ActiveFilter = "all" | "active" | "inactive";

const activeFilterOptions = [
  { label: "Todas", value: "all" },
  { label: "Ativas", value: "active" },
  { label: "Inativas", value: "inactive" },
];

export function BordersView() {
  const { toast } = useToast();

  const [searchInput, setSearchInput] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [sortBy, setSortBy] = useState<BorderSortBy>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState<Border | null>(null);
  const [formBorder, setFormBorder] = useState<Border | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const search = useDebouncedValue(searchInput, 350);

  const params = useMemo<ListBordersParams>(
    () => ({
      page,
      limit,
      sortBy,
      sortOrder,
      search: search.trim() || undefined,
      active:
        activeFilter === "all" ? undefined : activeFilter === "active",
    }),
    [page, limit, sortBy, sortOrder, search, activeFilter],
  );

  const { data, isLoading, isError, error, isFetching, refetch } =
    useBorders(params);
  const deleteBorder = useDeleteBorder();

  const rows = data?.data ?? [];
  const meta = data?.meta;

  function handleSort(sortKey: string) {
    const key = sortKey as BorderSortBy;

    if (sortBy === key) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }

    setPage(1);
  }

  function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    deleteBorder.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast({ title: "Fronteira eliminada", type: "success" });
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

  const columns: Column<Border>[] = [
    {
      id: "name",
      header: "Posto fronteiriço",
      sortable: true,
      sortKey: "name",
      cell: (border) => (
        <span className="text-sm font-medium text-slate-900 dark:text-white">
          {border.name}
        </span>
      ),
    },
    {
      id: "countries",
      header: "Liga",
      cell: (border) => `${border.countryA} — ${border.countryB}`,
    },
    {
      id: "coordinates",
      header: "Coordenadas",
      cell: (border) =>
        border.lat && border.lng ? (
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
            {Number(border.lat).toFixed(4)}, {Number(border.lng).toFixed(4)}
          </span>
        ) : (
          "—"
        ),
    },
    {
      id: "isActive",
      header: "Estado",
      cell: (border) => (
        <Badge tone={border.isActive ? "green" : "slate"}>
          {border.isActive ? "Ativa" : "Inativa"}
        </Badge>
      ),
    },
  ];

  function buildActions(border: Border): ActionItem[] {
    return [
      {
        label: "Editar",
        icon: Pencil,
        tone: "warning",
        onSelect: () => {
          setFormBorder(border);
          setFormOpen(true);
        },
      },
      {
        label: "Eliminar",
        icon: Trash2,
        tone: "danger",
        separatorBefore: true,
        onSelect: () => setDeleteTarget(border),
      },
    ];
  }

  return (
    <>
      <PageHeader
        title="Fronteiras"
        description="Postos fronteiriços usados nas rotas das viagens."
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
              size="sm"
              icon={<Plus className="size-4" />}
              onClick={() => {
                setFormBorder(null);
                setFormOpen(true);
              }}
            >
              Nova Fronteira
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
              setPage(1);
            }}
            placeholder="Pesquisar por nome ou país..."
            className="sm:max-w-sm sm:flex-1"
          />
          <Select
            aria-label="Filtrar por estado"
            value={activeFilter}
            onChange={(event) => {
              setActiveFilter(event.target.value as ActiveFilter);
              setPage(1);
            }}
            options={activeFilterOptions}
            className="w-40"
          />
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

        <DataTable<Border>
          columns={columns}
          rows={rows}
          getRowKey={(border) => border.id}
          loading={isLoading}
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
                  setPage(1);
                }}
              />
            ) : null
          }
          renderActions={(border) => <ActionMenu items={buildActions(border)} />}
        />
      </div>

      <BorderFormModal
        open={formOpen}
        border={formBorder}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Eliminar fronteira"
        description={
          deleteTarget
            ? `Tem a certeza que pretende eliminar “${deleteTarget.name}”? Viagens já registadas mantêm o histórico.`
            : undefined
        }
        confirmLabel="Eliminar"
        tone="danger"
        loading={deleteBorder.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
