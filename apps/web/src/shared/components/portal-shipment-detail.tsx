"use client";

import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { Card } from "@/src/shared/components/card";
import { ErrorState } from "@/src/shared/components/error-state";
import { PageLoader } from "@/src/shared/components/page-loader";
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
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">
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
        {shipment.trackingToken ? (
          <ShareLinkButton token={shipment.trackingToken} />
        ) : null}
      </div>

      <Card className="p-5">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          <Fact label="Mercadoria" value={shipment.cargo.description ?? "—"} />
          <Fact
            label="Fronteira"
            value={borderNames(shipment.borders) ?? "—"}
          />
          <Fact
            label="Tonelagem"
            value={shipment.tonnage ? `${shipment.tonnage} t` : "—"}
          />
          <Fact label="Data de carga" value={formatDate(shipment.loadedDate)} />
          <Fact label="Saída" value={formatDate(shipment.departureDate)} />
          <Fact
            label="Chegada prevista"
            value={formatDate(shipment.arrivalEstimate)}
          />
        </dl>
      </Card>

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
