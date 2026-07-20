"use client";

import { MapPin, PackageX } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PageLoader } from "@/src/shared/components/page-loader";
import { StatusBadge } from "@/src/shared/components/status-badge";
import { usePublicClientShipments } from "@/hooks/use-public-tracking";
import { formatDate } from "@/utils/format";
import { tripStatusBadgeTone, tripStatusMeta } from "@/utils/trip-status";

export function PublicClientTrackView({ token }: { token: string }) {
  const { data, isLoading, isError } = usePublicClientShipments(token);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
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

      <main className="mx-auto max-w-3xl px-4 py-8">
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
              <ul className="flex flex-col gap-3">
                {data.shipments.map((shipment, index) => (
                  <li
                    key={`${shipment.cargo.code}-${index}`}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-base font-semibold text-slate-950 dark:text-white">
                        {shipment.cargo.code}
                      </p>
                      <StatusBadge
                        tone={tripStatusBadgeTone[shipment.currentStatus]}
                      >
                        {tripStatusMeta[shipment.currentStatus].label}
                      </StatusBadge>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {shipment.cargo.origin} → {shipment.cargo.destination}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                      {shipment.currentPosition ? (
                        <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <MapPin className="size-4 text-brand-500" aria-hidden />
                          {shipment.currentPosition}
                        </span>
                      ) : null}
                      {shipment.arrivalEstimate ? (
                        <span className="text-slate-500 dark:text-slate-400">
                          Chegada prevista: {formatDate(shipment.arrivalEstimate)}
                        </span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
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
