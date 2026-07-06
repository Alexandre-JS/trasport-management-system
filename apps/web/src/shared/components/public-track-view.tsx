"use client";

import { MapPin, PackageX } from "lucide-react";
import Image from "next/image";
import { PageLoader } from "@/src/shared/components/page-loader";
import { StatusBadge } from "@/src/shared/components/status-badge";
import { usePublicShipment } from "@/hooks/use-public-tracking";
import { formatDate, formatDateTime } from "@/utils/format";
import {
  borderLabel,
  tripEventTypeLabel,
  tripStatusBadgeTone,
  tripStatusMeta,
} from "@/utils/trip-status";

export function PublicTrackView({ token }: { token: string }) {
  const { data: shipment, isLoading, isError } = usePublicShipment(token);

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

              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                {shipment.cargo.origin} → {shipment.cargo.destination}
              </p>
              {shipment.currentPosition ? (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <MapPin className="size-4 shrink-0" aria-hidden />
                  {shipment.currentPosition}
                </p>
              ) : null}

              <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 dark:border-slate-800">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Fronteira
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                    {shipment.border ? borderLabel[shipment.border] : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Chegada prevista
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">
                    {formatDate(shipment.arrivalEstimate)}
                  </dd>
                </div>
              </dl>
            </div>

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
