"use client";

import { MapPin, PackageX } from "lucide-react";
import Image from "next/image";
import { ClientSupportCard } from "@/src/shared/components/client-support-card";
import { GpsLocationCard } from "@/src/shared/components/gps-location-card";
import { PageLoader } from "@/src/shared/components/page-loader";
import { PrintButton } from "@/src/shared/components/print-button";
import { PrintShipmentDocument } from "@/src/shared/components/print-shipment-document";
import { StatusBadge } from "@/src/shared/components/status-badge";
import { usePublicShipment } from "@/hooks/use-public-tracking";
import { formatDate, formatDateTime } from "@/utils/format";
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
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

      <main className="mx-auto max-w-2xl px-4 py-8">
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
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Carga
                  </p>
                  <p className="text-xl font-semibold text-slate-950 dark:text-white">
                    {shipment.cargo.code}
                  </p>
                </div>
                <StatusBadge tone={tripStatusBadgeTone[shipment.currentStatus]}>
                  {tripStatusMeta[shipment.currentStatus].label}
                </StatusBadge>
              </div>

              <div className="mt-4" data-print-hide>
                <PrintButton label="Imprimir acompanhamento" />
              </div>

              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                {shipment.cargo.origin} → {shipment.cargo.destination}
              </p>
              {shipment.currentPosition ? (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <MapPin className="size-4 shrink-0" aria-hidden />
                  {shipment.currentPosition}
                </p>
              ) : null}

              <dl className="mt-5 overflow-hidden rounded-md border border-slate-200 dark:border-slate-700">
                <PublicFact
                  label="Border (Fronteira)"
                  value={borderNames(shipment.borders) ?? "—"}
                />
                <PublicFact
                  label="Data de saída"
                  value={formatDate(departureEvent?.occurredAt)}
                />
                <PublicFact
                  label="Chegada prevista"
                  value={formatDate(shipment.arrivalEstimate)}
                />
              </dl>
            </div>

            {shipment.lastLocation ? (
              <GpsLocationCard
                location={shipment.lastLocation}
                label={shipment.cargo.code}
              />
            ) : null}

            <ClientSupportCard />
            <PrintShipmentDocument
              title="Acompanhamento da carga"
              reference={shipment.cargo.code}
              status={tripStatusMeta[shipment.currentStatus].label}
              route={`${shipment.cargo.origin} → ${shipment.cargo.destination}`}
              sections={[
                {
                  title: "Informação da carga",
                  rows: [
                    { label: "Posição informada", value: shipment.currentPosition ?? "—" },
                    { label: "Border (Fronteira)", value: borderNames(shipment.borders) ?? "—" },
                    { label: "Data de saída", value: formatDate(departureEvent?.occurredAt) },
                    { label: "Chegada prevista", value: formatDate(shipment.arrivalEstimate) },
                  ],
                },
              ]}
              events={shipment.events.map((event) => ({
                date: formatDateTime(event.occurredAt),
                description: event.toStatus ? tripStatusMeta[event.toStatus].label : tripEventTypeLabel[event.type],
                note: event.note ?? undefined,
              }))}
              informational
            />

            {/* TODO: Reativar o mapa quando a API fornecer coordenadas GPS reais. */}

            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                Acompanhamento
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

function PublicFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid border-b border-slate-200 last:border-b-0 sm:grid-cols-[minmax(10rem,38%)_1fr] dark:border-slate-700">
      <dt className="bg-slate-50 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
        {label}
      </dt>
      <dd className="px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100">
        {value}
      </dd>
    </div>
  );
}
