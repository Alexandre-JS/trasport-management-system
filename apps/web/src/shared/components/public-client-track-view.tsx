"use client";

import { MapPin, Navigation, PackageX } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PageLoader } from "@/src/shared/components/page-loader";
import { StatusBadge } from "@/src/shared/components/status-badge";
import { usePublicClientShipments } from "@/hooks/use-public-tracking";
import { formatDate, formatRelativeTime } from "@/utils/format";
import { tripStatusBadgeTone, tripStatusMeta } from "@/utils/trip-status";

export function PublicClientTrackView({ token }: { token: string }) {
  const { data, isLoading, isError } = usePublicClientShipments(token);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Image
            src="/lumac-logo.png"
            alt="LUMAC Transportes & Logística"
            width={876}
            height={284}
            priority
            className="h-8 w-auto"
          />
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Rastreio de cargas
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {isLoading ? (
          <PageLoader />
        ) : isError || !data ? (
          <div className="rounded-lg border border-slate-200 bg-white px-6 py-14 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <PackageX className="mx-auto size-8 text-slate-400" aria-hidden />
            <h1 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">
              Link de rastreio inválido
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
              Este link não corresponde a nenhum cliente. Verifique o endereço
              ou contacte a LUMAC.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Cliente
              </p>
              <h1 className="text-xl font-semibold text-slate-950 dark:text-white">
                {data.clientName}
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {data.shipments.length}{" "}
                {data.shipments.length === 1 ? "carga" : "cargas"} em
                acompanhamento
              </p>
            </div>

            {data.shipments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Ainda não há cargas para acompanhar.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                      <tr>
                        <th className="whitespace-nowrap px-4 py-3">Carga</th>
                        <th className="whitespace-nowrap px-4 py-3">Rota</th>
                        <th className="whitespace-nowrap px-4 py-3">Estado</th>
                        <th className="whitespace-nowrap px-4 py-3">
                          Posição atual
                        </th>
                        <th className="whitespace-nowrap px-4 py-3">
                          Chegada prevista
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {data.shipments.map((shipment, index) => (
                        <tr
                          key={`${shipment.cargo.code}-${index}`}
                          className="align-top"
                        >
                          <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-950 dark:text-white">
                            {shipment.cargo.code}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                            {shipment.cargo.origin} → {shipment.cargo.destination}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <StatusBadge
                              tone={tripStatusBadgeTone[shipment.currentStatus]}
                            >
                              {tripStatusMeta[shipment.currentStatus].label}
                            </StatusBadge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                              <MapPin
                                className="size-4 shrink-0 text-brand-500"
                                aria-hidden
                              />
                              {shipment.currentPosition ?? "—"}
                            </div>
                            {shipment.lastLocation ? (
                              <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate-400 dark:text-slate-500">
                                <span className="inline-flex items-center gap-1">
                                  <Navigation className="size-3" aria-hidden />
                                  GPS{" "}
                                  {formatRelativeTime(
                                    shipment.lastLocation.recordedAt,
                                  )}
                                </span>
                                <a
                                  href={`https://www.openstreetmap.org/?mlat=${shipment.lastLocation.latitude}&mlon=${shipment.lastLocation.longitude}#map=12/${shipment.lastLocation.latitude}/${shipment.lastLocation.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-brand-600 hover:underline dark:text-brand-400"
                                >
                                  Ver no mapa
                                </a>
                              </div>
                            ) : null}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                            {formatDate(shipment.arrivalEstimate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <p className="text-center text-xs text-slate-400 dark:text-slate-500">
              LUMAC Transportes & Logística ·{" "}
              <Link href="https://lumactraspots.com" className="underline">
                lumactraspots.com
              </Link>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
