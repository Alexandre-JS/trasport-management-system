"use client";

import { MapPin, Navigation } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { ClientSupportCard } from "@/src/shared/components/client-support-card";
import { ErrorState } from "@/src/shared/components/error-state";
import { GpsLocationCard } from "@/src/shared/components/gps-location-card";
import { PageLoader } from "@/src/shared/components/page-loader";
import { PrintButton } from "@/src/shared/components/print-button";
import { PrintShipmentDocument } from "@/src/shared/components/print-shipment-document";
import { StatusBadge } from "@/src/shared/components/status-badge";
import { usePublicTracking } from "@/hooks/use-public-tracking";
import type { PublicShipment } from "@/types/public-tracking";
import { formatDate, formatDateTime, formatRelativeTime } from "@/utils/format";
import {
  borderNames,
  tripEventTypeLabel,
  tripStatusBadgeTone,
  tripStatusMeta,
} from "@/utils/trip-status";

type TrackingColumn = {
  id: string;
  header: string;
  visible: (shipments: PublicShipment[]) => boolean;
  render: (shipment: PublicShipment) => ReactNode;
};

const columns: TrackingColumn[] = [
  {
    id: "transporter",
    header: "Transporter",
    visible: (items) => items.some((item) => hasValue(item.transporterName)),
    render: (item) => item.transporterName ?? "—",
  },
  {
    id: "horse",
    header: "Horse",
    visible: (items) => items.some((item) => hasValue(item.horsePlate)),
    render: (item) => item.horsePlate ?? "—",
  },
  {
    id: "trailer",
    header: "Trailer",
    visible: (items) => items.some((item) => hasValue(item.trailerPlate)),
    render: (item) => item.trailerPlate ?? "—",
  },
  {
    id: "driver",
    header: "Driver Name",
    visible: (items) => items.some((item) => hasValue(item.driverName)),
    render: (item) => item.driverName ?? "—",
  },
  {
    id: "border",
    header: "Border",
    visible: (items) => items.some((item) => item.borders.length > 0),
    render: (item) => borderNames(item.borders) ?? "—",
  },
  {
    id: "cargo",
    header: "Container / Description",
    visible: (items) => items.some((item) => hasValue(cargoDetail(item))),
    render: (item) => cargoDetail(item) ?? "—",
  },
  {
    id: "route",
    header: "Route",
    visible: () => true,
    render: (item) => `${item.cargo.origin} → ${item.cargo.destination}`,
  },
  {
    id: "status",
    header: "Status",
    visible: () => true,
    render: (item) => (
      <StatusBadge tone={tripStatusBadgeTone[item.currentStatus]}>
        {tripStatusMeta[item.currentStatus].label}
      </StatusBadge>
    ),
  },
  {
    id: "dispatch",
    header: "GMS Dispatch Date",
    visible: (items) => items.some((item) => Boolean(getDepartureDate(item))),
    render: (item) => formatDate(getDepartureDate(item)),
  },
  {
    id: "arrival",
    header: "Arrive Date",
    visible: (items) =>
      items.some((item) => Boolean(item.arrivalDate ?? item.arrivalEstimate)),
    render: (item) => formatDate(item.arrivalDate ?? item.arrivalEstimate),
  },
  {
    id: "position",
    header: "Current Position",
    visible: (items) =>
      items.some((item) => hasValue(item.currentPosition) || item.lastLocation),
    render: (item) => <CurrentPosition shipment={item} />,
  },
];

export function PublicTrackView({ token }: { token: string }) {
  const { data, isLoading, isError, error, refetch } = usePublicTracking(token);
  const shipments = data?.shipments ?? [];
  const visibleColumns = columns.filter((column) => column.visible(shipments));
  const singleShipment = shipments.length === 1 ? shipments[0] : undefined;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Image
            src="/lumac-logo.png"
            alt="LUMAC Transportes & Logística"
            width={876}
            height={284}
            priority
            className="h-8 w-auto"
          />
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Tracking
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {isLoading ? (
          <PageLoader />
        ) : isError || !data ? (
          <ErrorState error={error} onAction={() => void refetch()} />
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Client
                </p>
                <h1 className="text-xl font-semibold text-slate-950 dark:text-white">
                  {data.clientName}
                </h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {shipments.length} {shipments.length === 1 ? "shipment" : "shipments"}
                </p>
              </div>
              {singleShipment ? (
                <div data-print-hide>
                  <PrintButton label="Print tracking" />
                </div>
              ) : null}
            </div>

            {shipments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  There are no shipments to track yet.
                </p>
              </div>
            ) : (
              <TrackingTable shipments={shipments} columns={visibleColumns} />
            )}

            {singleShipment?.lastLocation ? (
              <GpsLocationCard
                location={singleShipment.lastLocation}
                label={
                  cargoDetail(singleShipment) ??
                  singleShipment.horsePlate ??
                  "Current Position"
                }
              />
            ) : null}

            <ClientSupportCard />
            {singleShipment ? <SingleShipmentDetails shipment={singleShipment} /> : null}

            <p className="text-center text-xs text-slate-400 dark:text-slate-500">
              Tracking provided by LUMAC Transportes &amp; Logística
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function TrackingTable({
  shipments,
  columns: visibleColumns,
}: {
  shipments: PublicShipment[];
  columns: TrackingColumn[];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              {visibleColumns.map((column) => (
                <th key={column.id} className="whitespace-nowrap px-4 py-3">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {shipments.map((shipment, index) => (
              <tr key={`${shipment.cargo.code}-${index}`} className="align-top">
                {visibleColumns.map((column) => (
                  <td
                    key={column.id}
                    className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300"
                  >
                    {column.render(shipment)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CurrentPosition({ shipment }: { shipment: PublicShipment }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
        <MapPin className="size-4 shrink-0 text-brand-500" aria-hidden />
        {shipment.currentPosition ?? "—"}
      </div>
      {shipment.lastLocation ? (
        <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Navigation className="size-3" aria-hidden />
            GPS {formatRelativeTime(shipment.lastLocation.recordedAt)}
          </span>
          <a
            href={`https://www.openstreetmap.org/?mlat=${shipment.lastLocation.latitude}&mlon=${shipment.lastLocation.longitude}#map=12/${shipment.lastLocation.latitude}/${shipment.lastLocation.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            View map
          </a>
        </div>
      ) : null}
    </div>
  );
}

function SingleShipmentDetails({ shipment }: { shipment: PublicShipment }) {
  return (
    <>
      <PrintShipmentDocument
        title="Shipment tracking"
        reference={cargoDetail(shipment) ?? shipment.horsePlate ?? "Tracking"}
        status={tripStatusMeta[shipment.currentStatus].label}
        route={`${shipment.cargo.origin} → ${shipment.cargo.destination}`}
        sections={[
          {
            title: "Operational information",
            rows: [
              { label: "Client", value: shipment.clientName },
              { label: "Transporter", value: shipment.transporterName ?? "—" },
              { label: "Horse", value: shipment.horsePlate ?? "—" },
              { label: "Trailer", value: shipment.trailerPlate ?? "—" },
              { label: "Driver Name", value: shipment.driverName ?? "—" },
              { label: "Container / Description", value: cargoDetail(shipment) ?? "—" },
              { label: "Current Position", value: shipment.currentPosition ?? "—" },
              { label: "Border", value: borderNames(shipment.borders) ?? "—" },
              { label: "GMS Dispatch Date", value: formatDate(getDepartureDate(shipment)) },
              { label: "Arrive Date", value: formatDate(shipment.arrivalDate ?? shipment.arrivalEstimate) },
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
          Tracking history
        </h2>
        {shipment.events.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            No milestones have been recorded yet.
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
    </>
  );
}

function cargoDetail(shipment: PublicShipment) {
  return shipment.cargo.containerNumber ?? shipment.cargo.description;
}

function getDepartureDate(shipment: PublicShipment) {
  return (
    shipment.events.find(
      (event) =>
        event.type === "DISPATCHED_ORIGIN" ||
        event.toStatus === "DISPATCHED_ORIGIN",
    )?.occurredAt ?? shipment.departureDate
  );
}

function hasValue(value: string | null | undefined): value is string {
  return Boolean(value?.trim());
}
