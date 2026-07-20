"use client";

import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { Card } from "@/src/shared/components/card";
import { ClientSupportCard } from "@/src/shared/components/client-support-card";
import { ErrorState } from "@/src/shared/components/error-state";
import { GpsLocationCard } from "@/src/shared/components/gps-location-card";
import { PageLoader } from "@/src/shared/components/page-loader";
import { PrintButton } from "@/src/shared/components/print-button";
import { PrintShipmentDocument } from "@/src/shared/components/print-shipment-document";
import { ShareLinkButton } from "@/src/shared/components/share-link-button";
import { StatusBadge } from "@/src/shared/components/status-badge";
import { useMyShipment } from "@/hooks/use-portal";
import { formatDate, formatDateTime } from "@/utils/format";
import {
  borderNames,
  tripEventTypeLabel,
  tripStatusBadgeTone,
  tripStatusMeta,
} from "@/utils/trip-status";

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid border-b border-slate-200 last:border-b-0 sm:grid-cols-[minmax(10rem,34%)_1fr] dark:border-slate-700">
      <dt className="bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
        {label}
      </dt>
      <dd className="min-w-0 break-words px-4 py-3 text-sm text-slate-900 dark:text-slate-100">
        {value}
      </dd>
    </div>
  );
}

export function PortalShipmentDetail({ id }: { id: string }) {
  const { data: shipment, isLoading, isError, refetch } = useMyShipment(id);

  if (isLoading) return <PageLoader />;
  if (isError || !shipment) {
    return (
      <ErrorState
        title="Não foi possível carregar esta carga"
        onAction={() => void refetch()}
      />
    );
  }

  const events = shipment.events ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/portal"
            data-print-hide
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <ArrowLeft className="size-4" aria-hidden />
            As minhas cargas
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">
              {shipment.cargo.code}
            </h1>
            <StatusBadge tone={tripStatusBadgeTone[shipment.currentStatus]}>
              {tripStatusMeta[shipment.currentStatus].label}
            </StatusBadge>
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {shipment.cargo.origin} → {shipment.cargo.destination}
          </p>
          {shipment.currentPosition ? (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
              <MapPin className="size-4 shrink-0" aria-hidden />
              {shipment.currentPosition}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2" data-print-hide>
          <PrintButton label="Imprimir ficha" />
          {shipment.trackingToken ? (
            <ShareLinkButton token={shipment.trackingToken} />
          ) : null}
        </div>
      </div>

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
              { label: "Booking", value: shipment.bookingReference ?? shipment.cargo.code },
              { label: "Transportador", value: shipment.transporterName ?? "—" },
              { label: "Horse", value: shipment.horsePlate ?? shipment.truck?.plateNumber ?? "—" },
              { label: "Trailer", value: shipment.trailerPlate ?? shipment.trailer?.plateNumber ?? "—" },
              { label: "Motorista", value: shipment.driverName ?? shipment.driver?.fullName ?? "—" },
              { label: "Mercadoria", value: shipment.cargo.description ?? "—" },
              { label: "Tonelagem", value: shipment.tonnage ? `${shipment.tonnage} t` : "—" },
              { label: "Posição atual", value: shipment.currentPosition ?? "—" },
              { label: "Border (Fronteira)", value: borderNames(shipment.borders) ?? "—" },
              { label: "Data de saída (Beira)", value: formatDate(shipment.departureDate) },
              { label: "Chegada prevista", value: formatDate(shipment.arrivalEstimate) },
              { label: "Data de descarga", value: formatDate(shipment.dischargeDate) },
            ],
          },
        ]}
        events={events.map((event) => ({
          date: formatDateTime(event.occurredAt),
          description: event.toStatus ? tripStatusMeta[event.toStatus].label : tripEventTypeLabel[event.type],
          note: event.note ?? undefined,
        }))}
        informational
      />

      <Card className="p-5">
        <h2 className="mb-3 text-base font-semibold text-slate-950 dark:text-white">
          Informação da carga
        </h2>
        <dl className="overflow-hidden rounded-md border border-slate-200 dark:border-slate-700">
          <Fact label="Mercadoria" value={shipment.cargo.description ?? "—"} />
          <Fact
            label="Border (Fronteira)"
            value={borderNames(shipment.borders) ?? "—"}
          />
          <Fact
            label="Tonelagem"
            value={shipment.tonnage ? `${shipment.tonnage} t` : "—"}
          />
          <Fact label="Data de carga" value={formatDate(shipment.loadedDate)} />
          <Fact label="Data de saída" value={formatDate(shipment.departureDate)} />
          <Fact
            label="Chegada prevista"
            value={formatDate(shipment.arrivalEstimate)}
          />
        </dl>
      </Card>

      {shipment.lastLocation ? (
        <GpsLocationCard
          location={shipment.lastLocation}
          label={shipment.cargo.code}
        />
      ) : null}

      <Card className="p-5">
        <h2 className="text-base font-semibold text-slate-950 dark:text-white">
          Acompanhamento
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Marcos da sua carga ao longo do percurso.
        </p>
        {events.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Ainda não há marcos registados.
          </p>
        ) : (
          <ol className="mt-4 flex flex-col">
            {events.map((event, index) => (
              <li key={event.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="size-3 rounded-full bg-brand-500" />
                  {index < events.length - 1 ? (
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
      </Card>

    </div>
  );
}
