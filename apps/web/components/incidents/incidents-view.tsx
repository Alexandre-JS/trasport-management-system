"use client";

import { CheckCircle2, Download, Eye, RefreshCw } from "lucide-react";
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
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import { useIncidents, useResolveIncident } from "@/hooks/use-incidents";
import { useToast } from "@/providers/toast-provider";
import { extractErrorMessage } from "@/services/http";
import type { DashboardMetric } from "@/types/dashboard";
import type { SortOrder } from "@/types/api";
import type {
  Incident,
  IncidentSortBy,
  IncidentType,
  ListIncidentsParams,
} from "@/types/incident";
import { exportToCsv } from "@/utils/export-csv";
import { formatDateTime } from "@/utils/format";
import {
  incidentStateOptions,
  incidentTypeMeta,
  incidentTypeOptions,
} from "@/utils/incident-type";

type TypeFilter = "all" | IncidentType;
type StateFilter = "all" | "open" | "resolved";

const initialHiddenColumns = new Set<string>([]);

function formatLocation(
  latitude: string | null,
  longitude: string | null,
): string {
  if (!latitude || !longitude) {
    return "—";
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return "—";
  }

  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export function IncidentsView() {
  const { toast } = useToast();

  const [type, setType] = useState<TypeFilter>("all");
  const [state, setState] = useState<StateFilter>("all");
  const [sortBy, setSortBy] = useState<IncidentSortBy>("reportedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [hiddenColumns, setHiddenColumns] =
    useState<Set<string>>(initialHiddenColumns);
  const [detailsIncident, setDetailsIncident] = useState<Incident | null>(null);
  const [resolveTarget, setResolveTarget] = useState<Incident | null>(null);

  const params = useMemo<ListIncidentsParams>(
    () => ({
      page,
      limit,
      sortBy,
      sortOrder,
      type: type === "all" ? undefined : type,
      resolved: state === "all" ? undefined : state === "resolved",
    }),
    [page, limit, sortBy, sortOrder, type, state],
  );

  const summaryBaseParams = useMemo<ListIncidentsParams>(
    () => ({
      page: 1,
      limit: 1,
      sortBy: "reportedAt",
      sortOrder: "desc",
      type: type === "all" ? undefined : type,
    }),
    [type],
  );

  const { data, isLoading, isError, error, isFetching, refetch } =
    useIncidents(params);
  const { data: openSummary } = useIncidents({
    ...summaryBaseParams,
    resolved: false,
  });
  const { data: resolvedSummary } = useIncidents({
    ...summaryBaseParams,
    resolved: true,
  });
  const resolveIncident = useResolveIncident();

  const rows = data?.data ?? [];
  const meta = data?.meta;
  const openTotal = openSummary?.meta.total ?? 0;
  const resolvedTotal = resolvedSummary?.meta.total ?? 0;
  const reportTotal = openTotal + resolvedTotal;
  const visibleTotal = meta?.total ?? 0;
  const resolutionRate =
    reportTotal > 0 ? Math.round((resolvedTotal / reportTotal) * 100) : 0;
  const selectedTypeLabel =
    type === "all" ? "Todos os tipos" : incidentTypeMeta[type].label;
  const metrics: DashboardMetric[] = [
    {
      label: state === "all" ? "Incidentes registados" : "Resultado filtrado",
      value: String(visibleTotal),
      tone: "blue",
    },
    {
      label: "Abertos",
      value: String(openTotal),
      tone: "amber",
    },
    {
      label: "Resolvidos",
      value: String(resolvedTotal),
      tone: "green",
    },
    {
      label: `Taxa resolvida · ${selectedTypeLabel}`,
      value: `${resolutionRate}%`,
      tone: "slate",
    },
  ];

  function resetToFirstPage() {
    setPage(1);
    setSelectedKeys(new Set());
  }

  function handleSort(sortKey: string) {
    const key = sortKey as IncidentSortBy;

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

    exportToCsv("incidentes.csv", rows, [
      { header: "Tipo", value: (row) => incidentTypeMeta[row.type].label },
      { header: "Motorista", value: (row) => row.trip.driver.fullName },
      { header: "Viagem", value: (row) => row.trip.cargo.code },
      {
        header: "Local",
        value: (row) => formatLocation(row.latitude, row.longitude),
      },
      { header: "Data", value: (row) => formatDateTime(row.reportedAt) },
      {
        header: "Estado",
        value: (row) => (row.resolvedAt ? "Resolvido" : "Aberto"),
      },
      { header: "Descrição", value: (row) => row.description ?? "" },
    ]);

    toast({ title: "Exportação concluída", type: "success" });
  }

  function confirmResolve() {
    if (!resolveTarget) {
      return;
    }

    resolveIncident.mutate(resolveTarget.id, {
      onSuccess: () => {
        toast({ title: "Incidente resolvido", type: "success" });
        setResolveTarget(null);
      },
      onError: (mutationError) =>
        toast({
          title: "Não foi possível resolver",
          description: extractErrorMessage(mutationError),
          type: "error",
        }),
    });
  }

  const columns: Column<Incident>[] = [
    {
      id: "code",
      header: "Código",
      cell: (incident) => (
        <span className="font-mono text-xs font-medium text-slate-500 dark:text-slate-400">
          {incident.id.slice(0, 8).toUpperCase()}
        </span>
      ),
    },
    {
      id: "type",
      header: "Tipo",
      sortable: true,
      sortKey: "type",
      cell: (incident) => {
        const meta = incidentTypeMeta[incident.type];
        return <Badge tone={meta.tone}>{meta.label}</Badge>;
      },
    },
    {
      id: "driver",
      header: "Motorista",
      cell: (incident) => incident.trip.driver.fullName,
    },
    {
      id: "trip",
      header: "Viagem",
      cell: (incident) => (
        <span className="font-mono text-xs text-slate-900 dark:text-white">
          {incident.trip.cargo.code}
        </span>
      ),
    },
    {
      id: "location",
      header: "Local",
      cell: (incident) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
          {formatLocation(incident.latitude, incident.longitude)}
        </span>
      ),
    },
    {
      id: "reportedAt",
      header: "Data",
      sortable: true,
      sortKey: "reportedAt",
      cell: (incident) => formatDateTime(incident.reportedAt),
    },
    {
      id: "state",
      header: "Estado",
      cell: (incident) => (
        <Badge tone={incident.resolvedAt ? "green" : "red"}>
          {incident.resolvedAt ? "Resolvido" : "Aberto"}
        </Badge>
      ),
    },
  ];

  const hideableColumns = [
    { id: "driver", label: "Motorista" },
    { id: "location", label: "Local" },
  ];

  function buildActions(incident: Incident): ActionItem[] {
    const items: ActionItem[] = [
      {
        label: "Visualizar",
        icon: Eye,
        onSelect: () => setDetailsIncident(incident),
      },
    ];

    if (!incident.resolvedAt) {
      items.push({
        label: "Resolver",
        icon: CheckCircle2,
        onSelect: () => setResolveTarget(incident),
      });
    }

    return items;
  }

  return (
    <>
      <PageHeader
        title="Relatório de incidentes"
        description="Ocorrências reportadas durante as viagens, com filtros por tipo, estado e exportação para análise operacional."
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
          </>
        }
      />

      <div className="flex flex-col gap-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <StatCard key={metric.label} metric={metric} />
          ))}
        </div>

        <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-3 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-3">
            <Select
              aria-label="Filtrar por tipo"
              value={type}
              onChange={(event) => {
                setType(event.target.value as TypeFilter);
                resetToFirstPage();
              }}
              options={incidentTypeOptions}
              className="w-44"
            />
            <Select
              aria-label="Filtrar por estado"
              value={state}
              onChange={(event) => {
                setState(event.target.value as StateFilter);
                resetToFirstPage();
              }}
              options={incidentStateOptions}
              className="w-44"
            />
          </div>
          <div className="sm:ml-auto">
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

        <DataTable<Incident>
          columns={columns}
          rows={rows}
          getRowKey={(incident) => incident.id}
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
          renderActions={(incident) => (
            <ActionMenu items={buildActions(incident)} />
          )}
        />
      </div>

      <Modal
        open={detailsIncident !== null}
        title={
          detailsIncident
            ? incidentTypeMeta[detailsIncident.type].label
            : "Incidente"
        }
        description={detailsIncident?.trip.cargo.code}
        onClose={() => setDetailsIncident(null)}
      >
        {detailsIncident ? (
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailRow
              label="Motorista"
              value={detailsIncident.trip.driver.fullName}
            />
            <DetailRow label="Viagem" value={detailsIncident.trip.cargo.code} />
            <DetailRow
              label="Local"
              value={formatLocation(
                detailsIncident.latitude,
                detailsIncident.longitude,
              )}
            />
            <DetailRow
              label="Data"
              value={formatDateTime(detailsIncident.reportedAt)}
            />
            <DetailRow
              label="Estado"
              value={detailsIncident.resolvedAt ? "Resolvido" : "Aberto"}
            />
            <DetailRow
              label="Resolvido em"
              value={
                detailsIncident.resolvedAt
                  ? formatDateTime(detailsIncident.resolvedAt)
                  : "—"
              }
            />
            <DetailRow
              label="Descrição"
              value={detailsIncident.description}
            />
          </dl>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={resolveTarget !== null}
        title="Resolver incidente"
        description={
          resolveTarget
            ? `Marcar o incidente (${incidentTypeMeta[resolveTarget.type].label}) da viagem “${resolveTarget.trip.cargo.code}” como resolvido?`
            : undefined
        }
        confirmLabel="Resolver"
        cancelLabel="Voltar"
        loading={resolveIncident.isPending}
        onConfirm={confirmResolve}
        onCancel={() => setResolveTarget(null)}
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
