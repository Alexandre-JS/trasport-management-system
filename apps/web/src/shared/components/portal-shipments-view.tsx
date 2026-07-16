"use client";

import { ArrowRight, MapPin, PackageSearch } from "lucide-react";
import Link from "next/link";
import { ErrorState } from "@/src/shared/components/error-state";
import { PageLoader } from "@/src/shared/components/page-loader";
import { StatusBadge } from "@/src/shared/components/status-badge";
import { useAuth } from "@/src/shared/hooks/use-auth";
import { useMyShipments } from "@/hooks/use-portal";
import type { PortalShipment } from "@/types/portal";
import { formatDate } from "@/utils/format";
import { tripStatusBadgeTone, tripStatusMeta } from "@/utils/trip-status";

// Alinhado ao Quadro Operacional: mostra os dados na linguagem da folha do
// cliente (Horse, Motorista, Border), sem documentos internos do motorista.
function horseOf(s: PortalShipment) {
  return s.horsePlate ?? s.truck?.plateNumber ?? "—";
}
function driverOf(s: PortalShipment) {
  return s.driverName ?? s.driver?.fullName ?? "—";
}
function bordersOf(s: PortalShipment) {
  return s.borders.length > 0
    ? s.borders.map((crossing) => crossing.border.name).join(" › ")
    : "—";
}

export function PortalShipmentsView() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useMyShipments();
  const shipments = data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-brand-100 bg-brand-50/70 px-5 py-4 dark:border-brand-900 dark:bg-brand-950/20">
        <p className="text-sm font-medium text-brand-700 dark:text-brand-300">
          Olá{user?.firstName ? `, ${user.firstName}` : ""}!
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">
          Bem-vindo ao seu portal
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Estamos consigo em cada etapa. Acompanhe as suas cargas abaixo.
        </p>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <ErrorState
          title="Não foi possível carregar as suas cargas"
          onAction={() => void refetch()}
        />
      ) : shipments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
          <PackageSearch
            className="mx-auto size-8 text-slate-400"
            aria-hidden
          />
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Ainda não há cargas associadas à sua conta.
          </p>
        </div>
      ) : (
        <>
        <div className="hidden overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm md:block dark:border-slate-700 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  {[
                    "Booking",
                    "Rota",
                    "Horse",
                    "Motorista",
                    "Border",
                    "Ton",
                    "Posição atual",
                    "Estado",
                    "Saída",
                    "Chegada",
                    "",
                  ].map((header) => (
                    <th key={header || "action"} className="whitespace-nowrap border-b border-r border-slate-300 px-3 py-2.5 last:border-r-0 dark:border-slate-700">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shipments.map((shipment) => (
                  <tr key={shipment.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-brand-50/70 dark:odd:bg-slate-900 dark:even:bg-slate-900/60 dark:hover:bg-brand-950/30">
                    <td className="border-b border-r border-slate-200 px-3 py-3 dark:border-slate-800">
                      <Link href={`/portal/${shipment.id}`} className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
                        {shipment.cargo.code}
                      </Link>
                      <span className="mt-0.5 block max-w-40 truncate text-xs text-slate-500 dark:text-slate-400">
                        {shipment.cargo.description ?? "Carga"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap border-b border-r border-slate-200 px-3 py-3 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                      {shipment.cargo.origin} → {shipment.cargo.destination}
                    </td>
                    <td className="whitespace-nowrap border-b border-r border-slate-200 px-3 py-3 font-mono text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
                      {horseOf(shipment)}
                    </td>
                    <td className="whitespace-nowrap border-b border-r border-slate-200 px-3 py-3 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                      {driverOf(shipment)}
                    </td>
                    <td className="whitespace-nowrap border-b border-r border-slate-200 px-3 py-3 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                      {bordersOf(shipment)}
                    </td>
                    <td className="whitespace-nowrap border-b border-r border-slate-200 px-3 py-3 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                      {shipment.tonnage ? `${shipment.tonnage} t` : "—"}
                    </td>
                    <td className="max-w-48 truncate border-b border-r border-slate-200 px-3 py-3 text-slate-600 dark:border-slate-800 dark:text-slate-300" title={shipment.currentPosition ?? ""}>
                      {shipment.currentPosition ?? "—"}
                    </td>
                    <td className="border-b border-r border-slate-200 px-3 py-3 dark:border-slate-800">
                      <StatusBadge tone={tripStatusBadgeTone[shipment.currentStatus]}>
                        {tripStatusMeta[shipment.currentStatus].label}
                      </StatusBadge>
                    </td>
                    <td className="whitespace-nowrap border-b border-r border-slate-200 px-3 py-3 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                      {formatDate(shipment.departureDate)}
                    </td>
                    <td className="whitespace-nowrap border-b border-r border-slate-200 px-3 py-3 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                      {formatDate(shipment.arrivalDate ?? shipment.arrivalEstimate)}
                    </td>
                    <td className="border-b border-slate-200 px-3 py-3 text-right dark:border-slate-800">
                      <Link href={`/portal/${shipment.id}`} className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline dark:text-brand-400">
                        Ver
                        <ArrowRight className="size-3.5" aria-hidden />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-4 md:hidden">
          {shipments.map((shipment) => (
            <Link
              key={shipment.id}
              href={`/portal/${shipment.id}`}
              className="group flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-brand-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {shipment.cargo.code}
                  </p>
                  <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                    {shipment.cargo.description ?? "Carga"}
                  </p>
                </div>
                <StatusBadge tone={tripStatusBadgeTone[shipment.currentStatus]}>
                  {tripStatusMeta[shipment.currentStatus].label}
                </StatusBadge>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300">
                {shipment.cargo.origin} → {shipment.cargo.destination}
              </p>

              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <div><dt className="inline font-medium">Horse: </dt><dd className="inline font-mono">{horseOf(shipment)}</dd></div>
                <div><dt className="inline font-medium">Motorista: </dt><dd className="inline">{driverOf(shipment)}</dd></div>
                <div><dt className="inline font-medium">Border: </dt><dd className="inline">{bordersOf(shipment)}</dd></div>
                <div><dt className="inline font-medium">Ton: </dt><dd className="inline">{shipment.tonnage ? `${shipment.tonnage} t` : "—"}</dd></div>
              </dl>

              {shipment.currentPosition ? (
                <p className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <MapPin className="size-4 shrink-0" aria-hidden />
                  {shipment.currentPosition}
                </p>
              ) : null}

              <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <span className="flex flex-col gap-0.5">
                  <span>Saída: {formatDate(shipment.departureDate)}</span>
                  <span>Chegada: {formatDate(shipment.arrivalEstimate)}</span>
                </span>
                <span className="inline-flex items-center gap-1 font-medium text-brand-600 group-hover:gap-1.5 dark:text-brand-400">
                  Ver detalhe
                  <ArrowRight className="size-3.5" aria-hidden />
                </span>
              </div>
            </Link>
          ))}
        </div>
        </>
      )}
    </div>
  );
}
