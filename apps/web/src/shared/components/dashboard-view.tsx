"use client";

import type { EChartsOption } from "echarts";
import { AlertTriangle, Truck } from "lucide-react";
import type { ReactNode } from "react";
import { EChartsPanel } from "@/components/ui/echarts-panel";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/src/shared/components/page-header";
import { StatusBadge } from "@/src/shared/components/status-badge";
import { useCargo } from "@/hooks/use-cargo";
import { useDrivers } from "@/hooks/use-drivers";
import { useIncidents } from "@/hooks/use-incidents";
import { useTrailers } from "@/hooks/use-trailers";
import { useTrips } from "@/hooks/use-trips";
import { useTrucks } from "@/hooks/use-trucks";
import type { Cargo, CargoStatus } from "@/types/cargo";
import type { DashboardMetric } from "@/types/dashboard";
import type { DriverStatus } from "@/types/driver";
import type { IncidentType } from "@/types/incident";
import type { TripStatus } from "@/types/trip";
import type { TruckStatus } from "@/types/truck";
import { cargoStatusBadgeTone, cargoStatusMeta } from "@/utils/cargo-status";
import { formatDateTime, formatWeight } from "@/utils/format";
import { incidentTypeMeta } from "@/utils/incident-type";
import { tripStatusMeta } from "@/utils/trip-status";
import { truckStatusMeta } from "@/utils/truck-status";

const cargoStatuses: CargoStatus[] = [
  "CREATED",
  "WAITING_PICKUP",
  "PICKED_UP",
  "IN_TRANSIT",
  "NEAR_DESTINATION",
  "DELIVERED",
  "CANCELLED",
  "INCIDENT",
];

const tripStatuses: TripStatus[] = [
  "WAITING_APPOINTMENT",
  "APPOINTMENT_DONE",
  "LOADED",
  "DISPATCHED_ORIGIN",
  "AT_BORDER",
  "BORDER_CLEARED",
  "ARRIVED",
  "DISCHARGED",
  "CANCELLED",
];

const fleetStatuses: TruckStatus[] = [
  "AVAILABLE",
  "ON_TRIP",
  "MAINTENANCE",
  "INACTIVE",
];

const driverStatuses: DriverStatus[] = [
  "AVAILABLE",
  "ON_TRIP",
  "OFFLINE",
  "INACTIVE",
];

const incidentTypes: IncidentType[] = [
  "ACCIDENT",
  "BREAKDOWN",
  "TRAFFIC",
  "ROAD_BLOCKED",
  "OTHER",
];

const chartColors = [
  "#1e50ab",
  "#2f65c4",
  "#5183d6",
  "#059669",
  "#d97706",
  "#dc2626",
  "#64748b",
  "#7c3aed",
];

function total(query: { data?: { meta: { total: number } } }) {
  return query.data?.meta.total ?? 0;
}

export function DashboardView() {
  const cargoTotal = useCargo({ page: 1, limit: 1 });
  const recentCargo = useCargo({
    page: 1,
    limit: 6,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const cargoByStatus = {
    CREATED: useCargo({ page: 1, limit: 1, status: "CREATED" }),
    WAITING_PICKUP: useCargo({ page: 1, limit: 1, status: "WAITING_PICKUP" }),
    PICKED_UP: useCargo({ page: 1, limit: 1, status: "PICKED_UP" }),
    IN_TRANSIT: useCargo({ page: 1, limit: 1, status: "IN_TRANSIT" }),
    NEAR_DESTINATION: useCargo({
      page: 1,
      limit: 1,
      status: "NEAR_DESTINATION",
    }),
    DELIVERED: useCargo({ page: 1, limit: 1, status: "DELIVERED" }),
    CANCELLED: useCargo({ page: 1, limit: 1, status: "CANCELLED" }),
    INCIDENT: useCargo({ page: 1, limit: 1, status: "INCIDENT" }),
  } satisfies Record<CargoStatus, ReturnType<typeof useCargo>>;

  const tripByStatus = {
    WAITING_APPOINTMENT: useTrips({
      page: 1,
      limit: 1,
      currentStatus: "WAITING_APPOINTMENT",
    }),
    APPOINTMENT_DONE: useTrips({
      page: 1,
      limit: 1,
      currentStatus: "APPOINTMENT_DONE",
    }),
    LOADED: useTrips({ page: 1, limit: 1, currentStatus: "LOADED" }),
    DISPATCHED_ORIGIN: useTrips({
      page: 1,
      limit: 1,
      currentStatus: "DISPATCHED_ORIGIN",
    }),
    AT_BORDER: useTrips({ page: 1, limit: 1, currentStatus: "AT_BORDER" }),
    BORDER_CLEARED: useTrips({
      page: 1,
      limit: 1,
      currentStatus: "BORDER_CLEARED",
    }),
    ARRIVED: useTrips({ page: 1, limit: 1, currentStatus: "ARRIVED" }),
    DISCHARGED: useTrips({ page: 1, limit: 1, currentStatus: "DISCHARGED" }),
    CANCELLED: useTrips({ page: 1, limit: 1, currentStatus: "CANCELLED" }),
  } satisfies Record<TripStatus, ReturnType<typeof useTrips>>;

  const drivers = {
    AVAILABLE: useDrivers({ page: 1, limit: 1, status: "AVAILABLE" }),
    ON_TRIP: useDrivers({ page: 1, limit: 1, status: "ON_TRIP" }),
    OFFLINE: useDrivers({ page: 1, limit: 1, status: "OFFLINE" }),
    INACTIVE: useDrivers({ page: 1, limit: 1, status: "INACTIVE" }),
  } satisfies Record<DriverStatus, ReturnType<typeof useDrivers>>;

  const trucks = {
    AVAILABLE: useTrucks({ page: 1, limit: 1, status: "AVAILABLE" }),
    ON_TRIP: useTrucks({ page: 1, limit: 1, status: "ON_TRIP" }),
    MAINTENANCE: useTrucks({ page: 1, limit: 1, status: "MAINTENANCE" }),
    INACTIVE: useTrucks({ page: 1, limit: 1, status: "INACTIVE" }),
  } satisfies Record<TruckStatus, ReturnType<typeof useTrucks>>;

  const trailers = {
    AVAILABLE: useTrailers({ page: 1, limit: 1, status: "AVAILABLE" }),
    ON_TRIP: useTrailers({ page: 1, limit: 1, status: "ON_TRIP" }),
    MAINTENANCE: useTrailers({ page: 1, limit: 1, status: "MAINTENANCE" }),
    INACTIVE: useTrailers({ page: 1, limit: 1, status: "INACTIVE" }),
  } satisfies Record<TruckStatus, ReturnType<typeof useTrailers>>;

  const incidentsOpen = useIncidents({ page: 1, limit: 1, resolved: false });
  const incidentsResolved = useIncidents({ page: 1, limit: 1, resolved: true });
  const incidentsByType = {
    ACCIDENT: useIncidents({ page: 1, limit: 1, type: "ACCIDENT" }),
    BREAKDOWN: useIncidents({ page: 1, limit: 1, type: "BREAKDOWN" }),
    TRAFFIC: useIncidents({ page: 1, limit: 1, type: "TRAFFIC" }),
    ROAD_BLOCKED: useIncidents({ page: 1, limit: 1, type: "ROAD_BLOCKED" }),
    OTHER: useIncidents({ page: 1, limit: 1, type: "OTHER" }),
  } satisfies Record<IncidentType, ReturnType<typeof useIncidents>>;

  const metrics: DashboardMetric[] = [
    {
      label: "Cargas registadas",
      value: String(total(cargoTotal)),
      tone: "blue",
    },
    {
      label: "Viagens ativas",
      value: String(
        tripStatuses
          .filter((status) => status !== "DISCHARGED" && status !== "CANCELLED")
          .reduce((sum, status) => sum + total(tripByStatus[status]), 0),
      ),
      tone: "green",
    },
    {
      label: "Horses disponíveis",
      value: String(total(trucks.AVAILABLE)),
      tone: "slate",
    },
    {
      label: "Incidentes abertos",
      value: String(total(incidentsOpen)),
      tone: "amber",
    },
  ];

  const cargoStatusOption: EChartsOption = {
    color: chartColors,
    tooltip: { trigger: "item" as const },
    legend: { bottom: 0, type: "scroll" as const },
    series: [
      {
        type: "pie" as const,
        radius: ["45%", "70%"],
        center: ["50%", "42%"],
        data: cargoStatuses.map((status) => ({
          name: cargoStatusMeta[status].label,
          value: total(cargoByStatus[status]),
        })),
      },
    ],
  };

  const tripStatusOption: EChartsOption = {
    color: ["#1e50ab"],
    tooltip: { trigger: "axis" as const },
    grid: { left: 40, right: 16, top: 24, bottom: 72 },
    xAxis: {
      type: "category" as const,
      axisLabel: { rotate: 35 },
      data: tripStatuses.map((status) => tripStatusMeta[status].label),
    },
    yAxis: { type: "value" as const, minInterval: 1 },
    series: [
      {
        type: "bar" as const,
        barMaxWidth: 34,
        data: tripStatuses.map((status) => total(tripByStatus[status])),
      },
    ],
  };

  const fleetOption: EChartsOption = {
    color: ["#1e50ab", "#059669"],
    tooltip: { trigger: "axis" as const },
    legend: { bottom: 0 },
    grid: { left: 36, right: 16, top: 28, bottom: 52 },
    xAxis: {
      type: "category" as const,
      data: fleetStatuses.map((status) => truckStatusMeta[status].label),
    },
    yAxis: { type: "value" as const, minInterval: 1 },
    series: [
      {
        name: "Horses",
        type: "bar" as const,
        data: fleetStatuses.map((status) => total(trucks[status])),
      },
      {
        name: "Trailers",
        type: "bar" as const,
        data: fleetStatuses.map((status) => total(trailers[status])),
      },
    ],
  };

  const incidentsOption: EChartsOption = {
    color: ["#dc2626", "#d97706", "#1e50ab", "#7c3aed", "#64748b"],
    tooltip: { trigger: "item" as const },
    legend: { bottom: 0, type: "scroll" as const },
    series: [
      {
        type: "pie" as const,
        radius: "66%",
        center: ["50%", "42%"],
        data: incidentTypes.map((type) => ({
          name: incidentTypeMeta[type].label,
          value: total(incidentsByType[type]),
        })),
      },
    ],
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Dashboard"
        description="Visão geral da operação com dados reais do sistema."
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <StatCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <EChartsPanel
          title="Cargas por estado"
          description="Distribuição operacional das cargas registadas."
          option={cargoStatusOption}
        />
        <EChartsPanel
          title="Viagens por etapa"
          description="Estado atual do fluxo de transporte."
          option={tripStatusOption}
        />
        <EChartsPanel
          title="Disponibilidade da frota"
          description="Comparativo entre horses e trailers."
          option={fleetOption}
        />
        <EChartsPanel
          title="Incidentes por tipo"
          description={`${total(incidentsOpen)} abertos · ${total(incidentsResolved)} resolvidos`}
          option={incidentsOption}
        />
      </div>

      <section className="rounded-md border border-brand-100 bg-white shadow-sm dark:border-brand-950 dark:bg-slate-950">
        <div className="border-b border-brand-100 px-4 py-3 dark:border-brand-950">
          <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
            Cargas recentes
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-brand-50 text-left text-xs font-semibold uppercase text-brand-700 dark:bg-brand-950/50 dark:text-brand-200">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Rota</th>
                <th className="px-4 py-3">Peso</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Atualização</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(recentCargo.data?.data ?? []).map((cargo: Cargo) => (
                <tr key={cargo.id}>
                  <td className="px-4 py-3 font-mono text-xs font-medium text-slate-900 dark:text-slate-100">
                    {cargo.code}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {cargo.client.companyName}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {cargo.origin} → {cargo.destination}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {formatWeight(cargo.weightTonnes)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={cargoStatusBadgeTone[cargo.status]}>
                      {cargoStatusMeta[cargo.status].label}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {formatDateTime(cargo.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <SmallSummary
          icon={<Truck className="size-4" aria-hidden />}
          title="Motoristas"
          rows={driverStatuses.map((status) => ({
            label:
              status === "AVAILABLE"
                ? "Disponíveis"
                : status === "ON_TRIP"
                  ? "Em viagem"
                  : status === "OFFLINE"
                    ? "Offline"
                    : "Inativos",
            value: total(drivers[status]),
          }))}
        />
        <SmallSummary
          icon={<AlertTriangle className="size-4" aria-hidden />}
          title="Incidentes"
          rows={[
            { label: "Abertos", value: total(incidentsOpen) },
            { label: "Resolvidos", value: total(incidentsResolved) },
          ]}
        />
      </div>
    </div>
  );
}

function SmallSummary({
  icon,
  title,
  rows,
}: {
  icon: ReactNode;
  title: string;
  rows: Array<{ label: string; value: number }>;
}) {
  return (
    <section className="rounded-md border border-brand-100 bg-white p-4 shadow-sm dark:border-brand-950 dark:bg-slate-950">
      <div className="mb-3 flex items-center gap-2 text-brand-700 dark:text-brand-200">
        {icon}
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {row.label}
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
              {row.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
