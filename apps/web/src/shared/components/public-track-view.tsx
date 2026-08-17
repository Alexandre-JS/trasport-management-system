"use client";

import { MapPin, Navigation, PackageX } from "lucide-react";
import Image from "next/image";
import { ClientSupportCard } from "@/src/shared/components/client-support-card";
import { GpsLocationCard } from "@/src/shared/components/gps-location-card";
import { PageLoader } from "@/src/shared/components/page-loader";
import { PrintButton } from "@/src/shared/components/print-button";
import { PrintShipmentDocument } from "@/src/shared/components/print-shipment-document";
import { StatusBadge } from "@/src/shared/components/status-badge";
import { usePublicShipment } from "@/hooks/use-public-tracking";
import { formatDate, formatDateTime, formatRelativeTime } from "@/utils/format";
import {
  borderNames,
  tripEventTypeLabel,
  tripStatusBadgeTone,
  tripStatusMeta,
} from "@/utils/trip-status";

export function PublicTrackView({ token }: { token: string }) {
  const { data: shipment, isLoading, isError } = usePublicShipment(token);
  const departureEvent = shipment?.events.find(
    (event) =>
      event.type === "DISPATCHED_ORIGIN" ||
      event.toStatus === "DISPATCHED_ORIGIN",
  );
  const departureDate = departureEvent?.occurredAt ?? shipment?.departureDate;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Image
            src="/lumac-logo.png"
            alt="LUMAC Transportes & Logística"
            width={876}
            height={284}
            priority
            className="h-8 w-auto"
          />
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Rastreio de carga
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {isLoading ? (
          <PageLoader />
        ) : isError || !shipment ? (
          <div className="rounded-lg border border-slate-200 bg-white px-6 py-14 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <PackageX className="mx-auto size-8 text-slate-400" aria-hidden />
            <h1 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">
              Link de rastreio inválido
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
              Este link não corresponde a nenhuma carga. Verifique o endereço ou
              contacte a LUMAC.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Cliente
                </p>
                <h1 className="text-xl font-semibold text-slate-950 dark:text-white">
                  {shipment.clientName}
                </h1>
              </div>
              <div data-print-hide>
                <PrintButton label="Imprimir acompanhamento" />
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="min-w-[1450px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-3">Cliente</th>
                      <th className="whitespace-nowrap px-4 py-3">Camião</th>
                      <th className="whitespace-nowrap px-4 py-3">Motorista</th>
                      <th className="whitespace-nowrap px-4 py-3">Contentor</th>
                      <th className="whitespace-nowrap px-4 py-3">Rota</th>
                      <th className="whitespace-nowrap px-4 py-3">Estado</th>
                      <th className="whitespace-nowrap px-4 py-3">Posição atual</th>
                      <th className="whitespace-nowrap px-4 py-3">Fronteira</th>
                      <th className="whitespace-nowrap px-4 py-3">Data de saída</th>
                      <th className="whitespace-nowrap px-4 py-3">Chegada prevista</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="align-top">
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-950 dark:text-white">
                        {shipment.clientName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                        {shipment.truckPlate ?? "—"}
                        {shipment.trailerPlate ? (
                          <span className="block text-xs text-slate-400">
                            Reboque: {shipment.trailerPlate}
                          </span>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                        {shipment.driverName ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-700 dark:text-slate-200">
                        {shipment.cargo.containerNumber ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                        {shipment.cargo.origin} → {shipment.cargo.destination}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge tone={tripStatusBadgeTone[shipment.currentStatus]}>
                          {tripStatusMeta[shipment.currentStatus].label}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <MapPin className="size-4 shrink-0 text-brand-500" aria-hidden />
                          {shipment.currentPosition ?? "—"}
                        </div>
                        {shipment.lastLocation ? (
                          <span className="mt-1 inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                            <Navigation className="size-3" aria-hidden />
                            GPS {formatRelativeTime(shipment.lastLocation.recordedAt)}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {borderNames(shipment.borders) ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                        {formatDate(departureDate)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                        {formatDate(shipment.arrivalEstimate)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {shipment.lastLocation ? (
              <GpsLocationCard
                location={shipment.lastLocation}
                label={shipment.cargo.containerNumber ?? shipment.truckPlate ?? "Posição atual"}
              />
            ) : null}

            <ClientSupportCard />
            <PrintShipmentDocument
              title="Acompanhamento da carga"
              reference={shipment.cargo.containerNumber ?? shipment.truckPlate ?? "Carga em acompanhamento"}
              status={tripStatusMeta[shipment.currentStatus].label}
              route={`${shipment.cargo.origin} → ${shipment.cargo.destination}`}
              sections={[
                {
                  title: "Informação da carga",
                  rows: [
                    { label: "Cliente", value: shipment.clientName },
                    { label: "Camião", value: shipment.truckPlate ?? "—" },
                    { label: "Motorista", value: shipment.driverName ?? "—" },
                    { label: "Contentor", value: shipment.cargo.containerNumber ?? "—" },
                    { label: "Reboque", value: shipment.trailerPlate ?? "—" },
                    { label: "Posição informada", value: shipment.currentPosition ?? "—" },
                    { label: "Fronteira", value: borderNames(shipment.borders) ?? "—" },
                    { label: "Data de saída", value: formatDate(departureDate) },
                    { label: "Chegada prevista", value: formatDate(shipment.arrivalEstimate) },
                  ],
                },
              ]}
              events={shipment.events.map((event) => ({
                date: formatDateTime(event.occurredAt),
                description: event.toStatus
                  ? tripStatusMeta[event.toStatus].label
                  : tripEventTypeLabel[event.type],
                note: event.note ?? undefined,
              }))}
              informational
            />

            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                Histórico de acompanhamento
              </h2>
              {shipment.events.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  Ainda não há marcos registados.
                </p>
              ) : (
                <ol className="mt-4 flex flex-col">
                  {shipment.events.map((event, index) => (
                    <li key={event.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className="size-3 rounded-full bg-brand-500" />
                        {index < shipment.events.length - 1 ? (
                          <span className="w-px flex-1 bg-slate-200 dark:bg-slate-700" />
                        ) : null}
                      </div>
                      <div className="pb-6">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {event.toStatus
                            ? tripStatusMeta[event.toStatus].label
                            : tripEventTypeLabel[event.type]}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDateTime(event.occurredAt)}
                          {event.note ? ` · ${event.note}` : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <p className="text-center text-xs text-slate-400 dark:text-slate-500">
              Acompanhamento fornecido por LUMAC Transportes &amp; Logística
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
